Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '计时' },
      { pagePath: '/pages/calendar/calendar', text: '噗噗日历' },
      { pagePath: '/pages/rank/rank', text: '噗噗排行榜' }
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
