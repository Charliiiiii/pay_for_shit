const WORK_DAYS_PER_MONTH = 21.75
const WORK_HOURS_PER_DAY = 8

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/** 每日工时，默认 8，范围约 0.5～24 */
function normalizeWorkHoursPerDay(h) {
  const x = Number(h)
  if (!Number.isFinite(x) || x < 0.5) return WORK_HOURS_PER_DAY
  return Math.min(24, x)
}

function hourlyWage(monthlySalary, workHoursPerDay) {
  const s = Number(monthlySalary) || 0
  const hours = normalizeWorkHoursPerDay(workHoursPerDay)
  if (s <= 0) return 0
  return s / WORK_DAYS_PER_MONTH / hours
}

function earnedMoney(durationSeconds, monthlySalary, workHoursPerDay) {
  const hw = hourlyWage(monthlySalary, workHoursPerDay)
  const sec = Math.max(0, Number(durationSeconds) || 0)
  return roundMoney((sec / 3600) * hw)
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return { minutes: m, seconds: r, text: m > 0 ? `${m}分${r}秒` : `${r}秒` }
}

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(m)}:${pad(r)}`
}

module.exports = {
  WORK_DAYS_PER_MONTH,
  WORK_HOURS_PER_DAY,
  normalizeWorkHoursPerDay,
  roundMoney,
  hourlyWage,
  earnedMoney,
  formatDuration,
  formatClock
}
