# Theme: Light / Dark / System

Every HTML file this skill produces — every lesson, every reference document — ships with a three-way toggle: **light**, **dark**, **system**. No exceptions; a lesson without it is not done.

## Pattern

1. **CSS variables carry the theme.** Keep the existing `:root{...}` block as the light palette. Add a `:root[data-theme="dark"]{...}` block mapping the *same variable names* to dark values. Never hardcode a color outside these variables — that's what breaks dark mode later.
2. **JS resolves "system" and prevents flash.** An inline script in `<head>`, before any content renders, reads the saved preference from `localStorage`, resolves `system` via `matchMedia('(prefers-color-scheme: dark)')`, and sets `data-theme` on `<html>` before first paint.
3. **A toggle button cycles light → dark → system → light**, persists the choice, and updates live if the OS theme changes while on `system`.

For lessons, the CSS variables and scripts below belong in the shared `./assets/` stylesheet/script (see [Assets](./SKILL.md#assets)) — write them once, link from every lesson. Reference documents stay single-file (they're meant to print and travel), so inline the whole block directly in the document's own `<style>`/`<script>` tags.

### Dark palette

Map every variable the light `:root` defines — a variable with no dark counterpart is a bug. Adjust the hex values below to fit each workspace's own light palette (invert lightness, keep hue/saturation roughly matched) rather than pasting this verbatim if the palette differs.

```css
:root[data-theme="dark"]{
  --ink:#e8ecf3; --muted:#9aa7bb; --line:#2a3446; --bg:#0f1420; --card:#171e2c;
  --accent:#5b9dff; --accent-soft:#1b2c4a; --code:#232c3d;
  --ot:#e08a52; --ot-soft:#2e2013; --it:#4dd0e1; --it-soft:#0f2a30;
  --good:#3ecf8e; --good-soft:#0f2a1e; --bad:#f0685e; --bad-soft:#2e1414;
  --warn:#e0b64d; --purple:#a78bfa; --purple-soft:#241a3d;
  --shadow:0 1px 3px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35);
}
```

### No-flash bootstrap (head, before the `<style>` block)

```html
<script>
(function(){
  var pref = localStorage.getItem('theme') || 'system';
  var resolved = pref === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : pref;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-pref', pref);
})();
</script>
```

### Toggle button

```html
<button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme"></button>
```

```css
.theme-toggle{position:fixed; right:18px; bottom:18px; width:40px; height:40px; border-radius:50%;
  border:1px solid var(--line); background:var(--card); box-shadow:var(--shadow); cursor:pointer;
  font-size:16px; line-height:1; display:grid; place-items:center; color:var(--ink); z-index:99}
```

```js
(function(){
  var btn = document.getElementById('theme-toggle');
  var icons = {light:'☀', dark:'☾', system:'◐'};
  var order = ['light', 'dark', 'system'];
  function apply(pref){
    var resolved = pref === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
    btn.textContent = icons[pref];
    localStorage.setItem('theme', pref);
  }
  btn.addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme-pref') || 'system';
    apply(order[(order.indexOf(cur) + 1) % order.length]);
  });
  apply(localStorage.getItem('theme') || 'system');
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){
    if ((localStorage.getItem('theme') || 'system') === 'system') apply('system');
  });
})();
```

## Before shipping any lesson or reference doc

- [ ] Every color in the file is a `var(--...)` — none hardcoded.
- [ ] `:root[data-theme="dark"]` defines every variable `:root` defines.
- [ ] The no-flash script runs before the first `<style>` block.
- [ ] The toggle button is present and cycles light → dark → system.
- [ ] Checked in both light and dark — no unreadable contrast, no missed hardcoded color.
