# Carom

**Carom** is a top-down paddle duel that runs entirely in the browser. Two
paddles face each other across a dark field while a ball ricochets between
them, off the top and bottom walls, and off a pair of amber obstacles in the
middle of the field. A player scores when the ball passes the far edge behind
their opponent's paddle. First to 11 points, winning by at least 2, takes the
match.

Carom's defining mechanic is **spin**: the vertical motion of a paddle at the
moment it strikes the ball curves the ball's flight afterwards, and that spin
decays over time. The two mid-field obstacles sway up and down in anti-phase
and rotate continuously, turning the open field into a bank-shot puzzle — hit
their tilted faces to bend a rally around your opponent, or thread the gap
between them.

There are two modes:

- **Solo** — you play the left (cyan) paddle against an AI on the right.
- **Versus** — two local players share one keyboard.

Everything is drawn in code on a canvas; the game ships no art or audio files
and fetches nothing at runtime.

## Install

Dependencies are already declared in `package.json`. Install them with:

```sh
npm ci
```

## Run in development

```sh
npm run dev
```

Then open the URL Vite prints. The game runs immediately — no build step,
backend, or API key is needed.

## Production build

```sh
npm ci
npm run build
```

This type-checks the project and emits the complete static site into `dist/`,
with `index.html` at its root. Serve that directory as-is from any static file
server (for example `npm run preview`).

## Controls

| Input                      | Action                                                  |
| -------------------------- | ------------------------------------------------------- |
| `W` / `S`                  | Player one (left paddle) up / down                      |
| `ArrowUp` / `ArrowDown`    | Player two (right paddle) up / down — in Solo, these also move player one's paddle |
| `Enter` / `Space`          | Confirm the highlighted menu item                       |
| `Escape` or `P`            | Pause / resume (`Escape` also goes back in menus)       |
| `M`                        | Mute / unmute                                           |

In menus, moving the mouse (or touching an item) highlights it, and a click or
tap on an item confirms it. On touchscreens the engine draws a vertical slider
for each paddle plus menu buttons.

To curve the ball, be moving your paddle as it connects: downward motion adds
positive (clockwise) spin, upward motion adds negative spin, and a still paddle
adds none.

## Checks

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run format      # Prettier, in check mode
npm test            # Vitest, with coverage over src/
```

See `specs/` for the full game specification and `showcase/` for the store-page
presentation.
