export function viewportBox() {
  const vv = window.visualViewport;
  if (vv && vv.width > 1 && vv.height > 1) {
    return { w: vv.width, h: vv.height, left: vv.offsetLeft, top: vv.offsetTop };
  }
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight,
    left: 0,
    top: 0,
  };
}

export function pinToViewport(el: HTMLElement) {
  const { w, h, left, top } = viewportBox();
  el.style.position = "fixed";
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.width = `${Math.max(1, Math.round(w))}px`;
  el.style.height = `${Math.max(1, Math.round(h))}px`;
  const ui = Math.max(0.72, Math.min(1.45, Math.min(w, h) / 520));
  el.style.setProperty("--ui", ui.toFixed(3));
}

export function onViewportChange(fn: () => void) {
  const vv = window.visualViewport;
  window.addEventListener("resize", fn);
  window.addEventListener("orientationchange", fn);
  vv?.addEventListener("resize", fn);
  vv?.addEventListener("scroll", fn);
  return () => {
    window.removeEventListener("resize", fn);
    window.removeEventListener("orientationchange", fn);
    vv?.removeEventListener("resize", fn);
    vv?.removeEventListener("scroll", fn);
  };
}
