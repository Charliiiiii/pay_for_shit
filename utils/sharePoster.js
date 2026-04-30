/**
 * 带薪蹲厕 — 分享海报绘制（1080×1920 逻辑坐标）
 * 两版布局一致：炫耀版 / 低调版（hideSensitive）
 */

function formatMinutesForPoster(durationSeconds) {
  const s = Math.max(0, Math.floor(Number(durationSeconds) || 0))
  if (s === 0) return '0'
  const min = s / 60
  if (min < 1) return min.toFixed(1)
  const rounded = Math.round(min * 10) / 10
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) return String(Math.round(rounded))
  return rounded.toFixed(1)
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function fillEllipse(ctx, cx, cy, rx, ry, fillStyle) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, ry / rx)
  ctx.beginPath()
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.fillStyle = fillStyle
  ctx.fill()
  ctx.restore()
}

function drawGrid(ctx, W, H) {
  ctx.save()
  ctx.strokeStyle = 'rgba(30, 22, 18, 0.045)'
  ctx.lineWidth = 1
  const step = 36
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(W, y + 0.5)
    ctx.stroke()
  }
  ctx.restore()
}

function drawDecorShow(ctx, cx, cy, rpx) {
  ctx.save()
  ctx.translate(cx, cy)

  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e0d4c8'
  ctx.lineWidth = rpx(4)
  roundRectPath(ctx, -rpx(150), rpx(10), rpx(300), rpx(88), rpx(28))
  ctx.fill()
  ctx.stroke()

  fillEllipse(ctx, 0, rpx(58), rpx(100), rpx(32), '#f0e6dc')

  ctx.fillStyle = '#ffd6bd'
  ctx.beginPath()
  ctx.arc(-rpx(36), -rpx(48), rpx(44), 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#5c524e'
  roundRectPath(ctx, -rpx(70), -rpx(30), rpx(88), rpx(100), rpx(36))
  ctx.fill()

  ctx.fillStyle = '#1e1612'
  ctx.fillRect(rpx(8), -rpx(72), rpx(40), rpx(64))
  ctx.fillStyle = '#7cb342'
  ctx.fillRect(rpx(12), -rpx(66), rpx(32), rpx(22))

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${rpx(52)}px sans-serif`
  ctx.fillText('💰', rpx(120), -rpx(110))
  ctx.fillText('💰', rpx(150), -rpx(40))
  ctx.fillText('💴', rpx(110), rpx(20))

  ctx.restore()
}

function drawDecorHide(ctx, cx, cy, rpx) {
  ctx.save()
  ctx.translate(cx, cy)

  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e0d4c8'
  ctx.lineWidth = rpx(4)
  roundRectPath(ctx, -rpx(150), rpx(10), rpx(300), rpx(88), rpx(28))
  ctx.fill()
  ctx.stroke()

  fillEllipse(ctx, 0, rpx(58), rpx(100), rpx(32), '#f0e6dc')

  ctx.fillStyle = '#ffd6bd'
  ctx.beginPath()
  ctx.arc(-rpx(20), -rpx(52), rpx(46), 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#5c524e'
  roundRectPath(ctx, -rpx(60), -rpx(28), rpx(92), rpx(96), rpx(34))
  ctx.fill()

  ctx.fillStyle = '#ffd6bd'
  ctx.beginPath()
  ctx.arc(rpx(18), -rpx(58), rpx(22), 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#ffd6bd'
  ctx.lineWidth = rpx(8)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(rpx(36), -rpx(52))
  ctx.lineTo(rpx(72), -rpx(70))
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${rpx(44)}px sans-serif`
  ctx.fillText('🔒', rpx(130), -rpx(100))
  ctx.fillText('🤫', rpx(150), -rpx(30))
  ctx.fillText('🔐', rpx(105), rpx(15))

  ctx.restore()
}

function drawQrPlaceholder(ctx, x, y, size, rpx) {
  ctx.save()
  ctx.strokeStyle = 'rgba(30, 22, 18, 0.25)'
  ctx.setLineDash([rpx(10), rpx(8)])
  ctx.lineWidth = rpx(3)
  roundRectPath(ctx, x, y, size, size, rpx(12))
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(30, 22, 18, 0.35)'
  ctx.font = `${rpx(26)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('小程序码', x + size / 2, y + size / 2 - rpx(10))
  ctx.font = `${rpx(20)}px sans-serif`
  ctx.fillText('配置 posterQrUrl', x + size / 2, y + size / 2 + rpx(18))
  ctx.restore()
}

function drawSharePoster(ctx, opts) {
  const { W, H, rpx, session, hideSensitive, qrImage } = opts
  const minutes = formatMinutesForPoster(session.durationSeconds)
  const BG = '#f8f1e4'
  const INK = '#1e1612'
  const ORANGE = '#ff7a18'
  const MUTED = 'rgba(30, 22, 18, 0.55)'
  const margin = rpx(40)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  drawGrid(ctx, W, H)

  let y = rpx(100)
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = `900 ${rpx(52)}px sans-serif`
  const title = '带薪蹲厕'
  ctx.fillText(title, margin, y)
  const tw = ctx.measureText(title).width
  ctx.font = `${rpx(56)}px sans-serif`
  ctx.fillText('🚽', margin + tw + rpx(12), y)

  y += rpx(36)
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = rpx(3)
  ctx.setLineDash([rpx(10), rpx(10)])
  ctx.beginPath()
  ctx.moveTo(margin, y)
  ctx.lineTo(W - margin, y)
  ctx.stroke()
  ctx.setLineDash([])

  y += rpx(72)
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = `600 ${rpx(30)}px sans-serif`
  ctx.fillText(`带薪蹲厕 ${minutes} 分钟`, W / 2, y)

  y += rpx(120)
  ctx.textAlign = 'center'
  if (!hideSensitive) {
    const line = `净赚 ¥${session.earnedDisplay}`
    ctx.font = `900 ${rpx(96)}px sans-serif`
    ctx.shadowColor = 'rgba(255, 122, 24, 0.45)'
    ctx.shadowBlur = rpx(18)
    ctx.shadowOffsetX = rpx(4)
    ctx.shadowOffsetY = rpx(8)
    ctx.fillStyle = ORANGE
    ctx.fillText(line, W / 2, y)
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  } else {
    const main = '净赚 **** 元'
    ctx.font = `900 ${rpx(76)}px sans-serif`
    ctx.fillStyle = INK
    const wMain = ctx.measureText(main).width
    const gap = rpx(16)
    const emojiSlot = rpx(52)
    const blockW = wMain + gap + emojiSlot
    ctx.textAlign = 'left'
    let x0 = W / 2 - blockW / 2
    ctx.fillText(main, x0, y)
    x0 += wMain + gap
    ctx.font = `${rpx(48)}px sans-serif`
    ctx.textBaseline = 'middle'
    ctx.fillText('🙈', x0, y - rpx(6))
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'center'
  }

  y += rpx(72)
  ctx.font = `600 ${rpx(28)}px sans-serif`
  ctx.fillStyle = MUTED
  const sub = hideSensitive ? '带薪摸鱼，低调行事，懂的都懂' : '带薪如厕，合法创收，这波公司血亏'
  const maxW = W - margin * 2
  let line = ''
  let lineY = y
  for (let i = 0; i < sub.length; i++) {
    const ch = sub[i]
    const test = line + ch
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, W / 2, lineY)
      line = ch
      lineY += rpx(40)
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, W / 2, lineY)

  const decorY = rpx(920)
  if (!hideSensitive) drawDecorShow(ctx, W / 2, decorY, rpx)
  else drawDecorHide(ctx, W / 2, decorY, rpx)

  const qrSize = rpx(200)
  const qrX = W - margin - qrSize
  const qrY = H - margin - qrSize - rpx(56)
  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = `${rpx(22)}px sans-serif`
  ctx.fillText('长按识别，测测你的蹲厕收益', W - margin, qrY - rpx(16))

  if (qrImage && qrImage.width > 0) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    roundRectPath(ctx, qrX, qrY, qrSize, qrSize, rpx(12))
    ctx.fill()
    ctx.strokeStyle = 'rgba(30, 22, 18, 0.12)'
    ctx.lineWidth = rpx(2)
    ctx.stroke()
    const pad = rpx(10)
    ctx.drawImage(qrImage, qrX + pad, qrY + pad, qrSize - pad * 2, qrSize - pad * 2)
    ctx.restore()
  } else {
    drawQrPlaceholder(ctx, qrX, qrY, qrSize, rpx)
  }
}

module.exports = {
  drawSharePoster,
  formatMinutesForPoster,
}
