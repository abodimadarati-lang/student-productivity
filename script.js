// ============================================================
//  STORAGE — all data lives in localStorage so it survives
//  page refreshes. Every feature reads AND writes here.
// ============================================================
const S = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
};

// ============================================================
//  APP STATE  (loaded from localStorage on every page load)
// ============================================================
let assignments   = S.get("assignments");
let tasks         = S.get("tasks");
let gpaCourses    = S.get("gpaCourses");
let flashcards    = S.get("flashcards");
let exams         = S.get("exams");
let tasksCompleted = S.get("tasksCompleted", 0);
let studyMinutes  = S.get("studyMinutes", 0);
let fcIndex       = 0;

// ============================================================
//  NAVIGATION
// ============================================================
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

// ============================================================
//  DARK MODE
// ============================================================
const darkSwitch = document.getElementById("darkModeSwitch");
// Restore previous preference
if (S.get("darkMode", false)) {
  document.body.classList.add("dark");
  darkSwitch.checked = true;
}
darkSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkSwitch.checked);
  S.set("darkMode", darkSwitch.checked);
});

// ============================================================
//  DASHBOARD — update stat cards
// ============================================================
function updateDashboard() {
  document.getElementById("assignmentsRemaining").textContent = assignments.length;
  document.getElementById("tasksCompleted").textContent = tasksCompleted;
  document.getElementById("studyTime").textContent = studyMinutes + " min";
  updateNextExam();
}

function updateNextExam() {
  const el = document.getElementById("nextExamDash");
  const today = startOfDay(new Date());
  const upcoming = exams
    .map(e => ({ ...e, diff: dayDiff(today, new Date(e.date)) }))
    .filter(e => e.diff >= 0)
    .sort((a, b) => a.diff - b.diff);
  el.textContent = upcoming.length ? upcoming[0].diff + "d" : "—";
}

// ============================================================
//  ASSIGNMENTS
// ============================================================
document.getElementById("assignmentForm").addEventListener("submit", e => {
  e.preventDefault();
  const nameEl = document.getElementById("assignmentInput");
  const dateEl = document.getElementById("assignmentDate");
  if (!nameEl.value.trim()) return;
  assignments.push({ text: nameEl.value.trim(), date: dateEl.value });
  S.set("assignments", assignments);
  nameEl.value = "";
  dateEl.value = "";
  renderAssignments();
  updateDashboard();
});

function renderAssignments() {
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";
  if (!assignments.length) {
    list.innerHTML = '<li class="empty-item">No assignments yet.</li>';
    return;
  }
  assignments.forEach((a, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${a.text} <em>${a.date ? "· Due " + formatDate(a.date) : ""}</em></span>`;
    const btn = document.createElement("button");
    btn.className = "btn-done";
    btn.textContent = "✓ Done";
    btn.onclick = () => {
      assignments.splice(i, 1);
      S.set("assignments", assignments);
      tasksCompleted++;
      S.set("tasksCompleted", tasksCompleted);
      renderAssignments();
      updateDashboard();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ============================================================
//  PLANNER
// ============================================================
document.getElementById("plannerForm").addEventListener("submit", e => {
  e.preventDefault();
  const taskEl = document.getElementById("plannerTask");
  const timeEl = document.getElementById("plannerTime");
  if (!taskEl.value.trim()) return;
  tasks.push({ text: taskEl.value.trim(), time: timeEl.value });
  S.set("tasks", tasks);
  taskEl.value = "";
  timeEl.value = "";
  renderTasks();
});

function renderTasks() {
  const list = document.getElementById("plannerList");
  list.innerHTML = "";
  if (!tasks.length) {
    list.innerHTML = '<li class="empty-item">No tasks yet.</li>';
    return;
  }
  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t.text} <em>${t.time ? "· " + t.time : ""}</em></span>`;
    const btn = document.createElement("button");
    btn.className = "btn-done";
    btn.textContent = "✓ Done";
    btn.onclick = () => {
      tasks.splice(i, 1);
      S.set("tasks", tasks);
      tasksCompleted++;
      S.set("tasksCompleted", tasksCompleted);
      renderTasks();
      updateDashboard();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ============================================================
//  GRADE CALCULATOR
// ============================================================
document.getElementById("gradeForm").addEventListener("submit", e => {
  e.preventDefault();
  const vals = [...document.querySelectorAll(".gradeInput")]
    .map(i => parseFloat(i.value))
    .filter(v => !isNaN(v));
  if (!vals.length) return;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  document.getElementById("averageGrade").textContent = avg.toFixed(2);
});

// ============================================================
//  GPA CALCULATOR
// ============================================================
document.getElementById("gpaForm").addEventListener("submit", e => {
  e.preventDefault();
  const course   = document.getElementById("gpaCourse").value.trim();
  const grade    = parseFloat(document.getElementById("gpaGrade").value);
  const credits  = parseFloat(document.getElementById("gpaCredits").value);
  if (!course || isNaN(grade) || isNaN(credits)) return;
  gpaCourses.push({ course, grade, credits });
  S.set("gpaCourses", gpaCourses);
  document.getElementById("gpaCourse").value  = "";
  document.getElementById("gpaGrade").value   = "";
  document.getElementById("gpaCredits").value = "";
  renderGPA();
});

function renderGPA() {
  const list = document.getElementById("gpaCourseList");
  list.innerHTML = "";
  let totalPts = 0, totalCr = 0;

  gpaCourses.forEach((c, i) => {
    totalPts += c.grade * c.credits;
    totalCr  += c.credits;
    const li = document.createElement("li");
    li.innerHTML = `<span>${c.course} — <strong>${gradeLabel(c.grade)}</strong> (${c.credits} cr)</span>`;
    const btn = document.createElement("button");
    btn.className = "btn-remove";
    btn.textContent = "Remove";
    btn.onclick = () => {
      gpaCourses.splice(i, 1);
      S.set("gpaCourses", gpaCourses);
      renderGPA();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });

  document.getElementById("gpaResult").textContent =
    totalCr > 0 ? (totalPts / totalCr).toFixed(2) : "—";
}

function gradeLabel(v) {
  return ({ 4.0:"A", 3.7:"A-", 3.3:"B+", 3.0:"B", 2.7:"B-",
            2.3:"C+", 2.0:"C", 1.7:"C-", 1.0:"D", 0.0:"F" })[v] ?? v;
}

// ============================================================
//  FLASHCARDS
// ============================================================
document.getElementById("flashcardForm").addEventListener("submit", e => {
  e.preventDefault();
  const front = document.getElementById("flashcardFront").value.trim();
  const back  = document.getElementById("flashcardBack").value.trim();
  if (!front || !back) return;
  flashcards.push({ front, back });
  S.set("flashcards", flashcards);
  document.getElementById("flashcardFront").value = "";
  document.getElementById("flashcardBack").value  = "";
  fcIndex = flashcards.length - 1;
  renderFlashcard();
});

document.getElementById("flashcard").addEventListener("click", () => {
  document.getElementById("flashcard").classList.toggle("flipped");
});

document.getElementById("fcNext").addEventListener("click", () => {
  if (!flashcards.length) return;
  fcIndex = (fcIndex + 1) % flashcards.length;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

document.getElementById("fcPrev").addEventListener("click", () => {
  if (!flashcards.length) return;
  fcIndex = (fcIndex - 1 + flashcards.length) % flashcards.length;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

document.getElementById("fcShuffle").addEventListener("click", () => {
  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }
  S.set("flashcards", flashcards);
  fcIndex = 0;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

document.getElementById("fcDelete").addEventListener("click", () => {
  if (!flashcards.length) return;
  flashcards.splice(fcIndex, 1);
  S.set("flashcards", flashcards);
  fcIndex = Math.max(0, fcIndex - 1);
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

function renderFlashcard() {
  const study   = document.getElementById("flashcardStudy");
  const empty   = document.getElementById("fcEmpty");
  if (!flashcards.length) {
    study.style.display = "none";
    empty.style.display = "block";
    return;
  }
  study.style.display = "flex";
  empty.style.display = "none";
  document.getElementById("fcFront").textContent   = flashcards[fcIndex].front;
  document.getElementById("fcBack").textContent    = flashcards[fcIndex].back;
  document.getElementById("fcCounter").textContent = `${fcIndex + 1} / ${flashcards.length}`;
}

// ============================================================
//  EXAM COUNTDOWN
// ============================================================
document.getElementById("examForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("examName").value.trim();
  const date = document.getElementById("examDate").value;
  if (!name || !date) return;
  exams.push({ name, date });
  S.set("exams", exams);
  document.getElementById("examName").value = "";
  document.getElementById("examDate").value = "";
  renderExams();
  updateNextExam();
});

function renderExams() {
  const grid  = document.getElementById("examGrid");
  const empty = document.getElementById("examEmpty");
  grid.innerHTML = "";

  const today  = startOfDay(new Date());
  const sorted = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sorted.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  sorted.forEach((exam, si) => {
    const diff = dayDiff(today, new Date(exam.date));
    const label = diff < 0 ? "Passed" : diff === 0 ? "Today!" : `${diff} day${diff !== 1 ? "s" : ""}`;

    const card = document.createElement("div");
    card.className = "exam-card" + (diff >= 0 && diff <= 3 ? " urgent" : diff <= 7 ? " soon" : "");

    card.innerHTML = `
      <div class="exam-days">${label}</div>
      <div class="exam-name">${exam.name}</div>
      <div class="exam-date">${formatDate(exam.date)}</div>
    `;
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      // find original index by matching name+date
      const oi = exams.findIndex(ex => ex.name === sorted[si].name && ex.date === sorted[si].date);
      if (oi !== -1) exams.splice(oi, 1);
      S.set("exams", exams);
      renderExams();
      updateNextExam();
    };
    card.appendChild(removeBtn);
    grid.appendChild(card);
  });
}

// ============================================================
//  POMODORO TIMER
// ============================================================
let timeLeft      = 1500; // 25 min
let timerRunning  = false;
let timerInterval = null;
let onBreak       = false;

function setTimerDisplay(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  document.getElementById("minutes").textContent   = m;
  document.getElementById("seconds").textContent   = s;
  document.getElementById("focusTimer").textContent = `${m}:${s}`;
}

document.getElementById("startTimer").addEventListener("click", () => {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    setTimerDisplay(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      if (!onBreak) {
        studyMinutes += 25;
        S.set("studyMinutes", studyMinutes);
        updateDashboard();
        alert("🎉 Session done! Take a 5-minute break.");
        timeLeft = 300;
        onBreak  = true;
        document.getElementById("timerLabel").textContent = "Break Time";
      } else {
        alert("⏰ Break over! Back to work.");
        timeLeft = 1500;
        onBreak  = false;
        document.getElementById("timerLabel").textContent = "Focus Session";
      }
      setTimerDisplay(timeLeft);
    }
  }, 1000);
});

document.getElementById("pauseTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning = false;
});

document.getElementById("resetTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning = false;
  onBreak      = false;
  timeLeft     = 1500;
  document.getElementById("timerLabel").textContent = "Focus Session";
  setTimerDisplay(timeLeft);
});

// ============================================================
//  HELPERS
// ============================================================
function startOfDay(d) {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c;
}

function dayDiff(from, to) {
  const t = startOfDay(to);
  return Math.round((t - from) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  // dateStr is "YYYY-MM-DD" — parse without timezone shift
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ============================================================
//  BOOT — render everything from saved data
// ============================================================
renderAssignments();
renderTasks();
renderGPA();
renderFlashcard();
renderExams();
updateDashboard();
setTimerDisplay(timeLeft);
