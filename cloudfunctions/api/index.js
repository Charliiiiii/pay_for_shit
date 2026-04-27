const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function normalizeWorkHoursPerDay(h) {
  const x = Number(h)
  if (!Number.isFinite(x) || x < 0.5) return 8
  return Math.min(24, x)
}

function hourlyWage(monthlySalary, workHoursPerDay) {
  const s = Number(monthlySalary) || 0
  const hours = normalizeWorkHoursPerDay(workHoursPerDay)
  if (s <= 0) return 0
  return s / 21.75 / hours
}

function formatDurationText(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}分${r}秒` : `${r}秒`
}

function startOfWeek(ts) {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function chunkArray(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size))
  }
  return out
}

async function runInBatches(list, batchSize, worker) {
  const chunks = chunkArray(list, batchSize)
  for (const chunk of chunks) {
    await Promise.all(chunk.map(worker))
  }
}

async function getMySettings(openid) {
  const res = await db.collection('settings').where({ _openid: openid }).limit(1).get()
  const raw = res.data[0] || {
    monthlySalary: 0,
    workDaysPerMonth: 21.75,
    workHoursPerDay: 8,
  }
  const workHoursPerDay = normalizeWorkHoursPerDay(raw.workHoursPerDay)
  return {
    monthlySalary: Number(raw.monthlySalary) || 0,
    workDaysPerMonth: Number(raw.workDaysPerMonth) || 21.75,
    workHoursPerDay,
    hourlyWage: roundMoney(hourlyWage(raw.monthlySalary, workHoursPerDay)),
  }
}

async function saveMySettings(openid, data) {
  const monthlySalary = Number(data.monthlySalary) || 0
  const workDaysPerMonth = Number(data.workDaysPerMonth) > 0 ? Number(data.workDaysPerMonth) : 21.75
  const workHoursPerDay = normalizeWorkHoursPerDay(data.workHoursPerDay)
  const row = {
    monthlySalary,
    workDaysPerMonth,
    workHoursPerDay,
    hourlyWage: roundMoney(hourlyWage(monthlySalary, workHoursPerDay)),
    updatedAt: Date.now(),
  }

  const res = await db.collection('settings').where({ _openid: openid }).limit(1).get()
  if (res.data[0]) {
    await db.collection('settings').doc(res.data[0]._id).update({ data: row })
  } else {
    await db.collection('settings').add({ data: { _openid: openid, ...row } })
  }
  return row
}

async function batchUpsertRecords(openid, data) {
  const list = Array.isArray(data.records) ? data.records : []
  const uniqueMap = {}
  for (const rec of list) {
    if (rec && rec.id) uniqueMap[rec.id] = rec
  }
  const normalizedList = Object.values(uniqueMap)
  const allClientIds = normalizedList.map((r) => r.id)

  const existingClientIdSet = new Set()
  const idBatches = chunkArray(allClientIds, 50)
  for (const ids of idBatches) {
    const exists = await db
      .collection('records')
      .where({ _openid: openid, clientId: _.in(ids) })
      .get()
    exists.data.forEach((x) => existingClientIdSet.add(x.clientId))
  }

  let inserted = 0
  let skipped = 0

  const toInsert = []
  for (const rec of normalizedList) {
    if (!rec || !rec.id) {
      skipped += 1
      continue
    }
    if (existingClientIdSet.has(rec.id)) {
      skipped += 1
      continue
    }
    toInsert.push(rec)
  }

  await runInBatches(toInsert, 20, async (rec) => {
    try {
      await db.collection('records').add({
        data: {
          _openid: openid,
          clientId: rec.id,
          startTime: Number(rec.startTime) || 0,
          endTime: Number(rec.endTime) || 0,
          durationSeconds: Number(rec.durationSeconds) || 0,
          earnedMoney: roundMoney(rec.earnedMoney),
          createdAt: Date.now(),
        },
      })
      inserted += 1
    } catch (e) {
      const msg = String((e && e.message) || e || '')
      if (msg.includes('duplicate key')) {
        skipped += 1
        return
      }
      throw e
    }
  })

  return { inserted, skipped }
}

async function listMyRecords(openid, data) {
  const limit = Math.min(Math.max(Number(data.limit) || 100, 1), 200)
  const offset = Math.max(Number(data.offset) || 0, 0)

  const [countRes, listRes] = await Promise.all([
    db.collection('records').where({ _openid: openid }).count(),
    db
      .collection('records')
      .where({ _openid: openid })
      .orderBy('endTime', 'desc')
      .skip(offset)
      .limit(limit)
      .get(),
  ])

  return {
    total: countRes.total,
    items: listRes.data,
  }
}

async function clearMyRecords(openid) {
  let deleted = 0
  while (true) {
    const res = await db.collection('records').where({ _openid: openid }).limit(100).get()
    const rows = res.data
    if (!rows.length) break
    await Promise.all(rows.map((r) => db.collection('records').doc(r._id).remove()))
    deleted += rows.length
  }
  return { deleted }
}

async function getWeekLeaderboard(data, openid) {
  const limit = Math.min(Math.max(Number(data.limit) || 30, 1), 100)
  const now = Date.now()
  const weekStart = startOfWeek(now)
  const weekEnd = now + 1

  // 直接在数据库端聚合，避免把整周全量记录拉回云函数导致超时
  const agg = await db
    .collection('records')
    .aggregate()
    .match({ endTime: _.gte(weekStart).and(_.lte(weekEnd)) })
    .group({
      _id: '$_openid',
      weekly: $.sum('$earnedMoney'),
      durationSeconds: $.sum('$durationSeconds'),
      sessions: $.sum(1),
    })
    .sort({ durationSeconds: -1, sessions: -1, weekly: -1 })
    .limit(limit)
    .end()

  const groupedRows = Array.isArray(agg.list) ? agg.list : []
  const openidList = groupedRows.map((r) => r._id)
  const nicknameMap = {}
  if (openidList.length > 0) {
    const openidBatches = chunkArray(openidList, 100)
    for (const ids of openidBatches) {
      const pRes = await db.collection('profiles').where({ _openid: _.in(ids) }).get()
      pRes.data.forEach((p) => {
        nicknameMap[p._openid] = p.nickname || null
      })
    }
  }

  const rows = groupedRows
    .map((r) => {
      const rowOpenid = r._id
      const weekly = roundMoney(r.weekly)
      const baseName = nicknameMap[rowOpenid] || `用户${String(rowOpenid).slice(-6)}`
      return {
        id: rowOpenid,
        name: rowOpenid === openid ? `${baseName}（我）` : baseName,
        weekly,
        durationSeconds: Math.max(0, Math.floor(Number(r.durationSeconds) || 0)),
        durationText: formatDurationText(r.durationSeconds),
        sessions: r.sessions,
        weeklyDisplay: weekly.toFixed(2),
        isMe: rowOpenid === openid,
      }
    })
    .sort((a, b) => {
      if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds
      return b.sessions - a.sessions
    })
    .slice(0, limit)
    .map((r, idx) => ({ ...r, rank: idx + 1 }))

  return { rows }
}

async function saveProfile(openid, data) {
  const nickname = String(data.nickname || '').trim().slice(0, 32)
  if (!nickname) throw new Error('nickname required')
  const res = await db.collection('profiles').where({ _openid: openid }).limit(1).get()
  if (res.data[0]) {
    await db.collection('profiles').doc(res.data[0]._id).update({ data: { nickname, updatedAt: Date.now() } })
  } else {
    await db.collection('profiles').add({ data: { _openid: openid, nickname, updatedAt: Date.now() } })
  }
  return { nickname }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = event.action
  const data = event.data || {}

  try {
    if (!OPENID) {
      return { ok: false, message: 'openid not found' }
    }

    if (action === 'settings.get') {
      return { ok: true, data: await getMySettings(OPENID) }
    }
    if (action === 'settings.put') {
      return { ok: true, data: await saveMySettings(OPENID, data) }
    }
    if (action === 'records.batchUpsert') {
      return { ok: true, data: await batchUpsertRecords(OPENID, data) }
    }
    if (action === 'records.list') {
      return { ok: true, data: await listMyRecords(OPENID, data) }
    }
    if (action === 'records.clear') {
      return { ok: true, data: await clearMyRecords(OPENID) }
    }
    if (action === 'leaderboard.week') {
      return { ok: true, data: await getWeekLeaderboard(data, OPENID) }
    }
    if (action === 'profile.put') {
      return { ok: true, data: await saveProfile(OPENID, data) }
    }

    return { ok: false, message: `unknown action: ${String(action)}` }
  } catch (err) {
    return {
      ok: false,
      message: err && err.message ? err.message : 'cloud function error',
    }
  }
}
