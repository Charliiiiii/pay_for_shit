const calc = require('../../utils/calc')
const storage = require('../../utils/storage')
const { syncRecordsFromCloudToLocal } = require('../../utils/cloudSync')

function formatTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

Page({
  data: {
    groups: []
  },

  async onShow() {
    try {
      await syncRecordsFromCloudToLocal()
    } catch (e) {
      console.warn('[history] pull cloud records failed', e)
    }
    this.loadGroups()
  },

  loadGroups() {
    const raw = storage.groupRecordsByDate()
    const groups = raw.map((g) => ({
      ...g,
      totalEarned: calc.roundMoney(g.totalEarned),
      expanded: false,
      items: g.items.map((rec) => {
        const fd = calc.formatDuration(rec.durationSeconds)
        return {
          ...rec,
          timeText: formatTime(rec.endTime || rec.startTime),
          durationText: fd.text,
          earned: calc.roundMoney(rec.earnedMoney).toFixed(2)
        }
      })
    }))
    this.setData({ groups })
  },

  onToggleDay(e) {
    const idx = e.currentTarget.dataset.idx
    const key = `groups[${idx}].expanded`
    const cur = this.data.groups[idx].expanded
    this.setData({ [key]: !cur })
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计算器 — 蹲下不是偷懒，是拿回属于我的剩余价值。',
      path: '/pages/index/index'
    }
  }
})
