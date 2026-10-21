# Math Buddies - Math Practice for Kids

A static web app where children ages 7-12 practice addition, subtraction,
multiplication and division with interactive flip cards. It tracks results,
remembers wrong answers, and builds extra practice from those mistakes.

**Live site:** https://george3281.github.io/math-application/

## Install dependencies

None. The app is plain HTML, CSS and JavaScript with no packages, so there is
nothing to `npm install`. The only external resource is the Baloo 2 font from
Google Fonts, and the app falls back to system fonts without it.

Optional tools:
- A modern browser (Chrome, Firefox, Safari, Edge) to run the app.
- [Node.js](https://nodejs.org) (any recent version) to run the self-check.

## Run locally

```bash
git clone https://github.com/george3281/math-application.git
cd math-application
python3 -m http.server 8000     # or: npx serve .
```

Then open http://localhost:8000. You can also double-click `index.html` to
open it straight from disk.

Run the logic self-check:

```bash
node test_engine.js             # prints "All engine checks passed."
```

## Build and deploy

There is no build step. The files in the repo are exactly what the browser
loads. To deploy on GitHub Pages:

1. Push the repo to GitHub.
2. Go to **Settings → Pages**, set Source to **Deploy from a branch**, and
   choose branch `main`, folder `/ (root)`.
3. The site is published at `https://<user>.github.io/<repo>/` within a
   minute or two. Each later push to `main` redeploys automatically.

Any other static host (Netlify, Vercel, a web server) works the same way:
upload the folder as-is.

GitHub Pages tells browsers to cache files for 10 minutes. When you change
`app.js`, `engine.js` or `style.css`, bump the `?v=` number on its tag in
`index.html` so a returning visitor never gets new HTML paired with old JS.

## Files

| File | What it does |
|------|--------------|
| `engine.js` | Pure logic, no DOM: question generation, answer choices, similar questions, sessions, mistake tracking, stats. Works in the browser and in Node. |
| `app.js` | UI: hash-based screens, card flow, rendering, localStorage persistence. |
| `index.html` | All screens (Home, Setup, Play, Summary, Mistakes, Stats). |
| `style.css` | Kid-friendly, responsive styling and animations. |
| `test_engine.js` | `assert`-based checks for the engine. |

## Features (mapped to the specification)

**A. Arithmetic practice** - four operations at three levels:

| Level | + and − | × and ÷ |
|-------|---------|---------|
| Easy | numbers 1-10 | tables 1-5 |
| Medium | numbers 1-50 | tables 1-10 |
| Hard | numbers 1-100 | tables 2-12 |

Subtraction never goes negative, since the larger number always comes first.
Division questions are built as `dividend = divisor × quotient`, so every
answer is a whole number. Kids can choose any mix of operations.

**B. Question cards** - each card shows the question and 4 answer choices.
The distractors are plausible: near-misses (±1, ±2, ±10) and "wrong
operation" answers (e.g. 7 + 3 on a 7 × 3 card). Choices are always unique
and non-negative. The child taps a choice, presses **Show answer** to flip the
card, then presses **I got it right** or **I got it wrong**. The app
highlights its suggested button, but the child confirms. Feedback includes
green/red card colors, an encouraging message, and emoji confetti on correct
answers.

**C. Practice sessions** - choose operations, level, and 5/10/20 questions. A
progress bar and live counters show the question number, right answers and
wrong answers. The end summary shows the score, accuracy, 1-3 stars, the
missed questions, and buttons for **Play again** and **Practice my mistakes**.

**D. Mistakes** - every wrong answer is saved with a count of how many times
it was missed. A review session puts the most-missed questions first, each
followed by a *similar* question (same operation and level, numbers nudged by
a few). A mistake is cleared after it's answered right **2 times in a row**,
and answering it wrong resets that streak.

**E. Statistics** - totals, overall accuracy, accuracy bars per operation and
per level, and practice history (the last 20 sessions are shown, the last 50
are stored). There's also a two-tap **Reset all data** button.

**F. Persistence** - everything is saved in `localStorage` under one
versioned key (`mathPractice.v1`). Reads and writes are wrapped in try/catch.
If storage is blocked (e.g. some private windows), the app still works for
the current visit and the Stats page shows a note. No login.

**G. UI** - bright colors, a rounded font (Baloo 2), big tap targets (52px or
more), and a mascot. It's responsive from 360px phones to desktop, with
keyboard focus outlines and support for `prefers-reduced-motion`.

## Testing done

- `node test_engine.js`: 2,000 random questions per operation × level.
  It checks ranges, correct answers, whole-number division, unique choices,
  similar questions, the mistake streak, stats math, and the history cap.
- Manual run in Chrome: a full 5-question session with mixed right and wrong
  answers, the summary, a reload to confirm persistence, the Mistakes page,
  review mode, stats, reset, and every screen at 375px width (no horizontal
  scroll, no console errors).
