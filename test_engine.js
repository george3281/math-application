// Self-check for engine.js. Run: node test_engine.js
const assert = require("assert");
const E = require("./engine.js");

const N = 2000;
for (const level of Object.keys(E.LEVELS)) {
  const L = E.LEVELS[level];
  for (const op of Object.keys(E.OPS)) {
    for (let i = 0; i < N; i++) {
      const q = E.makeQuestion(op, level);
      assert(q.answer >= 0 && Number.isInteger(q.answer), `bad answer ${q.text}`);
      if (op === "add") assert.strictEqual(q.answer, q.a + q.b);
      if (op === "sub") assert.strictEqual(q.answer, q.a - q.b);
      if (op === "mul") assert.strictEqual(q.answer, q.a * q.b);
      if (op === "div") assert.strictEqual(q.a, q.b * q.answer);
      const free = op === "div" ? [q.b, q.answer] : [q.a, q.b];
      const [lo, hi] = op === "add" || op === "sub" ? [1, L.addMax] : [L.tableMin, L.tableMax];
      for (const n of free) assert(n >= lo && n <= hi, `${q.text} out of ${level} range`);

      const c = E.makeChoices(q);
      assert.strictEqual(c.length, 4);
      assert.strictEqual(new Set(c).size, 4, `duplicate choices ${c}`);
      assert(c.includes(q.answer));
      assert(c.every((n) => n >= 0 && Number.isInteger(n)));

      const s = E.makeSimilar(q);
      assert.strictEqual(s.op, op);
      assert.strictEqual(s.level, level);
      assert.notStrictEqual(s.key, q.key);
      assert(s.answer >= 0 && Number.isInteger(s.answer));
    }
  }
}

// Sessions
const sess = E.buildSession({ ops: ["mul", "div"], level: "medium", count: 10 });
assert.strictEqual(sess.length, 10);
assert(sess.every((q) => ["mul", "div"].includes(q.op) && q.choices.length === 4));
assert.deepStrictEqual(E.buildReviewSession([], 10), []);

// Mistake tracking + stats
const st = E.newState();
const q = { ...E.makeQuestion("mul", "hard"), choices: [] };
E.applyResult(st, q, false);
E.applyResult(st, q, false);
assert.strictEqual(st.mistakes.length, 1);
assert.strictEqual(st.mistakes[0].missed, 2);

const review = E.buildReviewSession(st.mistakes, 5);
assert.strictEqual(review.length, 5);
assert.strictEqual(review[0].key, q.key, "review starts with the missed question");
assert(review.slice(1).every((r) => r.op === "mul" && r.key !== q.key));

E.applyResult(st, q, true);
assert.strictEqual(st.mistakes.length, 1, "one correct is not enough");
E.applyResult(st, q, false);
E.applyResult(st, q, true);
assert.strictEqual(st.mistakes.length, 1, "streak resets on a wrong answer");
E.applyResult(st, q, true);
assert.strictEqual(st.mistakes.length, 0, "cleared after 2 correct in a row");

assert.deepStrictEqual(st.totals, { attempted: 6, correct: 3, incorrect: 3 });
assert.deepStrictEqual(st.byOp.mul, { attempted: 6, correct: 3 });
assert.deepStrictEqual(st.byLevel.hard, { attempted: 6, correct: 3 });
assert.strictEqual(E.pct(3, 6), 50);
assert.strictEqual(E.pct(0, 0), 0);
assert.strictEqual(E.stars(9, 10), 3);
assert.strictEqual(E.stars(7, 10), 2);
assert.strictEqual(E.stars(0, 10), 1);

for (let i = 0; i < 60; i++) E.recordSession(st, { i });
assert.strictEqual(st.history.length, 50);
assert.strictEqual(st.history[0].i, 59, "newest first");

console.log("All engine checks passed.");
