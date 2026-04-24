const calc = require('../../utils/calc')
const storage = require('../../utils/storage')
const quotes = require('../../utils/quotes')

const POOP_RAIN_COUNT = 24

function buildPoopRain() {
  const drops = []
  for (let i = 0; i < POOP_RAIN_COUNT; i++) {
    const left = +(Math.random() * 100).toFixed(2)
    /* 下落慢一点：约 5.5～11 秒一轮 */
    const duration = +(5.5 + Math.random() * 5.5).toFixed(2)
    const delay = +(-Math.random() * duration).toFixed(2)
    const size = 40 + Math.floor(Math.random() * 28)
    const opacity = +(0.72 + Math.random() * 0.26).toFixed(2)
    drops.push({
      id: `p${i}-${Date.now()}`,
      style: `left:${left}%;animation-duration:${duration}s;animation-delay:${delay}s;font-size:${size}rpx;opacity:${opacity};`
    })
  }
  return drops
}

Page({
  data: {
    isRunning: false,
    displayClock: '00:00',
    durationSeconds: 0,
    previewEarn: '0.00',
    summary: {
      todayTotal: 0,
      weekTotal: 0,
      monthTotal: 0,
      allTimeTotal: 0,
      bestRecord: null
    },
    lastRecord: null,
    monthlySalary: 0,
    workHoursPerDay: 8,
    poopRain: []
  },

  timerId: null,
  sessionStart: 0,

  onShow() {
    this.refreshStats()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onUnload() {
    this.clearTick()
  },

  onHide() {
    // 计时在后台继续：不清理 tick
  },

  refreshStats() {
    const settings = storage.getSettings()
    const summary = storage.computeSummary()
    const records = storage.getRecords()
    let lastRecord = null
    if (records.length > 0) {
      const r = records[0]
      const fd = calc.formatDuration(r.durationSeconds)
      lastRecord = {
        durationText: fd.text,
        earned: calc.roundMoney(r.earnedMoney)
      }
    }
    let best = summary.bestRecord
    if (best) {
      const fd = calc.formatDuration(best.duration)
      best = { ...best, durationText: fd.text, earned: calc.roundMoney(best.earned) }
    }
    this.setData({
      monthlySalary: settings.monthlySalary,
      workHoursPerDay: settings.workHoursPerDay || 8,
      summary: { ...summary, bestRecord: best },
      lastRecord
    })
  },

  clearTick() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  },

  tick() {
    const durationSeconds = Math.floor((Date.now() - this.sessionStart) / 1000)
    const previewEarn = calc
      .earnedMoney(durationSeconds, this.data.monthlySalary, this.data.workHoursPerDay)
      .toFixed(2)
    this.setData({
      durationSeconds,
      displayClock: calc.formatClock(durationSeconds),
      previewEarn
    })
  },

  onToggleTimer() {
    const settings = storage.getSettings()
    if (!settings.monthlySalary || settings.monthlySalary <= 0) {
      wx.showModal({
        title: '先设置月薪',
        content: '需要月薪才能计算「摸金」金额，是否去设置？',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/settings/settings' })
        }
      })
      return
    }

    if (!this.data.isRunning) {
      try {
        wx.vibrateShort({ type: 'medium' })
      } catch (e) {}
      this.sessionStart = Date.now()
      this.setData({
        isRunning: true,
        durationSeconds: 0,
        displayClock: '00:00',
        previewEarn: '0.00',
        poopRain: buildPoopRain()
      })
      this.clearTick()
      this.timerId = setInterval(() => this.tick(), 1000)
      this.tick()
      return
    }

    this.finishSession()
  },

  onEndOnly() {
    this.finishSession()
  },

  finishSession() {
    if (!this.data.isRunning) return
    this.clearTick()
    const durationSeconds = Math.floor((Date.now() - this.sessionStart) / 1000)
    const earned = calc.earnedMoney(
      durationSeconds,
      this.data.monthlySalary,
      this.data.workHoursPerDay
    )
    if (durationSeconds <= 0) {
      this.setData({ isRunning: false, poopRain: [] })
      return
    }

    try {
      wx.vibrateShort({ type: 'heavy' })
    } catch (e) {}

    const record = {
      id: `${Date.now()}`,
      startTime: this.sessionStart,
      endTime: Date.now(),
      durationSeconds,
      earnedMoney: earned
    }
    storage.addRecord(record)
    const summary = storage.computeSummary()
    const monthEstimate = calc.roundMoney(summary.weekTotal * (30 / 7))
    const yearFromPace = calc.roundMoney(earned * 252)

    const fd = calc.formatDuration(durationSeconds)
    getApp().globalData.lastSession = {
      earned,
      durationSeconds,
      durationText: fd.text,
      quote: quotes.randomQuote(),
      todayTotal: summary.todayTotal,
      weekTotal: summary.weekTotal,
      monthEstimate,
      yearFromPace,
      recordId: record.id
    }

    this.setData({ isRunning: false, poopRain: [] })
    wx.navigateTo({ url: '/pages/result/result' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计时器 — 蹲下不是偷懒，是拿回属于我的剩余价值',
      path: '/pages/index/index'
    }
  }
})
