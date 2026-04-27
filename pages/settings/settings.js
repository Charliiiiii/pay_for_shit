const calc = require('../../utils/calc')
const storage = require('../../utils/storage')
const cloudApi = require('../../utils/cloudApi')

function parseHoursInput(str) {
  const h = parseFloat(String(str).trim())
  return Number.isFinite(h) ? h : NaN
}

Page({
  data: {
    salaryInput: '',
    hoursInput: '',
    hourlyPreview: 0,
    rankShowAmount: true,
  },

  async onShow() {
    const local = storage.getSettings()
    this.applySettingsToView(local)

    // 云端有值时覆盖本地，首次换机可直接拉到配置
    if (cloudApi.hasCloud()) {
      try {
        const remote = await cloudApi.getSettings()
        const merged = storage.setSettings({
          monthlySalary: Number(remote.monthlySalary) || 0,
          workDaysPerMonth: Number(remote.workDaysPerMonth) || 21.75,
          workHoursPerDay: Number(remote.workHoursPerDay) || 8,
        })
        this.applySettingsToView(merged)
      } catch (e) {
        console.warn('[settings] get cloud settings failed', e)
      }
    }
  },

  applySettingsToView(s) {
    const salary = s.monthlySalary > 0 ? String(s.monthlySalary) : ''
    const hours =
      s.workHoursPerDay != null && s.workHoursPerDay > 0
        ? String(s.workHoursPerDay)
        : String(calc.WORK_HOURS_PER_DAY)
    this.setData({
      salaryInput: salary,
      hoursInput: hours,
      rankShowAmount: s.rankShowAmount !== false,
    })
    this.updateHourlyPreview()
  },

  updateHourlyPreview() {
    const n = parseFloat(this.data.salaryInput) || 0
    const hRaw = parseHoursInput(this.data.hoursInput)
    const hours =
      Number.isFinite(hRaw) && hRaw > 0
        ? calc.normalizeWorkHoursPerDay(hRaw)
        : calc.WORK_HOURS_PER_DAY
    this.setData({
      hourlyPreview: n > 0 ? calc.roundMoney(calc.hourlyWage(n, hours)) : 0,
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

  onToggleRankAmount(e) {
    this.setData({ rankShowAmount: !!e.detail.value })
  },

  async onSave() {
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
    const saved = storage.setSettings({
      monthlySalary: n,
      workHoursPerDay,
      rankShowAmount: this.data.rankShowAmount,
    })
    this.setData({ hoursInput: String(workHoursPerDay) })
    this.updateHourlyPreview()

    if (cloudApi.hasCloud()) {
      try {
        await cloudApi.putSettings({
          monthlySalary: saved.monthlySalary,
          workDaysPerMonth: saved.workDaysPerMonth,
          workHoursPerDay: saved.workHoursPerDay,
        })
      } catch (e) {
        console.warn('[settings] put cloud settings failed', e)
        wx.showToast({ title: '本地已保存，云同步失败', icon: 'none' })
        return
      }
    }

    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onClearRecords() {
    wx.showModal({
      title: '确认清空？',
      content: '所有历史摸金记录将被删除，无法恢复。',
      confirmColor: '#a79aa2',
      success: async (res) => {
        if (!res.confirm) return
        storage.clearAllData()

        if (cloudApi.hasCloud()) {
          try {
            await cloudApi.clearRecords()
          } catch (e) {
            console.warn('[settings] clear cloud records failed', e)
            wx.showToast({ title: '本地已清空，云端清空失败', icon: 'none' })
            return
          }
        }

        wx.showToast({ title: '已清空记录', icon: 'none' })
      },
    })
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计时器 — 蹲下不是偷懒，是拿回属于我的剩余价值',
      path: '/pages/index/index',
    }
  },
})
