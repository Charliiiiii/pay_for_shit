Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '计时' },
      { pagePath: '/pages/calendar/calendar', text: '日历' },
      { pagePath: '/pages/rank/rank', text: '排行榜' },
      { pagePath: '/pages/mine/mine', text: '我的' }
    ]
  },

  methods: {
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index)
      const item = this.data.list[idx]
      if (!item) return
      wx.switchTab({ url: item.pagePath })
      this.setData({ selected: idx })
    }
  }
})
