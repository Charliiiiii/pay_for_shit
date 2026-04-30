Component({
  properties: {
    compact: {
      type: Boolean,
      value: false
    },
    /** 传入则覆盖默认顶图；首页计时中可单独换图 */
    bannerSrc: {
      type: String,
      value: ''
    }
  }
})
