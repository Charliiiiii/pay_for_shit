const calc = require('../../utils/calc')
const storage = require('../../utils/storage')

function parseHoursInput(str) {
  const h = parseFloat(String(str).trim())
  return Number.isFinite(h) ? h : NaN
}

Page({
  data: {
    salaryInput: '',
    hoursInput: '',
    hourlyPreview: 0
  },

  onShow() {
    const s = storage.getSettings()
    const salary = s.monthlySalary > 0 ? String(s.monthlySalary) : ''
    const hours =
      s.workHoursPerDay != null && s.workHoursPerDay > 0
        ? String(s.workHoursPerDay)
        : String(calc.WORK_HOURS_PER_DAY)
    this.setData({
      salaryInput: salary,
      hoursInput: hours
    })
    this.updateHourlyPreview()
  },

  updateHourlyPreview() {
    const n = parseFloat(this.data.salaryInput) || 0
    const hRaw = parseHoursInput(this.data.hoursInput)
    const hours = Number.isFinite(hRaw) && hRaw > 0 ? calc.normalizeWorkHoursPerDay(hRaw) : calc.WORK_HOURS_PER_DAY
    this.setData({
      hourlyPreview: n > 0 ? calc.roundMoney(calc.hourlyWage(n, hours)) : 0
    })
  },

  onSalaryInput(e) {
    this.setData({ salaryInput: e.detail.value })
    this.updateHourlyPreview()
  },

  onHoursInput(e) {
    this.setData({ hoursInput: e.detail.value })
    this.updateHourlyPreview()
  },

  onSave() {
    const n = parseFloat(this.data.salaryInput) || 0
    if (n <= 0) {
      wx.showToast({ title: '请输入有效月薪', icon: 'none' })
      return
    }
    const hRaw = parseHoursInput(this.data.hoursInput)
    if (!Number.isFinite(hRaw) || hRaw < 0.5 || hRaw > 24) {
      wx.showToast({ title: '每日工时请填 0.5～24', icon: 'none' })
      return
    }
    const workHoursPerDay = calc.normalizeWorkHoursPerDay(hRaw)
    storage.setSettings({ monthlySalary: n, workHoursPerDay })
    this.setData({ hoursInput: String(workHoursPerDay) })
    wx.showToast({ title: '已保存', icon: 'success' })
    this.updateHourlyPreview()
  },

  onClearRecords() {
    wx.showModal({
      title: '确认清空？',
      content: '所有历史摸金记录将被删除，无法恢复。',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          storage.clearAllData()
          wx.showToast({ title: '已清空记录', icon: 'none' })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计时器 — 蹲下不是偷懒，是拿回属于我的剩余价值',
      path: '/pages/index/index'
    }
  }
})
