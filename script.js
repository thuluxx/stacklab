/* =========================================================
   StackLab — Stack visualizer (plain JavaScript)
   1. Stack data       3. Rendering
   2. Small helpers    4. Push / Pop / Peek + events
   ========================================================= */

"use strict";

/* ---------- 1. The stack itself (real logic, not a mockup) ---------- */
const CAPACITY = 8; // fixed capacity of the stack

/** @type {string[]} index 0 = bottom, last index = top */
const stack = [];

/** One rgb triplet per slot, so every block gets its own colour. */
const COLORS = [
  "34, 211, 238", // cyan
  "52, 211, 153", // green
  "129, 140, 248", // indigo
  "192, 132, 252", // purple
  "251, 113, 133", // rose
  "251, 191, 36", // amber
  "248, 113, 113", // red
  "232, 121, 249", // fuchsia
];

/** @type {{text: string, type: string}[]} newest first, max 8 entries */
const history = [];

let busy = false; // stops clicks while the pop animation plays

/* ---------- 2. Small helpers ---------- */
const $ = (id) => document.getElementById(id);

const stackEl = $("stack");
const inputEl = $("valueInput");
const pushBtn = $("pushBtn");
const popBtn = $("popBtn");
const peekBtn = $("peekBtn");
const messageEl = $("message");
const sizeValueEl = $("sizeValue");
const meterEl = $("meter");
const meterFillEl = $("meterFill");
const historyEl = $("history");
const historyEmptyEl = $("historyEmpty");

/** Show a status line; type is "ok" | "warn" | "error". */
function setMessage(text, type) {
  messageEl.className = "message message--" + type;
  messageEl.textContent = text;
  void messageEl.offsetWidth; // restart the entrance animation
  messageEl.classList.add("is-anim");
}

/** Keep the newest 8 operations so the list stays small. */
function logHistory(text, type) {
  history.unshift({ text: text, type: type });
  if (history.length > 8) history.pop();
  renderHistory();
}

function renderHistory() {
  historyEl.textContent = "";
  historyEmptyEl.hidden = history.length > 0;

  for (const item of history) {
    const li = document.createElement("li");
    li.className = "is-" + item.type;

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent = item.text; // textContent keeps user values safe

    li.append(dot, label);
    historyEl.append(li);
  }
}

/** Fill the 8 fixed slots: filled blocks first, then empty placeholders. */
function render(enterIndex) {
  stackEl.textContent = "";

  for (let i = 0; i < CAPACITY; i++) {
    const filled = i < stack.length;
    const li = document.createElement("li");

    li.className = filled ? "block" : "block is-empty";
    li.style.setProperty("--c-rgb", COLORS[i]);
    li.style.setProperty("--c", "rgb(" + COLORS[i] + ")");

    const idx = document.createElement("span");
    idx.className = "block__idx";
    idx.textContent = String(i);

    const val = document.createElement("span");
    val.className = "block__val";

    if (filled) {
      val.textContent = stack[i];
      if (i === stack.length - 1) li.classList.add("is-top"); // TOP pointer
      if (i === enterIndex) li.classList.add("is-enter"); // push animation
    } else {
      val.textContent = "—";
    }

    li.append(idx, val);

    if (filled && i === stack.length - 1) {
      const flag = document.createElement("span");
      flag.className = "top-flag";
      const line = document.createElement("span");
      line.className = "top-flag__line";
      const label = document.createElement("span");
      label.className = "top-flag__label";
      label.textContent = "TOP";
      flag.append(line, label);
      li.append(flag);
    }

    stackEl.append(li);
  }

  updateSize();
}

function updateSize() {
  const n = stack.length;
  sizeValueEl.textContent = n + " / " + CAPACITY;
  meterFillEl.style.width = (n / CAPACITY) * 100 + "%";
  meterEl.classList.toggle("is-full", n === CAPACITY);
}

/* ---------- 3. Push / Pop / Peek ---------- */
function push() {
  if (busy) return;

  const value = inputEl.value.trim();

  if (value.length === 0) {
    setMessage("⚠ Invalid input — type a value before you push.", "warn");
    logHistory("push() → invalid input", "warn");
    inputEl.focus();
    return;
  }

  if (stack.length >= CAPACITY) {
    setMessage("⛔ Stack overflow — capacity is 8. Pop a value, then push again.", "error");
    logHistory('push("' + value + '") → overflow', "error");
    return;
  }

  stack.push(value); // O(1): added straight on top
  render(stack.length - 1);

  inputEl.value = "";
  inputEl.focus();

  setMessage('✅ Pushed "' + value + '" — new top is "' + value + '".', "ok");
  logHistory('push("' + value + '") → size ' + stack.length, "ok");
}

function pop() {
  if (busy) return;

  if (stack.length === 0) {
    setMessage("⛔ Stack underflow — the stack is empty, nothing to pop.", "error");
    logHistory("pop() → underflow", "error");
    return;
  }

  const removed = stack[stack.length - 1];
  const topBlock = stackEl.querySelector(".is-top");

  busy = true;
  if (topBlock) topBlock.classList.add("is-leave"); // removal animation

  window.setTimeout(function () {
    stack.pop(); // O(1): only the top element goes
    busy = false;
    render();

    if (stack.length === 0) {
      setMessage('✅ Popped "' + removed + '" — the stack is now empty.', "ok");
    } else {
      setMessage(
        '✅ Popped "' + removed + '" — new top is "' + stack[stack.length - 1] + '".',
        "ok"
      );
    }
    logHistory('pop() → removed "' + removed + '"', "ok");
  }, 260);
}

function peek() {
  if (busy) return;

  if (stack.length === 0) {
    setMessage("⛔ Stack underflow — the stack is empty, nothing to peek.", "error");
    logHistory("peek() → underflow", "error");
    return;
  }

  const top = stack[stack.length - 1];
  setMessage('🔎 Top element is "' + top + '" — size is ' + stack.length + ".", "ok");
  logHistory('peek() → "' + top + '"', "ok");

  const topBlock = stackEl.querySelector(".is-top");
  if (topBlock) {
    topBlock.classList.remove("is-peek");
    void topBlock.offsetWidth; // restart the pulse
    topBlock.classList.add("is-peek");
    window.setTimeout(function () {
      topBlock.classList.remove("is-peek");
    }, 950);
  }
}

/* ---------- 4. Wire up the buttons ---------- */
pushBtn.addEventListener("click", push);
popBtn.addEventListener("click", pop);
peekBtn.addEventListener("click", peek);

inputEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    push();
  }
});

// first paint
render();
renderHistory();
