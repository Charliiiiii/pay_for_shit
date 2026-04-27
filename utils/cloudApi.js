function hasCloud() {
  return typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.callFunction === 'function'
}

function call(action, data) {
  if (!hasCloud()) {
    return Promise.reject(new Error('云能力不可用：请检查 wx.cloud.init'))
  }
  return wx.cloud
    .callFunction({
      name: 'api',
      data: {
        action,
        data: data || {},
      },
    })
    .then((res) => {
      const result = (res && res.result) || {}
      if (!result.ok) {
        throw new Error(result.message || '云函数调用失败')
      }
      return result.data
    })
}

module.exports = {
  hasCloud,
  getSettings() {
    return call('settings.get')
  },
  putSettings(payload) {
    return call('settings.put', payload)
  },
  batchUpsertRecords(records) {
    return call('records.batchUpsert', { records })
  },
  listRecords(limit, offset) {
    return call('records.list', { limit, offset })
  },
  clearRecords() {
    return call('records.clear')
  },
  weekLeaderboard(limit) {
    return call('leaderboard.week', { limit })
  },
  putProfile(nickname) {
    return call('profile.put', { nickname })
  },
}
