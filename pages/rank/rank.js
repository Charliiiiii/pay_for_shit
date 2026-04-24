const { buildGlobalLeaderboard } = require('../../utils/leaderboard')

Page({
  data: {
    rows: []
  },

  onShow() {
    this.refreshList()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  refreshList() {
    const rows = buildGlobalLeaderboard()
    this.setData({ rows })
  },

  onScopeAll() {
    this.refreshList()
  },

  onScopeFriends() {
    wx.showToast({ title: '敬请期待', icon: 'none' })
  }
})
