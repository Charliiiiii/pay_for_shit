const calc = require('../../utils/calc')

const CANVAS_W = 1080
const CANVAS_H = 1920
const RPX = CANVAS_W / 750

function rpx(n) {
  return Math.round(n * RPX)
}

function wrapText(ctx, text, maxWidth, fontSize, italic) {
  ctx.font = `${italic ? 'italic ' : ''}${fontSize}px sans-serif`
  const words = text.split('')
  const lines = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = words[i]
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function moneyOrHide(hide, valueStr) {
  return hide ? '***' : valueStr
}

Page({
  data: {
    session: null
  },

  onLoad() {
    const raw = getApp().globalData.lastSession
    if (!raw) {
      this.setData({ session: null })
      return
    }
    const session = {
      ...raw,
      earnedDisplay: calc.roundMoney(raw.earned).toFixed(2),
      todayTotal: calc.roundMoney(raw.todayTotal).toFixed(2),
      weekTotal: calc.roundMoney(raw.weekTotal).toFixed(2),
      monthEstimate: calc.roundMoney(raw.monthEstimate).toFixed(2),
      yearFromPace: calc.roundMoney(raw.yearFromPace).toFixed(2)
    }
    this.setData({ session })
  },

  onOk() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onShareImage() {
    const session = this.data.session
    if (!session) return
    wx.showActionSheet({
      itemList: ['显示金额', '隐藏金额（保护隐私）'],
      alertText: '分享图是否展示具体金额？',
      success: (res) => {
        const hideSensitive = res.tapIndex === 1
        wx.showLoading({ title: '生成图片…', mask: true })
        this._renderShareCanvas(session, hideSensitive)
      }
    })
  },

  _renderShareCanvas(session, hideSensitive) {
    const run = () => {
      const query = wx.createSelectorQuery()
      query
        .select('#shareCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            wx.hideLoading()
            wx.showToast({ title: '画布未就绪', icon: 'none' })
            return
          }
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = wx.getSystemInfoSync().pixelRatio || 2
          const W = CANVAS_W
          const H = CANVAS_H
          canvas.width = W * dpr
          canvas.height = H * dpr
          ctx.scale(dpr, dpr)

          const exportPng = () => {
            wx.canvasToTempFilePath(
              {
                canvas,
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height,
                destWidth: W,
                destHeight: H,
                fileType: 'png',
                quality: 1,
                success: (r) => {
                  wx.hideLoading()
                  wx.showShareImageMenu({
                    path: r.tempFilePath,
                    fail: () => {
                      wx.showToast({ title: '可长按图片保存', icon: 'none' })
                    }
                  })
                },
                fail: (err) => {
                  wx.hideLoading()
                  console.error(err)
                  wx.showToast({ title: '导出失败', icon: 'none' })
                }
              },
              this
            )
          }

          const gapS = rpx(14)
          const gapM = rpx(22)
          const gapL = rpx(26)
          const panelW = rpx(620)
          const panelX = (W - panelW) / 2
          const rowH = rpx(48)
          const panelPadV = rpx(30)
          const panelH = panelPadV * 2 + rowH * 4

          ctx.font = `italic ${rpx(28)}px sans-serif`
          const quoteLines = wrapText(ctx, session.quote, panelW - rpx(40), rpx(28), true)
          const quoteLineH = rpx(44)
          const quoteBlockH = quoteLines.length * quoteLineH + gapM

          const hCelebrate = rpx(52)
          const hHead = rpx(40)
          const hMain = rpx(68)
          const hFoot = rpx(30)
          const totalH =
            hCelebrate +
            gapS +
            hHead +
            gapM +
            hMain +
            gapL +
            panelH +
            gapL +
            quoteBlockH +
            gapM +
            hFoot

          let y = (H - totalH) / 2 + hCelebrate * 0.78
          ctx.textBaseline = 'alphabetic'

          ctx.fillStyle = '#f7f5f6'
          ctx.fillRect(0, 0, W, H)

          ctx.textAlign = 'center'
          ctx.fillStyle = '#756a70'
          ctx.font = `bold ${rpx(48)}px sans-serif`
          ctx.fillText('🎉恭喜🎉', W / 2, y)
          y += hCelebrate + gapS

          ctx.fillStyle = '#b5adb2'
          ctx.font = `${rpx(30)}px sans-serif`
          ctx.fillText('本次收益', W / 2, y)
          y += hHead + gapM

          const earnStr = hideSensitive ? '金额已隐藏' : `${session.earnedDisplay}¥`
          const sep = '     ·     '
          const durStr = `蹲了${session.durationText}`
          ctx.textAlign = 'left'
          ctx.font = `900 ${rpx(46)}px sans-serif`
          ctx.fillStyle = hideSensitive ? '#a8a1a5' : '#756a70'
          const w1 = ctx.measureText(earnStr).width
          ctx.font = `${rpx(28)}px sans-serif`
          ctx.fillStyle = '#b8b3b6'
          const w2 = ctx.measureText(sep).width
          ctx.font = `700 ${rpx(42)}px sans-serif`
          ctx.fillStyle = '#8b8186'
          const w3 = ctx.measureText(durStr).width
          const tw = w1 + w2 + w3
          let x = W / 2 - tw / 2
          ctx.font = `900 ${rpx(46)}px sans-serif`
          ctx.fillStyle = hideSensitive ? '#a8a1a5' : '#756a70'
          ctx.fillText(earnStr, x, y)
          x += w1
          ctx.font = `${rpx(28)}px sans-serif`
          ctx.fillStyle = '#b8b3b6'
          ctx.fillText(sep, x, y - rpx(4))
          x += w2
          ctx.font = `700 ${rpx(42)}px sans-serif`
          ctx.fillStyle = '#8b8186'
          ctx.fillText(durStr, x, y)
          ctx.textAlign = 'center'
          y += rpx(20)
          const panelTop = y
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(panelX, panelTop, panelW, panelH)
          ctx.strokeStyle = '#d8d0d4'
          ctx.lineWidth = rpx(2)
          ctx.strokeRect(panelX, panelTop, panelW, panelH)

          let py = panelTop + panelPadV + rowH * 0.72
          const gapKV = rpx(14)

          const drawPanelRow = (label, val) => {
            const valStr = `¥ ${val}`
            ctx.font = `${rpx(28)}px sans-serif`
            ctx.fillStyle = '#8b8186'
            const mL = ctx.measureText(label).width
            ctx.font = `700 ${rpx(28)}px sans-serif`
            ctx.fillStyle = '#756a70'
            const mR = ctx.measureText(valStr).width
            let x0 = W / 2 - (mL + gapKV + mR) / 2
            ctx.textAlign = 'left'
            ctx.font = `${rpx(28)}px sans-serif`
            ctx.fillStyle = '#8b8186'
            ctx.fillText(label, x0, py)
            x0 += mL + gapKV
            ctx.font = `700 ${rpx(28)}px sans-serif`
            ctx.fillStyle = '#756a70'
            ctx.fillText(valStr, x0, py)
            ctx.textAlign = 'center'
            py += rowH
          }

          drawPanelRow('今日累计：', moneyOrHide(hideSensitive, session.todayTotal))
          drawPanelRow('本周累计：', moneyOrHide(hideSensitive, session.weekTotal))
          drawPanelRow('本月预估：', moneyOrHide(hideSensitive, session.monthEstimate))

          const lab4 = '按此节奏，一年约白嫖：'
          const val4 = `¥ ${moneyOrHide(hideSensitive, session.yearFromPace)}`
          ctx.font = `${rpx(24)}px sans-serif`
          ctx.fillStyle = '#a8a1a5'
          const m4a = ctx.measureText(lab4).width
          ctx.font = `700 ${rpx(24)}px sans-serif`
          ctx.fillStyle = '#756a70'
          const m4b = ctx.measureText(val4).width
          let x4 = W / 2 - (m4a + gapKV + m4b) / 2
          ctx.textAlign = 'left'
          ctx.font = `${rpx(24)}px sans-serif`
          ctx.fillStyle = '#a8a1a5'
          ctx.fillText(lab4, x4, py)
          x4 += m4a + gapKV
          ctx.font = `700 ${rpx(24)}px sans-serif`
          ctx.fillStyle = '#756a70'
          ctx.fillText(val4, x4, py)
          ctx.textAlign = 'center'

          y = panelTop + panelH + gapL
          ctx.fillStyle = '#8b8186'
          ctx.font = `italic ${rpx(28)}px sans-serif`
          let qy = y + rpx(28)
          quoteLines.forEach((ln) => {
            ctx.fillText(`「${ln}」`, W / 2, qy)
            qy += quoteLineH
          })

          y = qy + gapM
          ctx.fillStyle = '#a8a1a5'
          ctx.font = `${rpx(22)}px sans-serif`
          ctx.fillText('带薪噗噗计算器', W / 2, y)

          exportPng()
        })
    }
    setTimeout(run, 80)
  },

  onShareAppMessage() {
    return {
      title: '带薪噗噗计时器 — 蹲下不是偷懒，是拿回属于我的剩余价值',
      path: '/pages/index/index'
    }
  }
})
