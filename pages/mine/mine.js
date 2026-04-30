const calc = require('../../utils/calc')
const storage = require('../../utils/storage')
const cloudApi = require('../../utils/cloudApi')
const { syncRecordsFromCloudToLocal } = require('../../utils/cloudSync')

function parseHoursInput(str) {
  const h = parseFloat(String(str).trim())
  return Number.isFinite(h) ? h : NaN
}

function isLocalAvatarPath(path) {
  return typeof path === 'string' && path.startsWith('wxfile://')
}

function isDevtoolsTmpAvatarUrl(path) {
  return typeof path === 'string' && /^https?:\/\/127\.0\.0\.1:\d+\/__tmp__\//.test(path)
}

function downloadTempFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(res.tempFilePath)
          return
        }
        reject(new Error(`download status ${res.statusCode}`))
      },
      fail: reject,
    })
  })
}

async function uploadAvatarIfNeeded(avatarUrl) {
  let filePath = avatarUrl
  if (isDevtoolsTmpAvatarUrl(avatarUrl)) {
    filePath = await downloadTempFile(avatarUrl)
  }
  if (!isLocalAvatarPath(filePath)) return avatarUrl
  if (!wx.cloud || typeof wx.cloud.uploadFile !== 'function') {
    throw new Error('云上传不可用，请检查 wx.cloud.init')
  }
  const ext = avatarUrl.includes('.png') ? 'png' : 'jpg'
  const cloudPath = `avatars/${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`
  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath,
  })
  return res.fileID || avatarUrl
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

Page({
  data: {
    salaryInput: '',
    hoursInput: '',
    hourlyPreview: 0,
    rankShowAmount: true,
    nicknameInput: '',
    avatarUrl: '',
    summary: {
      todayTotal: 0,
      weekTotal: 0,
      monthTotal: 0,
      allTimeTotal: 0,
    },
    recordCount: 0,
    recentRecords: [],
  },

  async onShow() {
    const local = storage.getSettings()
    this.applySettingsToView(local)
    const localProfile = storage.getProfile()
    this.setData({
      nicknameInput: localProfile.nickname || '',
      avatarUrl: localProfile.avatarUrl || '',
    })

    try {
      await syncRecordsFromCloudToLocal()
    } catch (e) {
      console.warn('[mine] pull cloud records failed', e)
    }
    this.refreshRecordView()

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
        console.warn('[mine] get cloud settings failed', e)
      }

      try {
        const remoteProfile = await cloudApi.getProfile()
        const mergedProfile = storage.setProfile(remoteProfile || {})
        this.setData({
          nicknameInput: mergedProfile.nickname || '',
          avatarUrl: mergedProfile.avatarUrl || '',
        })
      } catch (e) {
        console.warn('[mine] get cloud profile failed', e)
      }
    }

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
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

  refreshRecordView() {
    const summary = storage.computeSummary()
    const records = storage.getRecords()
    const recentRecords = records.slice(0, 5).map((rec) => {
      const fd = calc.formatDuration(rec.durationSeconds)
      return {
        id: rec.id,
        timeText: formatTime(rec.endTime || rec.startTime),
        durationText: fd.text,
        earned: calc.roundMoney(rec.earnedMoney).toFixed(2),
      }
    })
    this.setData({
      summary,
      recordCount: records.length,
      recentRecords,
    })
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

  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  onChooseAvatar(e) {
    const avatarUrl = (e.detail && e.detail.avatarUrl) || ''
    if (!avatarUrl) return
    this.setData({ avatarUrl })
  },

  onAvatarLoadError() {
    this.setData({ avatarUrl: '' })
    const nickname = String(this.data.nicknameInput || '').trim()
    storage.setProfile({ nickname, avatarUrl: '' })
    wx.showToast({ title: '头像已失效，请重新选择', icon: 'none' })
  },

  async onSaveAll() {
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

    const nickname = String(this.data.nicknameInput || '').trim()
    let avatarUrl = String(this.data.avatarUrl || '').trim()

    if (cloudApi.hasCloud()) {
      if (avatarUrl) {
        try {
          avatarUrl = await uploadAvatarIfNeeded(avatarUrl)
        } catch (e) {
          console.warn('[mine] upload avatar failed', e)
          wx.showToast({ title: '设置已保存，头像上传失败', icon: 'none' })
          return
        }
      }

      const localProfile = storage.setProfile({ nickname, avatarUrl })
      this.setData({
        nicknameInput: localProfile.nickname,
        avatarUrl: localProfile.avatarUrl,
      })

      try {
        await cloudApi.putSettings({
          monthlySalary: saved.monthlySalary,
          workDaysPerMonth: saved.workDaysPerMonth,
          workHoursPerDay: saved.workHoursPerDay,
        })
        await cloudApi.putProfile(localProfile)
      } catch (e) {
        console.warn('[mine] put cloud data failed', e)
        wx.showToast({ title: '本地已保存，云同步失败', icon: 'none' })
        return
      }
    } else {
      const localProfile = storage.setProfile({ nickname, avatarUrl })
      this.setData({
        nicknameInput: localProfile.nickname,
        avatarUrl: localProfile.avatarUrl,
      })
    }

    wx.showToast({ title: '已保存', icon: 'success' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onClearRecords() {
    wx.showModal({
      title: '确认清空？',
      content: '所有历史摸金记录将被删除，无法恢复。',
      confirmColor: '#a3492c',
      success: async (res) => {
        if (!res.confirm) return
        storage.clearAllData()

        if (cloudApi.hasCloud()) {
          try {
            await cloudApi.clearRecords()
          } catch (e) {
            console.warn('[mine] clear cloud records failed', e)
            wx.showToast({ title: '本地已清空，云端清空失败', icon: 'none' })
            return
          }
        }

        this.refreshRecordView()
        wx.showToast({ title: '已清空记录', icon: 'none' })
      },
    })
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计算器 — 蹲下不是偷懒，是拿回属于我的剩余价值',
      path: '/pages/index/index',
    }
  },
})
