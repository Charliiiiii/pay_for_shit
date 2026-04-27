const storage = require('./storage')
const calc = require('./calc')

function startOfWeek(ts) {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function isInWeek(ts, now = Date.now()) {
  return ts >= startOfWeek(now) && ts <= now + 1
}

const FAKE_NAMES = [
  '摸鱼练习生',
  '带薪停更中',
  '厕所所长',
  '剩余价值回收员',
  '工位失踪人口',
  '蹲坑哲学家',
  '马桶思想家',
  '带薪养生家',
  '资本反向收割机',
  '今日已蹲满',
  '腿麻荣誉会员',
  '摸金校尉·分部'
]

function weekSessionCount(records, now = Date.now()) {
  let n = 0
  for (const r of records) {
    const t = r.endTime || r.startTime
    if (isInWeek(t, now)) n += 1
  }
  return n
}

function weekEarnedTotal(records, now = Date.now()) {
  let s = 0
  for (const r of records) {
    const t = r.endTime || r.startTime
    if (isInWeek(t, now)) s += Number(r.earnedMoney) || 0
  }
  return calc.roundMoney(s)
}

function weekDurationTotal(records, now = Date.now()) {
  let s = 0
  for (const r of records) {
    const t = r.endTime || r.startTime
    if (isInWeek(t, now)) s += Number(r.durationSeconds) || 0
  }
  return Math.max(0, Math.floor(s))
}

/**
 * 默认「全站」：本机真实「我」+ 模拟用户，按本周摸金排序（示意）
 */
function buildGlobalLeaderboard() {
  const records = storage.getRecords()
  const summary = storage.computeSummary()
  const myWeekly = summary.weekTotal
  const mySessions = weekSessionCount(records)
  const myDuration = weekDurationTotal(records)

  const rows = []
  for (let i = 0; i < FAKE_NAMES.length; i++) {
    const jitter = 0.35 + Math.random() * 1.45
    const weekly = calc.roundMoney(Math.max(0.01, myWeekly * jitter + (Math.random() - 0.5) * 3))
    const durationSeconds = Math.max(30, Math.floor(myDuration * (0.3 + Math.random() * 1.8)) + i * 13)
    rows.push({
      id: `npc-${i}`,
      name: FAKE_NAMES[i],
      weekly,
      durationSeconds,
      sessions: Math.max(1, Math.floor(mySessions * (0.3 + Math.random() * 2)) + i),
      isMe: false
    })
  }

  rows.push({
    id: 'me',
    name: '我（本机）',
    weekly: myWeekly,
    durationSeconds: myDuration,
    sessions: mySessions,
    isMe: true
  })

  rows.sort((a, b) => {
    if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds
    return b.sessions - a.sessions
  })

  return rows.map((r, idx) => ({
    ...r,
    rank: idx + 1,
    weeklyDisplay: calc.roundMoney(r.weekly).toFixed(2),
    durationText: calc.formatDuration(r.durationSeconds).text
  }))
}

module.exports = {
  buildGlobalLeaderboard,
  weekSessionCount,
  weekEarnedTotal,
  weekDurationTotal
}
