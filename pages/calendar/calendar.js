const storage = require('../../utils/storage')
const { buildMonthGrid } = require('../../utils/monthGrid')

Page({
  data: {
    year: 0,
    month: 0,
    weeks: [],
    weekLabels: ['一', '二', '三', '四', '五', '六', '日']
  },

  onLoad() {
    const t = new Date()
    this.setData({ year: t.getFullYear(), month: t.getMonth() + 1 })
  },

  onShow() {
    if (!this.data.year) {
      const t = new Date()
      this.setData({ year: t.getFullYear(), month: t.getMonth() + 1 })
    }
    this.refreshGrid()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  refreshGrid() {
    const { year, month } = this.data
    const countMap = storage.countRecordsByDate()
    const weeks = buildMonthGrid(year, month, countMap)
    this.setData({ weeks })
  },

  onPrevMonth() {
    let { year, month } = this.data
    month -= 1
    if (month < 1) {
      month = 12
      year -= 1
    }
    this.setData({ year, month })
    this.refreshGrid()
  },

  onNextMonth() {
    let { year, month } = this.data
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    this.setData({ year, month })
    this.refreshGrid()
  }
})
