const { buildGlobalLeaderboard } = require('../../utils/leaderboard')
const cloudApi = require('../../utils/cloudApi')
const storage = require('../../utils/storage')

function formatDurationText(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}分${r}秒` : `${r}秒`
}

Page({
  data: {
    rows: [],
    isCloud: false,
    showAmountInRank: true,
  },

  onShow() {
    this.refreshList()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  async refreshList() {
    const settings = storage.getSettings()
    const profile = storage.getProfile()
    const showAmountInRank = settings.rankShowAmount !== false

    if (cloudApi.hasCloud()) {
      try {
        const res = await cloudApi.weekLeaderboard(30)
        const rows = (res.rows || []).map((r, idx) => {
          const isMe = !!r.isMe
          const avatarUrl = r.avatarUrl || (isMe ? profile.avatarUrl || '' : '')
          return {
            ...r,
            rank: r.rank || idx + 1,
            weeklyDisplay: r.weeklyDisplay || Number(r.weekly || 0).toFixed(2),
            durationText: r.durationText || formatDurationText(r.durationSeconds),
            avatarUrl,
          }
        })
        this.setData({ rows, isCloud: true, showAmountInRank })
        return
      } catch (e) {
        console.warn('[rank] load cloud leaderboard failed', e)
      }
    }

    const rows = buildGlobalLeaderboard()
    this.setData({ rows, isCloud: false, showAmountInRank })
  },

  onAvatarError(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (!Number.isFinite(idx) || idx < 0 || idx >= this.data.rows.length) return
    this.setData({
      [`rows[${idx}].avatarUrl`]: '',
    })
  },
})
