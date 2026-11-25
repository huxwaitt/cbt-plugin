// Tabs: one area with a few states. Without this script every panel shows in
// order, so nothing here hides content until it runs.
export function initSwitches() {
  for (const root of document.querySelectorAll('[data-switch]')) {
    const tabs = [...root.querySelectorAll('[role="tab"]')]
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')))
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index))
        tab.tabIndex = i === index ? 0 : -1
        panels[i].hidden = i !== index
      })
      if (focus) tabs[index].focus()
      root.dispatchEvent(new CustomEvent('switch', { detail: { panel: panels[index] } }))
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i))
      tab.addEventListener('keydown', event => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
        if (event.key === 'Home') select(0, true)
        else if (event.key === 'End') select(tabs.length - 1, true)
        else if (step) select((i + step + tabs.length) % tabs.length, true)
        else return
        event.preventDefault()
      })
    })
    select(Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true')))
  }
}
