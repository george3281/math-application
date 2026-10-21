// Math Buddies UI: screens, card flow, persistence. Logic lives in engine.js.
(function () {
  const E = Engine;
  const KEY = "mathPractice.v1";
  const $ = (id) => document.getElementById(id);

  // ---------- persistence ----------
  let storageOK = true;

  function load() {
    const s = E.newState();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && typeof saved === "object") {
        Object.assign(s.totals, saved.totals);
        for (const k in s.byOp) Object.assign(s.byOp[k], saved.byOp && saved.byOp[k]);
        for (const k in s.byLevel) Object.assign(s.byLevel[k], saved.byLevel && saved.byLevel[k]);
        if (Array.isArray(saved.mistakes)) s.mistakes = saved.mistakes;
        if (Array.isArray(saved.history)) s.history = saved.history;
        if (saved.lastSettings) s.lastSettings = saved.lastSettings;
      }
    } catch (e) {
      storageOK = false;
    }
    return s;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOK = true;
    } catch (e) {
      storageOK = false;
    }
  }

  let state = load();
  let session = null; // the session being played
  let lastSession = null; // the finished session shown on the summary screen

  // ---------- router ----------
  const SCREENS = ["home", "setup", "play", "summary", "mistakes", "stats"];
  const RENDER = { home: renderHome, setup: renderSetup, summary: renderSummary, mistakes: renderMistakes, stats: renderStats };

  function route() {
    let name = location.hash.slice(1) || "home";
    if (!SCREENS.includes(name)) name = "home";
    if (name === "play" && !session) name = "setup";
    if (name === "summary" && !lastSession) name = "home";
    if (("#" + name) !== location.hash && location.hash) history.replaceState(null, "", "#" + name);
    for (const s of SCREENS) $(s).hidden = s !== name;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      const active = a.dataset.nav === name || (name === "play" && a.dataset.nav === "setup");
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (RENDER[name]) RENDER[name]();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  history.scrollRestoration = "manual";

  // ---------- home ----------
  function renderHome() {
    const n = state.mistakes.length;
    $("home-mistakes").textContent = n ? `${n} to practice` : "No mistakes yet";
    const t = state.totals;
    $("home-stats").textContent = t.attempted
      ? `${t.attempted} tried · ${E.pct(t.correct, t.attempted)}% right`
      : "Let's get started!";
  }

  // ---------- setup ----------
  const HINTS = {
    easy: "Numbers up to 10, times tables up to 5.",
    medium: "Numbers up to 50, times tables up to 10.",
    hard: "Numbers up to 100, times tables up to 12.",
  };
  const form = $("setup-form");

  function renderSetup() {
    const ls = state.lastSettings;
    if (ls) {
      form.querySelectorAll("[name=op]").forEach((el) => (el.checked = ls.ops.includes(el.value)));
      const lv = form.querySelector(`[name=level][value=${ls.level}]`);
      const ct = form.querySelector(`[name=count][value="${ls.count}"]`);
      if (lv) lv.checked = true;
      if (ct) ct.checked = true;
    }
    $("setup-error").textContent = "";
    updateHint();
  }

  function updateHint() {
    $("level-hint").textContent = HINTS[form.elements.level.value];
  }

  form.addEventListener("change", updateHint);
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const ops = [...form.querySelectorAll("[name=op]:checked")].map((el) => el.value);
    if (!ops.length) {
      $("setup-error").textContent = "Pick at least one kind of math! 🙂";
      return;
    }
    const settings = { ops, level: form.elements.level.value, count: Number(form.elements.count.value) };
    state.lastSettings = settings;
    save();
    startSession("practice", E.buildSession(settings));
  });

  // ---------- play ----------
  const RIGHT_MSGS = ["Awesome! 🌟", "You rock! 🎸", "Super job! 🚀", "Math whiz! 🧠", "Yes! Keep going! 🎉"];
  const WRONG_MSGS = ["Nice try! You'll get it next time 💪", "Mistakes help us learn! 🌱", "Almost! Let's keep going 🙂"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function startSession(mode, questions) {
    if (!questions.length) return;
    session = { mode, questions, index: 0, correct: 0, wrong: 0, missed: [], picked: null, busy: false };
    $("play-title").textContent = mode === "review" ? "🔁 Fixing mistakes" : "🎯 Practice time";
    if (location.hash === "#play") route(); else location.hash = "#play";
    renderCard();
  }

  function renderCard() {
    const q = session.questions[session.index];
    session.picked = null;
    session.busy = false;
    $("card").classList.remove("flipped", "is-right", "is-wrong");
    $("front").inert = false;
    $("back").inert = true;
    $("op-tag").textContent = `${E.OPS[q.op].name} · ${E.LEVELS[q.level].name}`;
    $("question").textContent = `${q.text} = ?`;
    $("feedback").textContent = "";
    $("btn-right").classList.remove("suggest");
    $("btn-wrong").classList.remove("suggest");
    $("btn-right").disabled = $("btn-wrong").disabled = false;

    const box = $("choices");
    box.replaceChildren();
    q.choices.forEach((n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = n;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        session.picked = n;
        box.querySelectorAll(".choice").forEach((c) => {
          const on = c === b;
          c.classList.toggle("selected", on);
          c.setAttribute("aria-pressed", String(on));
        });
      });
      box.appendChild(b);
    });
    updateCounters();
  }

  function updateCounters() {
    const total = session.questions.length;
    const done = session.correct + session.wrong;
    $("c-num").textContent = Math.min(session.index + 1, total);
    $("c-total").textContent = total;
    $("c-correct").textContent = session.correct;
    $("c-wrong").textContent = session.wrong;
    $("progress-fill").style.width = `${(100 * done) / total}%`;
    $("progress").setAttribute("aria-valuemax", total);
    $("progress").setAttribute("aria-valuenow", done);
  }

  $("reveal").addEventListener("click", () => {
    const q = session.questions[session.index];
    const p = session.picked;
    $("answer-text").textContent = `${q.text} = ${q.answer}`;
    let msg = "You didn't pick an answer. That's okay!";
    if (p !== null) msg = p === q.answer ? `You picked ${p}. That matches! 🎉` : `You picked ${p}.`;
    $("picked").textContent = msg;
    const card = $("card");
    card.classList.add("flipped");
    if (p !== null) card.classList.add(p === q.answer ? "is-right" : "is-wrong");
    $("front").inert = true;
    $("back").inert = false;
    const suggested = p === null ? null : $(p === q.answer ? "btn-right" : "btn-wrong");
    if (suggested) suggested.classList.add("suggest");
    (suggested || $("btn-right")).focus({ preventScroll: true });
  });

  function judge(correct) {
    if (session.busy) return;
    session.busy = true;
    $("btn-right").disabled = $("btn-wrong").disabled = true;
    const q = session.questions[session.index];
    E.applyResult(state, q, correct);
    save();
    if (correct) session.correct++;
    else { session.wrong++; session.missed.push(q); }
    updateCounters();
    $("feedback").textContent = pick(correct ? RIGHT_MSGS : WRONG_MSGS);
    $("feedback").className = "feedback " + (correct ? "good" : "bad");
    if (correct) confetti();
    const s = session;
    setTimeout(() => next(s), 1100);
  }

  $("btn-right").addEventListener("click", () => judge(true));
  $("btn-wrong").addEventListener("click", () => judge(false));

  function next(s) {
    if (s !== session) return; // a new session started meanwhile
    s.index++;
    if (s.index < s.questions.length) { renderCard(); return; }
    const ops = [...new Set(s.questions.map((q) => q.op))];
    const levels = [...new Set(s.questions.map((q) => q.level))];
    E.recordSession(state, { date: Date.now(), mode: s.mode, ops, levels, count: s.questions.length, correct: s.correct });
    save();
    lastSession = s;
    session = null;
    if (location.hash === "#play") location.hash = "#summary";
  }

  function confetti() {
    const box = $("confetti");
    const bits = ["🎉", "⭐", "✨", "🌟", "🎈"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.textContent = pick(bits);
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 0.3 + "s";
      box.appendChild(s);
    }
    setTimeout(() => box.replaceChildren(), 1400);
  }

  // ---------- summary ----------
  function renderSummary() {
    const s = lastSession;
    const total = s.questions.length;
    const n = E.stars(s.correct, total);
    $("sum-stars").textContent = "⭐".repeat(n) + "☆".repeat(3 - n);
    $("sum-title").textContent = n === 3 ? "Superstar!" : n === 2 ? "Great work!" : "Good effort!";
    $("sum-score").textContent = `You got ${s.correct} out of ${total} right.`;
    $("sum-attempted").textContent = total;
    $("sum-correct").textContent = s.correct;
    $("sum-wrong").textContent = s.wrong;
    $("sum-acc").textContent = E.pct(s.correct, total) + "%";
    $("sum-missed-wrap").hidden = !s.missed.length;
    fillMissed($("sum-missed"), s.missed, false);
    $("sum-review").hidden = !state.mistakes.length;
  }

  $("again").addEventListener("click", () => {
    if (lastSession.mode === "review") startReview();
    else startSession("practice", E.buildSession(state.lastSettings));
  });
  $("sum-review").addEventListener("click", startReview);

  // ---------- mistakes ----------
  function fillMissed(ul, items, showCount) {
    ul.replaceChildren();
    for (const m of items) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="m-q"></span><span class="m-meta"></span>`;
      li.firstChild.textContent = `${m.text} = ${m.answer}`;
      li.lastChild.textContent = showCount
        ? `${E.LEVELS[m.level].name} · missed ${m.missed}× · ${m.streak}/${E.MASTERED_STREAK} ✅`
        : E.LEVELS[m.level].name;
      ul.appendChild(li);
    }
  }

  function renderMistakes() {
    const list = state.mistakes.slice().sort((a, b) => b.missed - a.missed);
    $("mis-empty").hidden = list.length > 0;
    $("mis-practice").hidden = !list.length;
    fillMissed($("mis-list"), list, true);
  }

  function startReview() {
    const count = Math.min(20, Math.max(5, state.mistakes.length * 2));
    startSession("review", E.buildReviewSession(state.mistakes, count));
  }

  $("mis-practice").addEventListener("click", startReview);

  // ---------- stats ----------
  function bars(el, groups, label) {
    el.replaceChildren();
    for (const k in groups) {
      const g = groups[k];
      const p = E.pct(g.correct, g.attempted);
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `<span class="bar-label"></span><span class="bar"><span class="bar-fill"></span></span><span class="bar-val"></span>`;
      row.children[0].textContent = label(k);
      row.querySelector(".bar-fill").style.width = p + "%";
      row.children[2].textContent = g.attempted ? `${p}% (${g.correct}/${g.attempted})` : "Not tried yet";
      el.appendChild(row);
    }
  }

  function renderStats() {
    const t = state.totals;
    $("st-attempted").textContent = t.attempted;
    $("st-correct").textContent = t.correct;
    $("st-wrong").textContent = t.incorrect;
    $("st-acc").textContent = E.pct(t.correct, t.attempted) + "%";
    bars($("st-ops"), state.byOp, (k) => `${E.OPS[k].symbol} ${E.OPS[k].name}`);
    bars($("st-levels"), state.byLevel, (k) => E.LEVELS[k].name);

    const body = $("hist-body");
    body.replaceChildren();
    for (const h of state.history.slice(0, 20)) {
      const tr = document.createElement("tr");
      const cells = [
        new Date(h.date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        (h.mode === "review" ? "🔁 " : "") + h.ops.map((o) => E.OPS[o].symbol).join(" "),
        h.levels.map((l) => E.LEVELS[l].name).join(", "),
        `${h.correct}/${h.count} ${"⭐".repeat(E.stars(h.correct, h.count))}`,
      ];
      for (const c of cells) {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    $("hist-empty").hidden = state.history.length > 0;
    $("hist-table").hidden = !state.history.length;
    $("storage-note").textContent = storageOK ? "" : "Heads up: this browser isn't saving progress, so stats reset when you close the page.";
    resetArmed = false;
    $("reset").textContent = "Reset all data";
  }

  // Two-tap reset instead of confirm() so nothing blocks the page.
  let resetArmed = false;
  let resetTimer;
  $("reset").addEventListener("click", () => {
    const btn = $("reset");
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = "Tap again to erase everything";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { resetArmed = false; btn.textContent = "Reset all data"; }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    state = E.newState();
    save();
    renderStats();
  });

  route();
})();
