# VIBE_LOG.md

Key interactions from the development conversation, chosen for what they
show about the process.

## Interaction 1 - TODO first, then a plan before any code

**Prompt:**
"Develop and deploy a complete Math Practice web application designed for
children ages 7-12 ... fill the todo and /plan."

**AI suggestion:**
Read `specification.md`, looked at the earlier `chopsticks/` assignment for
conventions (static HTML/CSS/JS, `test_engine.js` run with Node, README +
VIBE_LOG), and turned spec sections A-G into a checkbox `TODO.md`. Then in
plan mode it proposed splitting the code into a DOM-free `engine.js`
(testable in Node) and an `app.js` UI layer.

**What I accepted or changed:**
Accepted the structure as proposed.

**What I learned / how I verified it:**
Keeping the logic separate from the DOM meant the rules that matter most (no
negative subtraction, whole-number division, unique answer choices, when a
mistake is cleared) could be tested 2,000 times per operation and level
without opening a browser.

## Interaction 2 - Choosing where to deploy

**Prompt:**
Asked where to deploy (the gh, Vercel and Netlify CLIs weren't installed).
I asked back: "How long does a claude artifact live?"

**AI suggestion:**
An artifact has no expiry, but it starts out private and needs a Claude
account to share. For a class submission a grader can open, it recommended
GitHub Pages.

**What I accepted or changed:**
Chose GitHub Pages.

**What I learned / how I verified it:**
The hosting choice depends on who has to open the link, not only on what's
fastest to deploy.

## Interaction 3 - Avoiding blocking dialogs

**AI suggestion:**
For "Reset all data", it skipped `confirm()` and used a two-tap button ("Tap
again to erase everything", which disarms after 4 seconds).

**What I accepted or changed:**
Kept it. A native dialog blocks the page (and browser automation), and a
two-tap button is just as safe against accidental taps by kids.

**What I learned / how I verified it:**
Tested in Chrome: one tap arms the button, a second tap clears totals,
mistakes and history in localStorage.

## Interaction 4 - Bugs found only by running it in a real browser

**AI suggestion:**
After the Node tests passed, it drove the real page in Chrome: played a
session, reloaded, and checked every screen at phone width.

**What I accepted or changed:**
That found two issues the unit tests couldn't. (1) The Stats page opened
scrolled down, with the "My stats" heading hidden under the sticky header.
(2) At 375px the nav wrapped onto two lines, which tighter nav padding on
small screens fixed. Resizing the browser window didn't work in automation,
so mobile width was tested by loading the app in a 375px iframe and checking
`scrollWidth` on every screen.

## Interaction 5 - The first fix for the scroll bug was wrong

**AI suggestion:**
For bug (1), the agent first blamed browser scroll restoration after a reload
and added `history.scrollRestoration = "manual"`. The heading looked fine
afterwards, so the bug seemed fixed.

**What I accepted or changed:**
While taking screenshots of the deployed site for this report, the same bug
appeared again on #stats, this time without a reload. The real cause: each
screen was a `<section id="stats">` and the URL hash was `#stats`, so the
browser treated the hash as an anchor and scrolled to that section. The fix
was renaming the sections to `id="screen-stats"` etc. so the hash no longer
matches any element.

**What I learned / how I verified it:**
The first test was too weak. The page was nearly empty, so it couldn't scroll
anyway and a "fixed" result proved nothing. The second check seeded 20
history rows so the page was 1725px tall, then confirmed `scrollY` stayed at
0 both when navigating to every hash and after a reload. Lesson: when a fix
"works", check that the test could have failed in the first place.

Right after the deploy, the live site briefly showed the Home screen at
`#stats`. GitHub Pages sends `cache-control: max-age=600`, so the browser had
paired the new `index.html` with the old cached `app.js`, which looked up the
removed `#stats` id and crashed. The fix was adding `?v=2` to the asset URLs
in `index.html`, so a new page always loads matching files.
