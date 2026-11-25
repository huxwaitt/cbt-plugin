import { initSwitches } from './switch.js'
import { initChats } from './chat.js'

initSwitches()
initChats()

// The map pulls in three.js and the knowledge base data, so it loads only
// when the section is close to the viewport.
const map = document.getElementById('map')
if (map) {
  const load = () => import('./map/index.js').then(m => m.initMap(map))
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect()
          load()
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(map)
  } else load()
}
