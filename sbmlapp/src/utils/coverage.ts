/** 在画布上检测当前步骤虚线是否被足够涂到 */
export function measureGuideCoverage(
  paint: HTMLCanvasElement,
  guidePaths: Path2D[],
  logicalW: number,
  logicalH: number,
  lineWidthLogical: number,
): number {
  if (!guidePaths.length) return 1
  const w = paint.width
  const h = paint.height
  if (!w || !h) return 0

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d')
  const pctx = paint.getContext('2d', { willReadFrequently: true })
  if (!mctx || !pctx) return 0

  const sx = w / logicalW
  const sy = h / logicalH
  mctx.setTransform(sx, 0, 0, sy, 0, 0)
  mctx.strokeStyle = '#ffffff'
  mctx.lineWidth = lineWidthLogical * 1.8
  mctx.lineCap = 'round'
  mctx.lineJoin = 'round'
  for (const path of guidePaths) {
    mctx.stroke(path)
  }

  const maskData = mctx.getImageData(0, 0, w, h).data
  const paintData = pctx.getImageData(0, 0, w, h).data

  let guidePixels = 0
  let covered = 0
  const step = Math.max(2, Math.floor(Math.min(w, h) / 180))

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4
      if (maskData[i + 3] < 40) continue
      guidePixels++
      // 邻域是否有笔迹
      let hit = false
      const r = Math.max(2, Math.round(lineWidthLogical * sx * 0.9))
      for (let dy = -r; dy <= r && !hit; dy++) {
        for (let dx = -r; dx <= r && !hit; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
          const j = (yy * w + xx) * 4
          if (paintData[j + 3] > 40) hit = true
        }
      }
      if (hit) covered++
    }
  }

  if (guidePixels === 0) return 1
  return covered / guidePixels
}

export function textGuidePath(
  text: string,
  font: string,
  x: number,
  y: number,
): { path: Path2D; approxLen: number } {
  const path = new Path2D()
  // Canvas 无法直接取文字轮廓 Path，用测量宽高近似为覆盖检测矩形环带
  // 覆盖检测对文字：在临时 canvas 上 strokeText
  void path
  void font
  void x
  void y
  return { path: new Path2D(), approxLen: text.length * 40 }
}

/** 文字步骤：用 strokeText 做遮罩检测 */
export function measureTextCoverage(
  paint: HTMLCanvasElement,
  text: string,
  font: string,
  logicalW: number,
  logicalH: number,
  lx: number,
  ly: number,
  lineWidthLogical: number,
): number {
  const w = paint.width
  const h = paint.height
  if (!w || !h || !text) return 1

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d')
  const pctx = paint.getContext('2d', { willReadFrequently: true })
  if (!mctx || !pctx) return 0

  const sx = w / logicalW
  const sy = h / logicalH
  mctx.setTransform(sx, 0, 0, sy, 0, 0)
  mctx.font = font
  mctx.textAlign = 'center'
  mctx.textBaseline = 'middle'
  mctx.lineWidth = lineWidthLogical
  mctx.lineJoin = 'round'
  mctx.strokeStyle = '#fff'
  mctx.strokeText(text, lx, ly)

  const maskData = mctx.getImageData(0, 0, w, h).data
  const paintData = pctx.getImageData(0, 0, w, h).data
  let guidePixels = 0
  let covered = 0
  const step = Math.max(2, Math.floor(Math.min(w, h) / 160))
  const r = Math.max(2, Math.round(lineWidthLogical * sx))

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4
      if (maskData[i + 3] < 40) continue
      guidePixels++
      let hit = false
      for (let dy = -r; dy <= r && !hit; dy++) {
        for (let dx = -r; dx <= r && !hit; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
          const j = (yy * w + xx) * 4
          if (paintData[j + 3] > 40) hit = true
        }
      }
      if (hit) covered++
    }
  }
  if (guidePixels === 0) return 1
  return covered / guidePixels
}
