const CLOUD_ENV_ID = 'cloud1-d2gb16cta22dd6264'

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true,
      })
    } else {
      console.warn('请升级基础库到 2.2.3 以上以使用云能力')
    }
  },
  globalData: {
    lastSession: null,
  },
})
