# splash: cover the blank first paint

A client-rendered page is empty between the HTML painting and React's first
commit: tens of milliseconds warm, however long the bundle takes cold. This
fills that window with a branded screen.

- **Pure HTML + CSS in `index.html`**, a sibling of `#root` (the seo pack's
  prerender empties `#root`, and restores the splash from the shell).
- **Never flashes for repeat visitors.** It starts at opacity 0 and fades in
  after 240ms; a cached bundle mounts first and removes it unseen.
- **Never blocks the page.** `pointer-events: none`, and a 1s timer clears it
  in a background tab, where `requestAnimationFrame` never fires.
- **Removed after the first PAINT**, not the first commit (two rAFs), then a
  280ms fade. Reduced motion gets the same screen, held still.

Edit the markup (`#splash p`) and styles in `index.html` to match the brand:
a wordmark, the brand colour. Keep it tiny; it must paint instantly.
