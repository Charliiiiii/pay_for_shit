function pad2(n) {
  return String(n).padStart(2, '0')
}

function dateKey(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

/**
 * @param {number} year
 * @param {number} month 1-12
 * @param {Record<string, number>} countMap dateKey -> count
 */
function buildMonthGrid(year, month, countMap) {
  const first = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0).getDate()
  const monFirst = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < monFirst; i++) {
    cells.push({ type: 'pad', cellKey: `pad-${year}-${month}-${i}` })
  }
  for (let d = 1; d <= lastDay; d++) {
    const key = dateKey(year, month, d)
    const count = countMap[key] || 0
    const show = Math.min(count, 14)
    const poopArray = count > 0 ? new Array(show).fill('💩') : []
    const overflow = count > show ? count - show : 0
    cells.push({
      type: 'day',
      cellKey: key,
      d,
      dateKey: key,
      count,
      poopArray,
      overflow
    })
  }
  let padIdx = 0
  while (cells.length % 7 !== 0) {
    cells.push({ type: 'pad', cellKey: `pad-end-${year}-${month}-${padIdx++}` })
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

module.exports = { buildMonthGrid, dateKey }
