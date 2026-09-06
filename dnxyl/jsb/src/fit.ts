const RATIO = 9 / 16

export function viewportBox() {
  const vv = window.visualViewport
  if (vv && vv.width > 1 && vv.height > 1) {
    return {
      w: vv.width,
      h: vv.height,
      left: vv.offsetLeft,
      top: vv.offsetTop,
    }
  }
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight,
    left: 0,
    top: 0,
  }
}

/** 把根节点钉在可视区域上，避开微信/iOS 地址栏和刘海。 */
export function pinToViewport(el: HTMLElement) {
  const { w, h, left, top } = viewportBox()
  el.style.position = 'fixed'
  el.style.left = `${Math.round(left)}px`
  el.style.top = `${Math.round(top)}px`
  el.style.width = `${Math.max(1, Math.round(w))}px`
  el.style.height = `${Math.max(1, Math.round(h))}px`
}

/** 竖屏铺满可视区；横屏/宽屏则放入最大的 9:16 竖框。 */
export function fitPlayFrame(frame: HTMLElement, host: HTMLElement) {
  const maxW = Math.max(1, host.clientWidth)
  const maxH = Math.max(1, host.clientHeight)
  const landscape = maxW > maxH * 1.08
  let w: number
  let h: number
  if (landscape) {
    h = maxH
    w = h * RATIO
    if (w > maxW) {
      w = maxW
      h = w / RATIO
    }
  } else {
    w = maxW
    h = maxH
  }
  w = Math.max(1, Math.floor(w))
  h = Math.max(1, Math.floor(h))
  frame.style.width = `${w}px`
  frame.style.height = `${h}px`
  const ui = Math.max(0.68, Math.min(1.65, w / 390))
  frame.style.setProperty('--ui', ui.toFixed(3))
}

export function onViewportChange(fn: () => void) {
  const vv = window.visualViewport
  window.addEventListener('resize', fn)
  window.addEventListener('orientationchange', fn)
  vv?.addEventListener('resize', fn)
  vv?.addEventListener('scroll', fn)
  return () => {
    window.removeEventListener('resize', fn)
    window.removeEventListener('orientationchange', fn)
    vv?.removeEventListener('resize', fn)
    vv?.removeEventListener('scroll', fn)
  }
}
