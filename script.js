/* =============================================================
   PRODDASH — script.js
   Every feature wired up. Every ID matches index.html exactly.
   All data saved to localStorage — survives page refresh.
============================================================= */

// ── STORAGE ──────────────────────────────────────────────────
function load(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── STATE ─────────────────────────────────────────────────────
let assignments    = load("assignments",    []);
let tasks          = load("tasks",          []);
let gpaCourses     = load("gpaCourses",     []);
let flashcards     = load("flashcards",     []);
let exams          = load("exams",          []);
let tasksCompleted = load("tasksCompleted", 0);
let studyMinutes   = load("studyMinutes",   0);
let fcIndex        = 0;

// ── NAVIGATION ────────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

// ── DARK MODE (persisted) ─────────────────────────────────────
const darkToggle = document.getElementById("darkToggle");
if (load("darkMode", false)) {
  document.body.classList.add("dark");
  darkToggle.checked = true;
}
darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkToggle.checked);
  save("darkMode", darkToggle.checked);
});

// ── DASHBOARD ─────────────────────────────────────────────────
function refreshDashboard() {
  document.getElementById("assignmentsRemaining").textContent = assignments.length;
  document.getElementById("tasksCompleted").textContent       = tasksCompleted;
  document.getElementById("studyTime").textContent            = studyMinutes + " min";

  // next upcoming exam
  const today = dayStart(new Date());
  const next  = exams
    .map(e => ({ ...e, d: diffDays(today, new Date(e.date)) }))
    .filter(e => e.d >= 0)
    .sort((a, b) => a.d - b.d)[0];
  document.getElementById("nextExamDash").textContent = next ? next.d + "d" : "—";
}

// ── ASSIGNMENTS ───────────────────────────────────────────────
document.getElementById("assignmentForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const inp  = document.getElementById("assignmentInput");
  const datE = document.getElementById("assignmentDate");
  if (!inp.value.trim()) return;
  assignments.push({ text: inp.value.trim(), date: datE.value });
  save("assignments", assignments);
  inp.value = ""; datE.value = "";
  renderAssignments();
  refreshDashboard();
});

function renderAssignments() {
  const ul = document.getElementById("assignmentList");
  ul.innerHTML = "";
  if (!assignments.length) {
    ul.innerHTML = '<li class="empty-item">No assignments yet.</li>';
    return;
  }
  assignments.forEach((a, i) => {
    const li  = document.createElement("li");
    const sp  = document.createElement("span");
    sp.innerHTML = a.text + (a.date ? ' <em>· Due ' + fmtDate(a.date) + '</em>' : '');
    const btn = document.createElement("button");
    btn.className = "done-btn"; btn.textContent = "✓ Done";
    btn.onclick = () => {
      assignments.splice(i, 1); save("assignments", assignments);
      tasksCompleted++; save("tasksCompleted", tasksCompleted);
      renderAssignments(); refreshDashboard();
    };
    li.appendChild(sp); li.appendChild(btn); ul.appendChild(li);
  });
}

// ── PLANNER ───────────────────────────────────────────────────
document.getElementById("plannerForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const inp  = document.getElementById("plannerTask");
  const tim  = document.getElementById("plannerTime");
  if (!inp.value.trim()) return;
  tasks.push({ text: inp.value.trim(), time: tim.value });
  save("tasks", tasks);
  inp.value = ""; tim.value = "";
  renderPlanner();
});

function renderPlanner() {
  const ul = document.getElementById("plannerList");
  ul.innerHTML = "";
  if (!tasks.length) {
    ul.innerHTML = '<li class="empty-item">No tasks yet.</li>';
    return;
  }
  tasks.forEach((t, i) => {
    const li  = document.createElement("li");
    const sp  = document.createElement("span");
    sp.innerHTML = t.text + (t.time ? ' <em>· ' + t.time + '</em>' : '');
    const btn = document.createElement("button");
    btn.className = "done-btn"; btn.textContent = "✓ Done";
    btn.onclick = () => {
      tasks.splice(i, 1); save("tasks", tasks);
      tasksCompleted++; save("tasksCompleted", tasksCompleted);
      renderPlanner(); refreshDashboard();
    };
    li.appendChild(sp); li.appendChild(btn); ul.appendChild(li);
  });
}

// ── GRADE CALCULATOR ─────────────────────────────────────────
document.getElementById("gradeForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const vals = [...document.querySelectorAll(".gradeInput")]
    .map(i => parseFloat(i.value)).filter(v => !isNaN(v));
  if (!vals.length) return;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  document.getElementById("avgGrade").textContent = avg.toFixed(2);
});

// ── GPA CALCULATOR ────────────────────────────────────────────
document.getElementById("gpaForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const course   = document.getElementById("gpaCourse").value.trim();
  const grade    = parseFloat(document.getElementById("gpaGrade").value);
  const credits  = parseFloat(document.getElementById("gpaCredits").value);
  if (!course || isNaN(grade) || isNaN(credits)) return;
  gpaCourses.push({ course, grade, credits });
  save("gpaCourses", gpaCourses);
  document.getElementById("gpaCourse").value  = "";
  document.getElementById("gpaGrade").value   = "";
  document.getElementById("gpaCredits").value = "";
  renderGPA();
});

function renderGPA() {
  const ul = document.getElementById("gpaCourseList");
  ul.innerHTML = "";
  let pts = 0, crs = 0;
  gpaCourses.forEach((c, i) => {
    pts += c.grade * c.credits;
    crs += c.credits;
    const li  = document.createElement("li");
    const sp  = document.createElement("span");
    sp.innerHTML = c.course + ' — <strong>' + gradeLabel(c.grade) + '</strong> (' + c.credits + ' cr)';
    const btn = document.createElement("button");
    btn.className = "done-btn"; btn.textContent = "Remove";
    btn.onclick = () => {
      gpaCourses.splice(i, 1); save("gpaCourses", gpaCourses); renderGPA();
    };
    li.appendChild(sp); li.appendChild(btn); ul.appendChild(li);
  });
  document.getElementById("gpaResult").textContent = crs > 0 ? (pts / crs).toFixed(2) : "—";
}

function gradeLabel(v) {
  return ({4:"A",3.7:"A-",3.3:"B+",3:"B",2.7:"B-",2.3:"C+",2:"C",1.7:"C-",1:"D",0:"F"})[v] ?? v;
}

// ── FLASHCARDS ────────────────────────────────────────────────
document.getElementById("fcForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const front = document.getElementById("fcFrontInput").value.trim();
  const back  = document.getElementById("fcBackInput").value.trim();
  if (!front || !back) return;
  flashcards.push({ front, back });
  save("flashcards", flashcards);
  document.getElementById("fcFrontInput").value = "";
  document.getElementById("fcBackInput").value  = "";
  fcIndex = flashcards.length - 1;
  renderFC();
});

document.getElementById("fcCard").addEventListener("click", () => {
  document.getElementById("fcCard").classList.toggle("flipped");
});

document.getElementById("fcNext").addEventListener("click", () => {
  if (!flashcards.length) return;
  fcIndex = (fcIndex + 1) % flashcards.length;
  document.getElementById("fcCard").classList.remove("flipped");
  renderFC();
});

document.getElementById("fcPrev").addEventListener("click", () => {
  if (!flashcards.length) return;
  fcIndex = (fcIndex - 1 + flashcards.length) % flashcards.length;
  document.getElementById("fcCard").classList.remove("flipped");
  renderFC();
});

document.getElementById("fcShuffle").addEventListener("click", () => {
  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }
  save("flashcards", flashcards);
  fcIndex = 0;
  document.getElementById("fcCard").classList.remove("flipped");
  renderFC();
});

document.getElementById("fcDelete").addEventListener("click", () => {
  if (!flashcards.length) return;
  flashcards.splice(fcIndex, 1);
  save("flashcards", flashcards);
  fcIndex = Math.max(0, fcIndex - 1);
  document.getElementById("fcCard").classList.remove("flipped");
  renderFC();
});

function renderFC() {
  const study = document.getElementById("fcStudy");
  const empty = document.getElementById("fcEmpty");
  if (!flashcards.length) {
    study.style.display = "none";
    empty.style.display = "block";
    return;
  }
  study.style.display = "flex";
  empty.style.display = "none";
  document.getElementById("fcFrontText").textContent = flashcards[fcIndex].front;
  document.getElementById("fcBackText").textContent  = flashcards[fcIndex].back;
  document.getElementById("fcCount").textContent     = (fcIndex + 1) + " / " + flashcards.length;
}

// ── EXAM COUNTDOWN ────────────────────────────────────────────
document.getElementById("examForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("examName").value.trim();
  const date = document.getElementById("examDate").value;
  if (!name || !date) return;
  exams.push({ name, date });
  save("exams", exams);
  document.getElementById("examName").value = "";
  document.getElementById("examDate").value = "";
  renderExams();
  refreshDashboard();
});

function renderExams() {
  const grid  = document.getElementById("examGrid");
  const empty = document.getElementById("examEmpty");
  grid.innerHTML = "";
  if (!exams.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  const today  = dayStart(new Date());
  const sorted = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((exam, si) => {
    const diff  = diffDays(today, new Date(exam.date));
    const label = diff < 0 ? "Passed" : diff === 0 ? "Today!" : diff + " day" + (diff !== 1 ? "s" : "");

    const card = document.createElement("div");
    card.className = "exam-card" +
      (diff >= 0 && diff <= 3 ? " urgent" : (diff > 3 && diff <= 7 ? " soon" : ""));

    const daysEl = document.createElement("div"); daysEl.className = "ex-days"; daysEl.textContent = label;
    const nameEl = document.createElement("div"); nameEl.className = "ex-name"; nameEl.textContent = exam.name;
    const dateEl = document.createElement("div"); dateEl.className = "ex-date"; dateEl.textContent = fmtDate(exam.date);
    const btn    = document.createElement("button"); btn.className = "done-btn"; btn.textContent = "Remove";
    btn.onclick  = () => {
      const oi = exams.findIndex(x => x.name === sorted[si].name && x.date === sorted[si].date);
      if (oi > -1) { exams.splice(oi, 1); save("exams", exams); }
      renderExams(); refreshDashboard();
    };

    card.appendChild(daysEl); card.appendChild(nameEl);
    card.appendChild(dateEl); card.appendChild(btn);
    grid.appendChild(card);
  });
}

// ── POMODORO ──────────────────────────────────────────────────
let timeLeft = 1500, timerOn = false, timerIv = null, onBreak = false;

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timerMin").textContent    = m;
  document.getElementById("timerSec").textContent    = s;
  document.getElementById("focusDisplay").textContent = m + ":" + s;
}

document.getElementById("btnStart").addEventListener("click", () => {
  if (timerOn) return;
  timerOn = true;
  timerIv = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerIv); timerOn = false;
      if (!onBreak) {
        studyMinutes += 25; save("studyMinutes", studyMinutes); refreshDashboard();
        alert("🎉 Session done! Take a 5-minute break.");
        timeLeft = 300; onBreak = true;
        document.getElementById("timerMode").textContent = "Break Time";
      } else {
        alert("⏰ Break over! Back to work.");
        timeLeft = 1500; onBreak = false;
        document.getElementById("timerMode").textContent = "Focus Session";
      }
      updateTimerDisplay();
    }
  }, 1000);
});

document.getElementById("btnPause").addEventListener("click", () => {
  clearInterval(timerIv); timerOn = false;
});

document.getElementById("btnReset").addEventListener("click", () => {
  clearInterval(timerIv); timerOn = false; onBreak = false; timeLeft = 1500;
  document.getElementById("timerMode").textContent = "Focus Session";
  updateTimerDisplay();
});

// ── HELPERS ───────────────────────────────────────────────────
function dayStart(d) { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function diffDays(from, to) { return Math.round((dayStart(to) - from) / 86400000); }
function fmtDate(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

// ── BOOT ──────────────────────────────────────────────────────
renderAssignments();
renderPlanner();
renderGPA();
renderFC();
renderExams();
refreshDashboard();
updateTimerDisplay();
