// Include tablets, landscape phones, and iPads reporting a desktop user agent.
export default function nicheMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    || window.matchMedia('(max-width: 640px)').matches;
}