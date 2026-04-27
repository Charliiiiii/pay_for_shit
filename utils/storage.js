const KEY_SETTINGS = 'pp_user_settings'
const KEY_RECORDS = 'pp_records'

const defaultSettings = () => ({
  monthlySalary: 0,
  workDaysPerMonth: 21.75,
  workHoursPerDay: 8,
  hourlyWage: 0,
  rankShowAmount: true
})

function getSettings() {
  try {
    const raw = wx.getStorageSync(KEY_SETTINGS)
    if (raw && typeof raw === 'object') {
      const merged = { ...defaultSettings(), ...raw }
      const { hourlyWage } = require('./calc')
      merged.hourlyWage = hourlyWage(merged.monthlySalary, merged.workHoursPerDay)
      return merged
    }
  } catch (e) {}
  return defaultSettings()
}

function setSettings(settings) {
  const { hourlyWage } = require('./calc')
  const s = { ...defaultSettings(), ...settings }
  s.hourlyWage = hourlyWage(s.monthlySalary, s.workHoursPerDay)
  wx.setStorageSync(KEY_SETTINGS, s)
  return s
}

function getRecords() {
  try {
    const list = wx.getStorageSync(KEY_RECORDS)
    if (Array.isArray(list)) return list
  } catch (e) {}
  return []
}

function addRecord(record) {
  const list = getRecords()
  list.unshift(record)
  wx.setStorageSync(KEY_RECORDS, list)
  return list
}

function setRecords(records) {
  const list = Array.isArray(records) ? records : []
  wx.setStorageSync(KEY_RECORDS, list)
  return list
}

function clearAllData() {
  wx.removeStorageSync(KEY_RECORDS)
}

function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfWeek(ts) {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfMonth(ts) {
  const d = new Date(ts)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b)
}

function isInWeek(ts, now = Date.now()) {
  return ts >= startOfWeek(now) && ts <= now + 1
}

function isInMonth(ts, now = Date.now()) {
  return ts >= startOfMonth(now) && ts <= now + 1
}

function computeSummary(now = Date.now()) {
  const records = getRecords()
  const { roundMoney } = require('./calc')
  let todayTotal = 0
  let weekTotal = 0
  let monthTotal = 0
  let allTimeTotal = 0
  let bestRecord = null

  for (const r of records) {
    const end = r.endTime || r.startTime
    const earned = roundMoney(r.earnedMoney)
    allTimeTotal = roundMoney(allTimeTotal + earned)
    if (isSameDay(end, now)) todayTotal = roundMoney(todayTotal + earned)
    if (isInWeek(end, now)) weekTotal = roundMoney(weekTotal + earned)
    if (isInMonth(end, now)) monthTotal = roundMoney(monthTotal + earned)

    if (!bestRecord || r.durationSeconds > bestRecord.duration) {
      const d = new Date(end)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      bestRecord = {
        duration: r.durationSeconds,
        earned: earned,
        date: dateStr
      }
    }
  }

  return {
    todayTotal: roundMoney(todayTotal),
    weekTotal: roundMoney(weekTotal),
    monthTotal: roundMoney(monthTotal),
    allTimeTotal: roundMoney(allTimeTotal),
    bestRecord
  }
}

/** 按自然日统计噗噗次数，key 为 YYYY-MM-DD */
function countRecordsByDate() {
  const records = getRecords()
  const map = {}
  for (const r of records) {
    const end = r.endTime || r.startTime
    const d = new Date(end)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map[key] = (map[key] || 0) + 1
  }
  return map
}

function groupRecordsByDate() {
  const { roundMoney } = require('./calc')
  const records = getRecords()
  const map = {}
  for (const r of records) {
    const end = r.endTime || r.startTime
    const d = new Date(end)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map[key]) {
      map[key] = { date: key, items: [], totalEarned: 0, count: 0 }
    }
    map[key].items.push(r)
    map[key].count += 1
    map[key].totalEarned = roundMoney(map[key].totalEarned + r.earnedMoney)
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

module.exports = {
  getSettings,
  setSettings,
  getRecords,
  addRecord,
  setRecords,
  clearAllData,
  computeSummary,
  groupRecordsByDate,
  countRecordsByDate,
  KEY_SETTINGS,
  KEY_RECORDS
}
