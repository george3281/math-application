# TODO - Math Practice App

## Setup
- [x] Static site: `index.html`, `style.css`, `app.js`, `engine.js` (no build step, no deps)
- [x] `test_engine.js` self-check runnable with `node test_engine.js`
- [x] `README.md` (how to run, features, deploy URL) and `VIBE_LOG.md`

## A. Arithmetic Practice
- [x] Question generator for +, -, x, /
- [x] Difficulty levels: Easy (1-10 / tables to 5), Medium (1-50 / tables to 10), Hard (1-100 / tables to 12)
- [x] Subtraction never negative; division always whole-number answers
- [x] "Mixed" option that picks random operations

## B. Interactive Question Cards
- [x] Card shows question + 4 multiple-choice answers (1 correct, 3 plausible distractors, no duplicates)
- [x] Picking an answer highlights it; "Reveal answer" flips the card to show the correct one
- [x] "I got it right" / "I got it wrong" buttons after reveal
- [x] Visual feedback: green/red colors, flip animation, encouraging message, small celebration on correct
- [x] Keyboard accessible (buttons, focus states), large tap targets

## C. Practice Sessions
- [x] Setup screen: choose operations, difficulty, number of questions (5 / 10 / 20)
- [x] Progress bar + live counters: attempted, correct, incorrect
- [x] End-of-session summary: score, accuracy %, stars, list of missed questions
- [x] "Play again" and "Practice my mistakes" from summary

## D. Mistake Tracking and Review
- [x] Save every incorrect question (operands, operation, difficulty, times missed)
- [x] Mistakes page: list missed questions with the correct answers
- [x] "Practice mistakes" session: the missed questions plus similar ones (same operation, nearby operands)
- [x] Remove a mistake after it has been answered correctly twice in a row in review

## E. Statistics
- [x] Total attempted, correct, incorrect, overall accuracy
- [x] Breakdown by operation and by difficulty
- [x] Session history (date, settings, score), most recent first
- [x] Simple bar chart of accuracy per operation (CSS bars, no chart lib)
- [x] Reset all data button (with confirmation)

## F. Data Persistence
- [x] localStorage with one versioned key; wrap reads/writes in try/catch
- [x] App still works if storage is unavailable (data just won't persist)

## G. User Interface
- [x] Kid-friendly: bright colors, rounded big fonts, friendly emoji/mascot
- [x] Simple navigation: Home / Practice / Mistakes / Stats
- [x] Responsive from phone (360px) to desktop, no horizontal scroll

## Deploy
- [x] Choose host: GitHub Pages
- [ ] Deploy and put the live URL in README
- [ ] Smoke test the live site on desktop and mobile widths
