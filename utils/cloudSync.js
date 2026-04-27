const cloudApi = require('./cloudApi')
const storage = require('./storage')

function normalizeCloudRecord(raw) {
  return {
    id: String(raw.clientId || raw._id || Date.now()),
    startTime: Number(raw.startTime) || 0,
    endTime: Number(raw.endTime) || 0,
    durationSeconds: Number(raw.durationSeconds) || 0,
    earnedMoney: Number(raw.earnedMoney) || 0,
  }
}

async function pullAllCloudRecords(limitPerPage = 100) {
  let offset = 0
  let total = Number.MAX_SAFE_INTEGER
  const rows = []

  while (offset < total) {
    const res = await cloudApi.listRecords(limitPerPage, offset)
    const items = Array.isArray(res.items) ? res.items : []
    total = Number(res.total) || items.length
    rows.push(...items)
    offset += items.length
    if (!items.length) break
  }
  return rows
}

async function syncRecordsFromCloudToLocal() {
  if (!cloudApi.hasCloud()) return { synced: false, count: storage.getRecords().length }
  const rows = await pullAllCloudRecords(100)
  const normalized = rows
    .map(normalizeCloudRecord)
    .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
  storage.setRecords(normalized)
  return { synced: true, count: normalized.length }
}

module.exports = {
  syncRecordsFromCloudToLocal,
}

