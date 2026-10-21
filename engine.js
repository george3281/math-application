// Math Practice engine: question generation, sessions, stats.
// Pure logic, no DOM, so it can be tested with plain Node (test_engine.js).

const OPS = {
  add: { symbol: "+", name: "Addition" },
  sub: { symbol: "−", name: "Subtraction" },
  mul: { symbol: "×", name: "Multiplication" },
  div: { symbol: "÷", name: "Division" },
};

const LEVELS = {
  easy:   { name: "Easy",   addMax: 10,  tableMin: 1, tableMax: 5 },
  medium: { name: "Medium", addMax: 50,  tableMin: 1, tableMax: 10 },
  hard:   { name: "Hard",   addMax: 100, tableMin: 2, tableMax: 12 },
};

const MASTERED_STREAK = 2; // correct answers in a row that clear a mistake

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Operand ranges for an op at a level: [lo, hi] for each "free" number.
// For div the free numbers are divisor and quotient (dividend = their product).
function range(op, level) {
  const L = LEVELS[level];
  return op === "add" || op === "sub" ? [1, L.addMax] : [L.tableMin, L.tableMax];
}

// Build a question from its two free numbers. Normalizes so that
// subtraction is never negative and division is always whole.
function build(op, level, x, y) {
  let a, b, answer;
  if (op === "add") { a = x; b = y; answer = a + b; }
  else if (op === "sub") { a = Math.max(x, y); b = Math.min(x, y); answer = a - b; }
  else if (op === "mul") { a = x; b = y; answer = a * b; }
  else { b = x; answer = y; a = b * y; } // div: x = divisor, y = quotient
  return { op, level, a, b, answer, text: `${a} ${OPS[op].symbol} ${b}`, key: `${op}:${a}:${b}` };
}

function makeQuestion(op, level) {
  const [lo, hi] = range(op, level);
  return build(op, level, randInt(lo, hi), randInt(lo, hi));
}

// Free numbers of an existing question (inverse of build).
function freeNums(q) {
  return q.op === "div" ? [q.b, q.answer] : [q.a, q.b];
}

// Same op and level, numbers nudged a little, never identical to q.
function makeSimilar(q) {
  const [lo, hi] = range(q.op, q.level);
  const spread = q.op === "add" || q.op === "sub" ? 3 : 1;
  const [x, y] = freeNums(q);
  for (let tries = 0; tries < 20; tries++) {
    const s = build(q.op, q.level,
      clamp(x + randInt(-spread, spread), lo, hi),
      clamp(y + randInt(-spread, spread), lo, hi));
    if (s.key !== q.key) return s;
  }
  return makeQuestion(q.op, q.level);
}

// Four unique, non-negative, shuffled options including the answer.
// Distractors are near-misses and "wrong operation" mistakes kids actually make.
function makeChoices(q) {
  const ans = q.answer;
  const pool = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10,
    q.a + q.b, Math.abs(q.a - q.b), q.a * q.b];
  const opts = new Set([ans]);
  for (const n of shuffle(pool)) {
    if (opts.size === 4) break;
    if (n >= 0 && Number.isInteger(n)) opts.add(n);
  }
  for (let k = 3; opts.size < 4; k++) opts.add(ans + k);
  return shuffle([...opts]);
}

function withChoices(q) {
  return { ...q, choices: makeChoices(q) };
}

function buildSession({ ops, level, count }) {
  const qs = [];
  for (let i = 0; i < count; i++) qs.push(withChoices(makeQuestion(ops[randInt(0, ops.length - 1)], level)));
  return qs;
}

// Missed questions (most-missed first), each followed by a similar one,
// then more similar ones until count is reached.
function buildReviewSession(mistakes, count) {
  if (!mistakes.length) return [];
  const sorted = mistakes.slice().sort((m, n) => n.missed - m.missed);
  const qs = [];
  for (const m of sorted) {
    if (qs.length < count) qs.push(withChoices(build(m.op, m.level, ...freeNums(m))));
    if (qs.length < count) qs.push(withChoices(makeSimilar(m)));
  }
  for (let i = 0; qs.length < count; i++) qs.push(withChoices(makeSimilar(sorted[i % sorted.length])));
  return qs;
}

function emptyCounts(keys) {
  const o = {};
  for (const k of keys) o[k] = { attempted: 0, correct: 0 };
  return o;
}

function newState() {
  return {
    totals: { attempted: 0, correct: 0, incorrect: 0 },
    byOp: emptyCounts(Object.keys(OPS)),
    byLevel: emptyCounts(Object.keys(LEVELS)),
    mistakes: [],
    history: [],
  };
}

// Record one answered question. Wrong answers are saved as mistakes;
// a mistake is cleared after MASTERED_STREAK correct answers in a row.
function applyResult(state, q, correct) {
  state.totals.attempted++;
  state.totals[correct ? "correct" : "incorrect"]++;
  for (const bucket of [state.byOp[q.op], state.byLevel[q.level]]) {
    bucket.attempted++;
    if (correct) bucket.correct++;
  }
  const i = state.mistakes.findIndex((m) => m.key === q.key);
  if (correct) {
    if (i >= 0 && ++state.mistakes[i].streak >= MASTERED_STREAK) state.mistakes.splice(i, 1);
  } else if (i >= 0) {
    state.mistakes[i].missed++;
    state.mistakes[i].streak = 0;
  } else {
    const { op, level, a, b, answer, text, key } = q;
    state.mistakes.push({ op, level, a, b, answer, text, key, missed: 1, streak: 0 });
  }
}

const HISTORY_MAX = 50;

function recordSession(state, entry) {
  state.history.unshift(entry);
  state.history.length = Math.min(state.history.length, HISTORY_MAX);
}

function pct(correct, attempted) {
  return attempted ? Math.round((100 * correct) / attempted) : 0;
}

function stars(correct, total) {
  const p = pct(correct, total);
  return p >= 90 ? 3 : p >= 70 ? 2 : 1;
}

const Engine = {
  OPS, LEVELS, MASTERED_STREAK, makeQuestion, makeSimilar, makeChoices, buildSession,
  buildReviewSession, newState, applyResult, recordSession, pct, stars,
};

if (typeof module !== "undefined") module.exports = Engine;
