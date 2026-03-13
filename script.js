// script.js - all the javascript for scholarly
// took me forever to get the localStorage stuff working lol


// helper functions for saving/loading from localStorage
// you have to use JSON.parse and JSON.stringify or it breaks

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}


// all the data - loads from localStorage so it saves between refreshes

let homeworkItems     = loadFromStorage("assignments",    []);
let dailyTasks        = loadFromStorage("tasks",          []);
let gpaCourseList     = loadFromStorage("gpaCourses",     []);
let flashcardDeck     = loadFromStorage("flashcards",     []);
let scheduledExams    = loadFromStorage("exams",          []);
let doneTaskCount     = loadFromStorage("tasksCompleted", 0);
let studyMinutesTotal = loadFromStorage("studyMinutes",   0);

// tracks which card youre on
let currentCardIndex = 0;


// navigation - switches between pages when you click the sidebar buttons

document.querySelectorAll(".page-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".page-link").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(s => s.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});


// dark mode toggle - saves so it remembers your preference

const darkModeSwitch = document.getElementById("darkModeSwitch");

if (loadFromStorage("darkMode", false)) {
  document.body.classList.add("dark");
  darkModeSwitch.checked = true;
}

darkModeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkModeSwitch.checked);
  saveToStorage("darkMode", darkModeSwitch.checked);
});


// updates the numbers on the dashboard
// have to call this whenever something changes

function refreshDashboard() {
  document.getElementById("pendingAssignmentCount").textContent = homeworkItems.length;
  document.getElementById("completedTaskCount").textContent     = doneTaskCount;
  document.getElementById("totalStudyTime").textContent         = studyMinutesTotal + " min";

  // get the closest upcoming exam for the dashboard
  const todayStart = getDateOnly(new Date());
  const nextExam   = scheduledExams
    .map(e => ({ ...e, daysAway: daysBetween(todayStart, new Date(e.date)) }))
    .filter(e => e.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)[0];

  document.getElementById("upcomingExamPreview").textContent = nextExam
    ? nextExam.daysAway + "d"
    : "—";
}


// ASSIGNMENTS

document.getElementById("new-homework-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const nameField = document.getElementById("homework-name");
  const dueField  = document.getElementById("homework-due");
  if (!nameField.value.trim()) return;

  homeworkItems.push({ text: nameField.value.trim(), date: dueField.value });
  saveToStorage("assignments", homeworkItems);

  nameField.value = "";
  dueField.value  = "";

  renderHomeworkList();
  refreshDashboard();
});

function renderHomeworkList() {
  const list = document.getElementById("homework-list");
  list.innerHTML = "";

  if (!homeworkItems.length) {
    list.innerHTML = '<li class="empty-item">No assignments yet.</li>';
    return;
  }

  homeworkItems.forEach((item, idx) => {
    const li   = document.createElement("li");
    const text = document.createElement("span");

    text.innerHTML = item.text + (item.date ? ' <em>· Due ' + formatDate(item.date) + '</em>' : '');

    const doneBtn = document.createElement("button");
    doneBtn.className   = "done-btn";
    doneBtn.textContent = "✓ Done";
    doneBtn.onclick = () => {
      homeworkItems.splice(idx, 1);
      saveToStorage("assignments", homeworkItems);

      doneTaskCount++;
      saveToStorage("tasksCompleted", doneTaskCount);

      launchConfetti();
      renderHomeworkList();
      refreshDashboard();
    };

    li.appendChild(text);
    li.appendChild(doneBtn);
    list.appendChild(li);
  });
}


// DAILY PLANNER

document.getElementById("new-task-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const descField = document.getElementById("task-description");
  const timeField = document.getElementById("task-time");
  if (!descField.value.trim()) return;

  dailyTasks.push({ text: descField.value.trim(), time: timeField.value });
  saveToStorage("tasks", dailyTasks);

  descField.value = "";
  timeField.value = "";

  renderTaskList();
});

function renderTaskList() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  if (!dailyTasks.length) {
    list.innerHTML = '<li class="empty-item">No tasks yet.</li>';
    return;
  }

  dailyTasks.forEach((task, idx) => {
    const li   = document.createElement("li");
    const text = document.createElement("span");

    text.innerHTML = task.text + (task.time ? ' <em>· ' + task.time + '</em>' : '');

    const doneBtn = document.createElement("button");
    doneBtn.className   = "done-btn";
    doneBtn.textContent = "✓ Done";
    doneBtn.onclick = () => {
      dailyTasks.splice(idx, 1);
      saveToStorage("tasks", dailyTasks);

      doneTaskCount++;
      saveToStorage("tasksCompleted", doneTaskCount);

      launchConfetti();
      renderTaskList();
      refreshDashboard();
    };

    li.appendChild(text);
    li.appendChild(doneBtn);
    list.appendChild(li);
  });
}


// GPA CALCULATOR
// just averages all your grades, nothing fancy

document.getElementById("gpa-entry-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const courseName = document.getElementById("course-name").value.trim();
  const grade      = parseFloat(document.getElementById("course-grade").value);

  if (!courseName || isNaN(grade)) return;

  gpaCourseList.push({ course: courseName, grade: grade });
  saveToStorage("gpaCourses", gpaCourseList);

  // clear the form
  document.getElementById("course-name").value  = "";
  document.getElementById("course-grade").value = "";

  renderGPACourses();
});

function renderGPACourses() {
  const list = document.getElementById("course-list");
  list.innerHTML = "";

  let total = 0;

  gpaCourseList.forEach((entry, idx) => {
    total += entry.grade;

    const li   = document.createElement("li");
    const text = document.createElement("span");

    text.innerHTML = entry.course + ' — <strong>' + entry.grade + '%</strong>';

    const removeBtn = document.createElement("button");
    removeBtn.className   = "done-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      gpaCourseList.splice(idx, 1);
      saveToStorage("gpaCourses", gpaCourseList);
      renderGPACourses();
    };

    li.appendChild(text);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });

  // update the average result
  document.getElementById("gpa-output").textContent =
    gpaCourseList.length > 0 ? (total / gpaCourseList.length).toFixed(2) : "—";
}


// FLASHCARDS

document.getElementById("new-card-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const frontField = document.getElementById("card-front-text");
  const backField  = document.getElementById("card-back-text");

  if (!frontField.value.trim() || !backField.value.trim()) return;

  flashcardDeck.push({ front: frontField.value.trim(), back: backField.value.trim() });
  saveToStorage("flashcards", flashcardDeck);

  frontField.value = "";
  backField.value  = "";

  // jump to the newly added card
  currentCardIndex = flashcardDeck.length - 1;
  renderFlashcards();
});

// flip it when clicked
document.getElementById("active-card").addEventListener("click", () => {
  document.getElementById("active-card").classList.toggle("flipped");
});

document.getElementById("next-card-btn").addEventListener("click", () => {
  if (!flashcardDeck.length) return;
  currentCardIndex = (currentCardIndex + 1) % flashcardDeck.length;
  document.getElementById("active-card").classList.remove("flipped");
  renderFlashcards();
});

document.getElementById("prev-card-btn").addEventListener("click", () => {
  if (!flashcardDeck.length) return;
  currentCardIndex = (currentCardIndex - 1 + flashcardDeck.length) % flashcardDeck.length;
  document.getElementById("active-card").classList.remove("flipped");
  renderFlashcards();
});

// shuffle - found this algorithm online, it randomizes the order
document.getElementById("shuffle-deck-btn").addEventListener("click", () => {
  for (let i = flashcardDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcardDeck[i], flashcardDeck[j]] = [flashcardDeck[j], flashcardDeck[i]];
  }
  saveToStorage("flashcards", flashcardDeck);
  currentCardIndex = 0;
  document.getElementById("active-card").classList.remove("flipped");
  renderFlashcards();
});

document.getElementById("delete-card-btn").addEventListener("click", () => {
  if (!flashcardDeck.length) return;
  flashcardDeck.splice(currentCardIndex, 1);
  saveToStorage("flashcards", flashcardDeck);
  currentCardIndex = Math.max(0, currentCardIndex - 1);
  document.getElementById("active-card").classList.remove("flipped");
  renderFlashcards();
});

function renderFlashcards() {
  const viewer   = document.getElementById("card-viewer");
  const emptyMsg = document.getElementById("empty-deck-msg");

  if (!flashcardDeck.length) {
    viewer.style.display   = "none";
    emptyMsg.style.display = "block";
    return;
  }

  viewer.style.display   = "flex";
  emptyMsg.style.display = "none";

  const card = flashcardDeck[currentCardIndex];
  document.getElementById("card-front-display").textContent  = card.front;
  document.getElementById("card-back-display").textContent   = card.back;
  document.getElementById("card-position-label").textContent = (currentCardIndex + 1) + " / " + flashcardDeck.length;
}


// EXAM COUNTDOWN

document.getElementById("new-exam-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const nameField = document.getElementById("exam-name-input");
  const dateField = document.getElementById("exam-date-input");

  if (!nameField.value.trim() || !dateField.value) return;

  scheduledExams.push({ name: nameField.value.trim(), date: dateField.value });
  saveToStorage("exams", scheduledExams);

  nameField.value = "";
  dateField.value = "";

  renderExamGrid();
  refreshDashboard();
});

function renderExamGrid() {
  const grid     = document.getElementById("exam-cards-grid");
  const emptyMsg = document.getElementById("no-exams-msg");

  grid.innerHTML = "";

  if (!scheduledExams.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  const today  = getDateOnly(new Date());
  // sort by date so the closest exam shows first
  const sorted = [...scheduledExams].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((exam, sortedIdx) => {
    const daysLeft = daysBetween(today, new Date(exam.date));
    const countdownText = daysLeft < 0   ? "Passed"
                        : daysLeft === 0 ? "Today!"
                        : daysLeft + " day" + (daysLeft !== 1 ? "s" : "");

    // red if its in 3 days, yellow if its within a week
    const urgencyClass = (daysLeft >= 0 && daysLeft <= 3) ? " urgent"
                       : (daysLeft > 3  && daysLeft <= 7) ? " soon"
                       : "";

    const card = document.createElement("div");
    card.className = "exam-card" + urgencyClass;

    const countdownEl = document.createElement("div");
    countdownEl.className   = "exam-days-remaining";
    countdownEl.textContent = countdownText;

    const nameEl = document.createElement("div");
    nameEl.className   = "exam-title";
    nameEl.textContent = exam.name;

    const dateEl = document.createElement("div");
    dateEl.className   = "exam-date-label";
    dateEl.textContent = formatDate(exam.date);

    const removeBtn = document.createElement("button");
    removeBtn.className   = "done-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      // have to find it in the original array not the sorted one
      const originalIdx = scheduledExams.findIndex(
        x => x.name === sorted[sortedIdx].name && x.date === sorted[sortedIdx].date
      );
      if (originalIdx > -1) {
        scheduledExams.splice(originalIdx, 1);
        saveToStorage("exams", scheduledExams);
      }
      renderExamGrid();
      refreshDashboard();
    };

    card.appendChild(countdownEl);
    card.appendChild(nameEl);
    card.appendChild(dateEl);
    card.appendChild(removeBtn);
    grid.appendChild(card);
  });
}


// POMODORO TIMER
// 25 min work then 5 min break, adds to study time on dashboard
// TODO: maybe make the alert nicer someday

let secondsRemaining = 1500; // 25 min
let timerRunning     = false;
let timerInterval    = null;
let isBreakPhase     = false;

function updateClockDisplay() {
  const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const secs = String(secondsRemaining % 60).padStart(2, "0");
  document.getElementById("clock-minutes").textContent = mins;
  document.getElementById("clock-seconds").textContent = secs;
}

document.getElementById("timer-start-btn").addEventListener("click", () => {
  if (timerRunning) return;

  timerRunning  = true;
  timerInterval = setInterval(() => {
    secondsRemaining--;
    updateClockDisplay();

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;

      if (!isBreakPhase) {
        // session done, add 25 min to study time and switch to break
        studyMinutesTotal += 25;
        saveToStorage("studyMinutes", studyMinutesTotal);
        refreshDashboard();

        alert("🎉 Session done! Take a 5-minute break.");
        secondsRemaining = 300; // 5 min break
        isBreakPhase     = true;
        document.getElementById("session-type-label").textContent = "Break Time";
      } else {
        alert("⏰ Break over! Back to work.");
        secondsRemaining = 1500;
        isBreakPhase     = false;
        document.getElementById("session-type-label").textContent = "Focus Session";
      }

      updateClockDisplay();
    }
  }, 1000);
});

document.getElementById("timer-pause-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning = false;
});

document.getElementById("timer-reset-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning     = false;
  isBreakPhase     = false;
  secondsRemaining = 1500;
  document.getElementById("session-type-label").textContent = "Focus Session";
  updateClockDisplay();
});


// date helper functions

// strips the time part off a date so comparisons dont get messed up
function getDateOnly(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// returns how many days between two dates (negative means its already passed)
function daysBetween(from, to) {
  return Math.round((getDateOnly(to) - from) / 86400000);
}

// turns "2024-09-15" into something readable like "Sep 15, 2024"
function formatDate(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}


// run everything on load

renderHomeworkList();
renderTaskList();
renderGPACourses();
renderFlashcards();
renderExamGrid();
refreshDashboard();
updateClockDisplay();


// COLLAPSIBLE SIDEBAR
// clicking the logo or the hamburger button shows/hides it

const sideNav       = document.getElementById("sideNav");
const sidebarToggle = document.getElementById("sidebarToggle");
const hamburger     = document.getElementById("hamburger");

const appWrapper = document.querySelector(".app-wrapper");

function toggleSidebar() {
  const isHidden = sideNav.classList.toggle("collapsed");
  appWrapper.classList.toggle("sidebar-collapsed", isHidden);
  hamburger.style.display = isHidden ? "block" : "none";
  saveToStorage("sidebarCollapsed", isHidden);
}

sidebarToggle.addEventListener("click", toggleSidebar);
hamburger.addEventListener("click", toggleSidebar);

// restore sidebar state from last session
if (loadFromStorage("sidebarCollapsed", false)) {
  appWrapper.classList.add("sidebar-collapsed");
  sideNav.classList.add("collapsed");
  hamburger.style.display = "block";
}


// STUDY STREAK
// goes up by 1 each new day you open the app, resets if you miss a day

function updateStreak() {
  const today     = new Date().toDateString();
  const lastVisit = loadFromStorage("lastVisitDate", null);
  let streak      = loadFromStorage("studyStreak", 0);

  if (lastVisit === today) {
    // already visited today, just show the current streak
  } else if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
    // visited yesterday so increment the streak
    streak++;
    saveToStorage("studyStreak", streak);
    saveToStorage("lastVisitDate", today);
  } else {
    // missed a day or first visit ever, reset
    streak = 1;
    saveToStorage("studyStreak", streak);
    saveToStorage("lastVisitDate", today);
  }

  document.getElementById("streakCount").textContent = streak + " 🔥";
}

updateStreak();


// WELCOME SCREEN
// only shows up the first time you open the app, asks for your name

function initWelcome() {
  const savedName = loadFromStorage("userName", null);

  if (savedName) {
    // already set - just update the greeting
    setGreeting(savedName);
    return;
  }

  // first visit - show the overlay
  const overlay = document.getElementById("welcome-overlay");
  overlay.style.display = "flex";

  // focus the input automatically
  setTimeout(() => document.getElementById("welcome-name-input").focus(), 100);

  // submit on button click
  document.getElementById("welcome-submit-btn").addEventListener("click", submitName);

  // also submit on Enter key
  document.getElementById("welcome-name-input").addEventListener("keydown", e => {
    if (e.key === "Enter") submitName();
  });
}

function submitName() {
  const input = document.getElementById("welcome-name-input");
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }

  saveToStorage("userName", name);
  document.getElementById("welcome-overlay").style.display = "none";
  setGreeting(name);
}

function setGreeting(name) {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const el   = document.getElementById("dashboard-greeting");
  if (el) el.textContent = time + ", " + name + " 👋";
}

initWelcome();


// CONFETTI
// goes off when you mark something as done, took a while to get this working

function launchConfetti() {
  const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#ffffff", "#bfdbfe"];
  const count  = 80;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    // random position, color, size, rotation
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const left   = Math.random() * 100;
    const width  = Math.random() * 8 + 5;
    const height = Math.random() * 5 + 4;
    const delay  = Math.random() * 0.4;
    const dur    = Math.random() * 1 + 1.2;

    piece.style.cssText = `
      left: ${left}vw;
      width: ${width}px;
      height: ${height}px;
      background: ${color};
      animation-delay: ${delay}s;
      animation-duration: ${dur}s;
      transform: rotate(${Math.random() * 360}deg);
    `;

    document.body.appendChild(piece);

    // remove piece after animation finishes
    setTimeout(() => piece.remove(), (delay + dur) * 1000 + 200);
  }
}


// SAT SCORE TRACKER

let satScores = loadFromStorage("satScores", []);

document.getElementById("sat-score-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const date    = document.getElementById("sat-score-date").value;
  const math    = parseInt(document.getElementById("sat-score-math").value);
  const reading = parseInt(document.getElementById("sat-score-reading").value);
  if (!date || isNaN(math) || isNaN(reading)) return;

  satScores.push({ date, math, reading, total: math + reading });
  saveToStorage("satScores", satScores);

  document.getElementById("sat-score-date").value    = "";
  document.getElementById("sat-score-math").value    = "";
  document.getElementById("sat-score-reading").value = "";

  renderSatScores();
});

function renderSatScores() {
  const list     = document.getElementById("sat-scores-list");
  const empty    = document.getElementById("sat-scores-empty");
  const summary  = document.getElementById("sat-scores-summary");
  list.innerHTML = "";

  if (!satScores.length) {
    empty.style.display   = "block";
    summary.style.display = "none";
    return;
  }

  empty.style.display   = "none";
  summary.style.display = "flex";

  // sort by date oldest first so progress is visible
  const sorted = [...satScores].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "sat-score-row";

    const info = document.createElement("div");
    info.className = "sat-score-info";
    info.innerHTML = `<span class="sat-score-date-label">${formatDate(s.date)}</span>
      <span class="sat-score-breakdown">Math <strong>${s.math}</strong> · Reading <strong>${s.reading}</strong></span>`;

    const right = document.createElement("div");
    right.className = "sat-score-right";

    const total = document.createElement("span");
    total.className   = "sat-score-total";
    total.textContent = s.total;

    const removeBtn = document.createElement("button");
    removeBtn.className   = "done-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      // find and remove from original unsorted array
      const i = satScores.findIndex(x => x.date === s.date && x.total === s.total);
      if (i > -1) satScores.splice(i, 1);
      saveToStorage("satScores", satScores);
      renderSatScores();
    };

    right.appendChild(total);
    right.appendChild(removeBtn);
    row.appendChild(info);
    row.appendChild(right);
    list.appendChild(row);
  });

  // update summary tiles
  const best   = Math.max(...satScores.map(s => s.total));
  const latest = sorted[sorted.length - 1].total;
  const first  = sorted[0].total;
  const diff   = latest - first;

  document.getElementById("sat-best-total").textContent    = best;
  document.getElementById("sat-latest-total").textContent  = latest;
  document.getElementById("sat-improvement").textContent   = (diff >= 0 ? "+" : "") + diff;
}

renderSatScores();


// SAT WRONG ANSWER LOGGER

let satErrors = loadFromStorage("satErrors", []);

document.getElementById("sat-error-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const section = document.getElementById("sat-error-section").value;
  const topic   = document.getElementById("sat-error-topic").value.trim();
  const reason  = document.getElementById("sat-error-reason").value.trim();
  if (!section || !topic || !reason) return;

  satErrors.push({ section, topic, reason, date: new Date().toDateString() });
  saveToStorage("satErrors", satErrors);

  document.getElementById("sat-error-section").value = "";
  document.getElementById("sat-error-topic").value   = "";
  document.getElementById("sat-error-reason").value  = "";

  renderSatErrors();
});

function renderSatErrors() {
  const list     = document.getElementById("sat-errors-list");
  const empty    = document.getElementById("sat-errors-empty");
  list.innerHTML = "";

  if (!satErrors.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  // show newest first
  [...satErrors].reverse().forEach((err, idx) => {
    const li   = document.createElement("li");
    const text = document.createElement("span");
    text.innerHTML = `<strong>${err.section}</strong> — ${err.topic} <em>· ${err.reason}</em>`;

    const removeBtn = document.createElement("button");
    removeBtn.className   = "done-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      const realIdx = satErrors.length - 1 - idx;
      satErrors.splice(realIdx, 1);
      saveToStorage("satErrors", satErrors);
      renderSatErrors();
    };

    li.appendChild(text);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

renderSatErrors();


// SAT VOCAB FLASHCARDS
// 700+ words built in, same flip card thing as the regular flashcards

let satVocabList = [
  { word: 'Abase', def: 'cause to feel shame' },
  { word: 'Abate', def: 'become less in amount or intensity' },
  { word: 'Abdicate', def: 'give up power, duties, or obligations' },
  { word: 'Abduct', def: 'take away to an undisclosed location against their will' },
  { word: 'Aberration', def: 'a state or condition markedly different from the norm' },
  { word: 'Abet', def: 'assist or encourage, usually in some wrongdoing' },
  { word: 'Abhor', def: 'feel hatred or disgust toward' },
  { word: 'Abide', def: 'dwell' },
  { word: 'Abject', def: 'of the most contemptible kind' },
  { word: 'Abjure', def: 'formally reject or disavow a formerly held belief' },
  { word: 'Abnegation', def: 'the denial and rejection of a doctrine or belief' },
  { word: 'Abort', def: 'terminate before completion' },
  { word: 'Abridge', def: 'lessen, diminish, or curtail' },
  { word: 'Abrogate', def: 'revoke formally' },
  { word: 'Abscond', def: 'run away, often taking something or somebody along' },
  { word: 'Absolution', def: 'the act of being formally forgiven' },
  { word: 'Abstain', def: 'refrain from doing, consuming, or partaking in something' },
  { word: 'Abstruse', def: 'difficult to understand' },
  { word: 'Accede', def: 'yield to another\'s wish or opinion' },
  { word: 'Accentuate', def: 'stress or single out as important' },
  { word: 'Acclaim', def: 'enthusiastic approval' },
  { word: 'Accolade', def: 'a tangible symbol signifying approval or distinction' },
  { word: 'Accommodating', def: 'obliging; willing to do favors' },
  { word: 'Accord', def: 'concurrence of opinion' },
  { word: 'Accost', def: 'approach and speak to someone aggressively or insistently' },
  { word: 'Accretion', def: 'an increase by natural growth or addition' },
  { word: 'Acerbic', def: 'sour or bitter in taste' },
  { word: 'Acquiesce', def: 'agree or express agreement' },
  { word: 'Acrimony', def: 'a rough and bitter manner' },
  { word: 'Acumen', def: 'shrewdness shown by keen insight' },
  { word: 'Acute', def: 'ending in a sharp point' },
  { word: 'Adamant', def: 'refusing to change one\'s mind; uncompromising' },
  { word: 'Adept', def: 'having or showing knowledge and skill and aptitude' },
  { word: 'Adhere', def: 'stick to firmly' },
  { word: 'Admonish', def: 'scold or reprimand; take to task' },
  { word: 'Adorn', def: 'make more attractive by adding ornament or color' },
  { word: 'Adroit', def: 'quick or skillful or adept in action or thought' },
  { word: 'Adulation', def: 'exaggerated flattery or praise' },
  { word: 'Adumbrate', def: 'describe roughly or give the main points or summary of' },
  { word: 'Adverse', def: 'in an opposing direction' },
  { word: 'Advocate', def: 'a person who pleads for a person, cause, or idea' },
  { word: 'Aesthetic', def: 'characterized by an appreciation of beauty or good taste' },
  { word: 'Affable', def: 'diffusing warmth and friendliness' },
  { word: 'Affinity', def: 'a natural attraction or feeling of kinship' },
  { word: 'Affluent', def: 'having an abundant supply of money or possessions of value' },
  { word: 'Affront', def: 'a deliberately offensive act' },
  { word: 'Aggrandize', def: 'embellish; increase the scope, power, or importance of' },
  { word: 'Aggregate', def: 'a sum total of many heterogeneous things taken together' },
  { word: 'Aggrieve', def: 'cause to feel distress' },
  { word: 'Agile', def: 'moving quickly and lightly' },
  { word: 'Alacrity', def: 'liveliness and eagerness' },
  { word: 'Allay', def: 'lessen the intensity of or calm' },
  { word: 'Allege', def: 'report or maintain' },
  { word: 'Alleviate', def: 'provide physical relief, as from pain' },
  { word: 'Allocate', def: 'distribute according to a plan or set apart for a purpose' },
  { word: 'Aloof', def: 'distant, cold, or detached in manner' },
  { word: 'Altercation', def: 'a noisy quarrel' },
  { word: 'Amalgamate', def: 'bring or combine together or with something else' },
  { word: 'Ambiguous', def: 'having more than one possible meaning' },
  { word: 'Ambivalent', def: 'uncertain or unable to decide about what course to follow' },
  { word: 'Ameliorate', def: 'make better' },
  { word: 'Amenable', def: 'disposed or willing to comply' },
  { word: 'Amenity', def: 'something that provides value, pleasure, or convenience' },
  { word: 'Amiable', def: 'diffusing warmth and friendliness' },
  { word: 'Amicable', def: 'characterized by friendship and good will' },
  { word: 'Amorphous', def: 'having no definite form or distinct shape' },
  { word: 'Anachronistic', def: 'chronologically misplaced' },
  { word: 'Analogous', def: 'similar or equivalent in some respects' },
  { word: 'Anecdote', def: 'short account of an incident' },
  { word: 'Anguish', def: 'extreme distress of body or mind' },
  { word: 'Anomaly', def: 'deviation from the normal or common order, form, or rule' },
  { word: 'Antagonism', def: 'an actively expressed feeling of dislike and hostility' },
  { word: 'Antecedent', def: 'a preceding occurrence or cause or event' },
  { word: 'Antediluvian', def: 'of or relating to the period before the biblical flood' },
  { word: 'Anthology', def: 'a collection of selected literary passages' },
  { word: 'Antipathy', def: 'a feeling of intense dislike' },
  { word: 'Antiquated', def: 'so extremely old as seeming to belong to an earlier period' },
  { word: 'Antithesis', def: 'exact opposite' },
  { word: 'Apathetic', def: 'showing little or no emotion or animation' },
  { word: 'Apocryphal', def: 'being of questionable authenticity' },
  { word: 'Appease', def: 'make peace with' },
  { word: 'Approbation', def: 'official acceptance or agreement' },
  { word: 'Arbiter', def: 'someone chosen to judge and decide a disputed issue' },
  { word: 'Arbitrary', def: 'based on or subject to individual discretion or preference' },
  { word: 'Arcane', def: 'requiring secret or mysterious knowledge' },
  { word: 'Archaic', def: 'so extremely old as seeming to belong to an earlier period' },
  { word: 'Archetypal', def: 'of an original pattern on which other things are modeled' },
  { word: 'Ardor', def: 'feelings of great warmth and intensity' },
  { word: 'Arid', def: 'lacking sufficient water or rainfall' },
  { word: 'Arrogate', def: 'seize and take control without authority' },
  { word: 'Artisan', def: 'a skilled worker who practices some trade or handicraft' },
  { word: 'Ascertain', def: 'learn or discover with confidence' },
  { word: 'Ascetic', def: 'someone who practices self denial as a spiritual discipline' },
  { word: 'Ascribe', def: 'attribute or credit to' },
  { word: 'Aspersion', def: 'a disparaging remark' },
  { word: 'Aspire', def: 'have an ambitious plan or a lofty goal' },
  { word: 'Assail', def: 'attack someone physically or emotionally' },
  { word: 'Assiduous', def: 'marked by care and persistent effort' },
  { word: 'Assuage', def: 'provide physical relief, as from pain' },
  { word: 'Astute', def: 'marked by practical hardheaded intelligence' },
  { word: 'Atone', def: 'turn away from sin or do penitence' },
  { word: 'Atrophy', def: 'a decrease in size of an organ caused by disease or disuse' },
  { word: 'Attain', def: 'gain with effort' },
  { word: 'Atypical', def: 'not representative of a group, class, or type' },
  { word: 'Audacious', def: 'disposed to venture or take risks' },
  { word: 'Augment', def: 'enlarge or increase' },
  { word: 'Auspicious', def: 'indicating favorable circumstances and good luck' },
  { word: 'Austere', def: 'of a stern or strict bearing or demeanor' },
  { word: 'Avarice', def: 'reprehensible acquisitiveness; insatiable desire for wealth' },
  { word: 'Avenge', def: 'take action in return for a perceived wrong' },
  { word: 'Balk', def: 'refuse to proceed or comply' },
  { word: 'Banal', def: 'repeated too often; overfamiliar through overuse' },
  { word: 'Bane', def: 'something causing misery or death' },
  { word: 'Bashful', def: 'self-consciously timid' },
  { word: 'Beguile', def: 'attract; cause to be enamored' },
  { word: 'Behemoth', def: 'someone or something that is abnormally large and powerful' },
  { word: 'Benevolent', def: 'showing or motivated by sympathy and understanding' },
  { word: 'Benign', def: 'kind in disposition or manner' },
  { word: 'Bequeath', def: 'leave or give, especially by will after one\'s death' },
  { word: 'Berate', def: 'censure severely or angrily' },
  { word: 'Bereft', def: 'lacking or deprived of something' },
  { word: 'Beseech', def: 'ask for or request earnestly' },
  { word: 'Bias', def: 'a partiality preventing objective consideration of an issue' },
  { word: 'Bilk', def: 'cheat somebody out of what is due, especially money' },
  { word: 'Blandish', def: 'praise somewhat dishonestly' },
  { word: 'Blemish', def: 'a mark or flaw that spoils the appearance of something' },
  { word: 'Blight', def: 'any plant disease resulting in withering without rotting' },
  { word: 'Boisterous', def: 'marked by exuberance and high spirits' },
  { word: 'Bombastic', def: 'ostentatiously lofty in style' },
  { word: 'Boon', def: 'something that is desirable, favorable, or beneficial' },
  { word: 'Brazen', def: 'not held back by conventional ideas of behavior' },
  { word: 'Brusque', def: 'rudely abrupt or blunt in speech or manner' },
  { word: 'Burnish', def: 'polish and make shiny' },
  { word: 'Buttress', def: 'a support usually of stone or brick' },
  { word: 'Cacophony', def: 'loud confusing disagreeable sounds' },
  { word: 'Cadence', def: 'the accent in a metrical foot of verse' },
  { word: 'Cajole', def: 'influence or urge by gentle urging, caressing, or flattering' },
  { word: 'Calamity', def: 'an event resulting in great loss and misfortune' },
  { word: 'Callous', def: 'emotionally hardened' },
  { word: 'Calumny', def: 'a false accusation of an offense' },
  { word: 'Camaraderie', def: 'the quality of affording easy familiarity and sociability' },
  { word: 'Candor', def: 'the quality of being honest and straightforward' },
  { word: 'Canny', def: 'showing self-interest and shrewdness in dealing with others' },
  { word: 'Capacious', def: 'large in the amount that can be contained' },
  { word: 'Capitulate', def: 'surrender under agreed conditions' },
  { word: 'Capricious', def: 'determined by chance or impulse rather than by necessity' },
  { word: 'Captivate', def: 'attract; cause to be enamored' },
  { word: 'Caustic', def: 'capable of destroying or eating away by chemical action' },
  { word: 'Censure', def: 'harsh criticism or disapproval' },
  { word: 'Cerebral', def: 'of or relating to the brain' },
  { word: 'Chastise', def: 'scold or criticize severely' },
  { word: 'Chide', def: 'scold or reprimand severely or angrily' },
  { word: 'Circuitous', def: 'deviating from a straight course' },
  { word: 'Circumlocution', def: 'an indirect way of expressing something' },
  { word: 'Circumspect', def: 'careful to consider potential consequences and avoid risk' },
  { word: 'Circumvent', def: 'surround so as to force to give up' },
  { word: 'Clandestine', def: 'conducted with or marked by hidden aims or methods' },
  { word: 'Clemency', def: 'leniency and compassion shown toward offenders' },
  { word: 'Coagulate', def: 'change from a liquid to a thickened or solid state' },
  { word: 'Coalesce', def: 'fuse or cause to come together' },
  { word: 'Coerce', def: 'cause to do through pressure or necessity' },
  { word: 'Cogent', def: 'powerfully persuasive' },
  { word: 'Cognizant', def: 'having or showing knowledge or understanding or realization' },
  { word: 'Coherent', def: 'marked by an orderly and consistent relation of parts' },
  { word: 'Colloquial', def: 'characteristic of informal spoken language or conversation' },
  { word: 'Collusion', def: 'secret agreement' },
  { word: 'Commendation', def: 'an official award given as formal public statement' },
  { word: 'Commensurate', def: 'corresponding in size or degree or extent' },
  { word: 'Compelling', def: 'capable of arousing and holding the attention' },
  { word: 'Complacency', def: 'the feeling you have when you are satisfied with yourself' },
  { word: 'Complement', def: 'something added to embellish or make perfect' },
  { word: 'Compliant', def: 'disposed to act in accordance with someone\'s wishes' },
  { word: 'Complicity', def: 'guilt as a confederate in a crime or offense' },
  { word: 'Comprehensive', def: 'including all or everything' },
  { word: 'Compunction', def: 'a feeling of deep regret, usually for some misdeed' },
  { word: 'Concede', def: 'give over' },
  { word: 'Conciliatory', def: 'making or willing to make concessions' },
  { word: 'Concise', def: 'expressing much in few words' },
  { word: 'Concoct', def: 'make something by mixing' },
  { word: 'Concomitant', def: 'following or accompanying as a consequence' },
  { word: 'Condolence', def: 'an expression of sympathy with another\'s grief' },
  { word: 'Condone', def: 'excuse, overlook, or make allowances for' },
  { word: 'Conflagrate', def: 'start to burn or burst into flames' },
  { word: 'Confluence', def: 'a place where things merge or flow together' },
  { word: 'Confound', def: 'be confusing or perplexing to' },
  { word: 'Congeal', def: 'solidify, thicken, or come together' },
  { word: 'Congenial', def: 'suitable to your needs' },
  { word: 'Congruity', def: 'the quality of agreeing; being suitable and appropriate' },
  { word: 'Connive', def: 'form intrigues in an underhand manner' },
  { word: 'Consensus', def: 'agreement in the judgment reached by a group as a whole' },
  { word: 'Consummate', def: 'having or revealing supreme mastery or skill' },
  { word: 'Contemporaneous', def: 'occurring in the same period of time' },
  { word: 'Contentious', def: 'showing an inclination to disagree' },
  { word: 'Contravene', def: 'go against, as of rules and laws' },
  { word: 'Contrite', def: 'feeling or expressing pain or sorrow' },
  { word: 'Conundrum', def: 'a difficult problem' },
  { word: 'Convivial', def: 'occupied with or fond of the pleasures of good company' },
  { word: 'Convoluted', def: 'highly complex or intricate' },
  { word: 'Copious', def: 'large in number or quantity' },
  { word: 'Cordial', def: 'politely warm and friendly' },
  { word: 'Corroborate', def: 'give evidence for' },
  { word: 'Corrosive', def: 'capable of destroying or eating away by chemical action' },
  { word: 'Cosmopolitan', def: 'composed of people from many parts of the world' },
  { word: 'Counteract', def: 'act in opposition to' },
  { word: 'Covert', def: 'secret or hidden' },
  { word: 'Covet', def: 'wish, long, or crave for' },
  { word: 'Credulity', def: 'tendency to believe readily' },
  { word: 'Criterion', def: 'the ideal in terms of which something can be judged' },
  { word: 'Culmination', def: 'a concluding action' },
  { word: 'Culpable', def: 'deserving blame or censure as being wrong or injurious' },
  { word: 'Cumulative', def: 'increasing by successive addition' },
  { word: 'Cunning', def: 'showing inventiveness and skill' },
  { word: 'Cupidity', def: 'extreme greed for material wealth' },
  { word: 'Cursory', def: 'hasty and without attention to detail; not thorough' },
  { word: 'Curtail', def: 'terminate or abbreviate before its intended or proper end' },
  { word: 'Daunting', def: 'discouraging through fear' },
  { word: 'Dearth', def: 'an insufficient quantity or number' },
  { word: 'Debacle', def: 'a sudden and complete disaster' },
  { word: 'Debase', def: 'make impure by adding a foreign or inferior substance' },
  { word: 'Debunk', def: 'expose while ridiculing' },
  { word: 'Decorous', def: 'characterized by propriety and dignity and good taste' },
  { word: 'Decry', def: 'express strong disapproval of' },
  { word: 'Defamatory', def: 'harmful and often untrue; tending to discredit or malign' },
  { word: 'Defer', def: 'yield to another\'s wish or opinion' },
  { word: 'Deferential', def: 'showing courteous regard for people\'s feelings' },
  { word: 'Deft', def: 'skillful in physical movements; especially of the hands' },
  { word: 'Defunct', def: 'no longer in force or use; inactive' },
  { word: 'Deleterious', def: 'harmful to living things' },
  { word: 'Demagogue', def: 'a leader who seeks support by appealing to popular passions' },
  { word: 'Demarcation', def: 'the boundary of a specific area' },
  { word: 'Demean', def: 'reduce in worth or character, usually verbally' },
  { word: 'Demure', def: 'shy or modest, often in a playful or provocative way' },
  { word: 'Denigrate', def: 'attack the good name and reputation of someone' },
  { word: 'Denounce', def: 'speak out against' },
  { word: 'Deplore', def: 'express strong disapproval of' },
  { word: 'Depravity', def: 'moral perversion; impairment of virtue and moral principles' },
  { word: 'Deprecate', def: 'express strong disapproval of; deplore' },
  { word: 'Derelict', def: 'a person without a home, job, or property' },
  { word: 'Deride', def: 'treat or speak of with contempt' },
  { word: 'Desecrate', def: 'violate the sacred character of a place or language' },
  { word: 'Desiccated', def: 'thoroughly dried out' },
  { word: 'Desolate', def: 'providing no shelter or sustenance' },
  { word: 'Despondent', def: 'without or almost without hope' },
  { word: 'Despot', def: 'a cruel and oppressive dictator' },
  { word: 'Destitute', def: 'poor enough to need help from others' },
  { word: 'Deter', def: 'turn away from as by fear or persuasion' },
  { word: 'Devious', def: 'turning away from a straight course' },
  { word: 'Diaphanous', def: 'so thin as to transmit light' },
  { word: 'Didactic', def: 'instructive, especially excessively' },
  { word: 'Diffident', def: 'showing modest reserve' },
  { word: 'Diffuse', def: 'spread out; not concentrated in one place' },
  { word: 'Dilatory', def: 'wasting time' },
  { word: 'Diligent', def: 'quietly and steadily persevering in detail or exactness' },
  { word: 'Diminutive', def: 'very small' },
  { word: 'Disaffected', def: 'discontented as toward authority' },
  { word: 'Disavow', def: 'refuse to acknowledge' },
  { word: 'Discern', def: 'perceive, recognize, or detect' },
  { word: 'Disclose', def: 'expose to view as by removing a cover' },
  { word: 'Discomfit', def: 'cause to lose one\'s composure' },
  { word: 'Discordant', def: 'not in agreement or harmony' },
  { word: 'Discrepancy', def: 'a difference between conflicting facts or claims or opinions' },
  { word: 'Discursive', def: 'tending to cover a wide range of subjects' },
  { word: 'Disdain', def: 'lack of respect accompanied by a feeling of intense dislike' },
  { word: 'Disgruntled', def: 'in a state of sulky dissatisfaction' },
  { word: 'Disparage', def: 'express a negative opinion of' },
  { word: 'Disparate', def: 'fundamentally different or distinct in quality or kind' },
  { word: 'Dispel', def: 'cause to separate and go in different directions' },
  { word: 'Dissemble', def: 'behave unnaturally or affectedly' },
  { word: 'Disseminate', def: 'cause to become widely known' },
  { word: 'Dissent', def: 'a difference of opinion' },
  { word: 'Dissipate', def: 'cause to separate and go in different directions' },
  { word: 'Dissonance', def: 'disagreeable sounds' },
  { word: 'Dissuade', def: 'turn away from by persuasion' },
  { word: 'Divisive', def: 'causing or characterized by disagreement or disunity' },
  { word: 'Divulge', def: 'make known to the public information previously kept secret' },
  { word: 'Docile', def: 'easily handled or managed' },
  { word: 'Dogmatic', def: 'pertaining to a code of beliefs accepted as authoritative' },
  { word: 'Dormant', def: 'inactive but capable of becoming active' },
  { word: 'Dour', def: 'showing a brooding ill humor' },
  { word: 'Dubious', def: 'fraught with uncertainty or doubt' },
  { word: 'Duplicity', def: 'the act of deceiving or acting in bad faith' },
  { word: 'Duress', def: 'compulsory force or threat' },
  { word: 'Dynamic', def: 'characterized by action or forcefulness of personality' },
  { word: 'Eclectic', def: 'selecting what seems best of various styles or ideas' },
  { word: 'Ecstatic', def: 'feeling great rapture or delight' },
  { word: 'Edict', def: 'a formal or authoritative proclamation' },
  { word: 'Efface', def: 'remove by or as if by rubbing or erasing' },
  { word: 'Effervescent', def: 'giving off bubbles' },
  { word: 'Efficacious', def: 'giving the power to produce an intended result' },
  { word: 'Effrontery', def: 'audacious behavior that you have no right to' },
  { word: 'Egregious', def: 'conspicuously and outrageously bad or reprehensible' },
  { word: 'Elated', def: 'exultantly proud and joyful; in high spirits' },
  { word: 'Elegy', def: 'a mournful poem; a lament for the dead' },
  { word: 'Elicit', def: 'call forth, as an emotion, feeling, or response' },
  { word: 'Eloquent', def: 'expressing yourself readily, clearly, effectively' },
  { word: 'Elucidate', def: 'make clear and comprehensible' },
  { word: 'Elude', def: 'escape, either physically or mentally' },
  { word: 'Emaciated', def: 'very thin, especially from disease or hunger or cold' },
  { word: 'Embellish', def: 'make more attractive by adding ornament or color' },
  { word: 'Embezzle', def: 'appropriate fraudulently to one\'s own use' },
  { word: 'Eminent', def: 'standing above others in quality or position' },
  { word: 'Empathy', def: 'understanding and entering into another\'s feelings' },
  { word: 'Empirical', def: 'derived from experiment and observation rather than theory' },
  { word: 'Emulate', def: 'strive to equal or match, especially by imitating' },
  { word: 'Encumber', def: 'hold back, impede, or weigh down' },
  { word: 'Enervate', def: 'weaken physically, mentally, or morally' },
  { word: 'Engender', def: 'call forth' },
  { word: 'Enigmatic', def: 'not clear to the understanding' },
  { word: 'Enmity', def: 'a state of deep-seated ill-will' },
  { word: 'Ennui', def: 'the feeling of being bored by something tedious' },
  { word: 'Enthrall', def: 'hold spellbound' },
  { word: 'Ephemeral', def: 'anything short-lived, as an insect that lives only for a day' },
  { word: 'Epistolary', def: 'written in the form of letters or correspondence' },
  { word: 'Epitome', def: 'a standard or typical example' },
  { word: 'Equanimity', def: 'steadiness of mind under stress' },
  { word: 'Equivocal', def: 'open to two or more interpretations' },
  { word: 'Erudite', def: 'having or showing profound knowledge' },
  { word: 'Eschew', def: 'avoid and stay away from deliberately' },
  { word: 'Esoteric', def: 'understandable only by an enlightened inner circle' },
  { word: 'Espouse', def: 'choose and follow a theory, idea, policy, etc.' },
  { word: 'Ethereal', def: 'characterized by lightness and insubstantiality' },
  { word: 'Euphoric', def: 'characterized by a feeling of well-being or elation' },
  { word: 'Evanescent', def: 'short-lived; tending to vanish or disappear' },
  { word: 'Evince', def: 'give expression to' },
  { word: 'Exacerbate', def: 'make worse' },
  { word: 'Exalt', def: 'praise, glorify, or honor' },
  { word: 'Exasperate', def: 'make furious' },
  { word: 'Exculpate', def: 'pronounce not guilty of criminal charges' },
  { word: 'Execrable', def: 'unequivocally detestable' },
  { word: 'Exhort', def: 'spur on or encourage especially by cheers and shouts' },
  { word: 'Exigent', def: 'demanding immediate attention' },
  { word: 'Exonerate', def: 'pronounce not guilty of criminal charges' },
  { word: 'Exorbitant', def: 'greatly exceeding bounds of reason or moderation' },
  { word: 'Expedient', def: 'appropriate to a purpose' },
  { word: 'Expiate', def: 'make amends for' },
  { word: 'Expunge', def: 'remove by erasing or crossing out' },
  { word: 'Expurgate', def: 'edit by omitting or modifying parts considered indelicate' },
  { word: 'Extant', def: 'still in existence; not extinct or destroyed or lost' },
  { word: 'Extol', def: 'praise, glorify, or honor' },
  { word: 'Extraneous', def: 'not belonging to that in which it is contained' },
  { word: 'Extricate', def: 'release from entanglement or difficulty' },
  { word: 'Exult', def: 'feel extreme happiness or elation' },
  { word: 'Fabricate', def: 'put together out of artificial or natural components' },
  { word: 'Facade', def: 'the front of a building' },
  { word: 'Facile', def: 'arrived at without due care or effort; lacking depth' },
  { word: 'Fallacious', def: 'containing or based on incorrect reasoning' },
  { word: 'Fastidious', def: 'giving careful attention to detail' },
  { word: 'Fatuous', def: 'devoid of intelligence' },
  { word: 'Fecund', def: 'capable of producing offspring or vegetation' },
  { word: 'Felicitous', def: 'exhibiting an agreeably appropriate manner or style' },
  { word: 'Feral', def: 'wild and menacing' },
  { word: 'Fervent', def: 'characterized by intense emotion' },
  { word: 'Fetid', def: 'offensively malodorous' },
  { word: 'Fidelity', def: 'the quality of being faithful' },
  { word: 'Foil', def: 'hinder or prevent, as an effort, plan, or desire' },
  { word: 'Forage', def: 'collect or look around for, as food' },
  { word: 'Forbearance', def: 'a delay in enforcing rights or claims or privileges' },
  { word: 'Forestall', def: 'keep from happening or arising; make impossible' },
  { word: 'Forlorn', def: 'marked by or showing hopelessness' },
  { word: 'Forsake', def: 'leave someone who needs or counts on you' },
  { word: 'Fortitude', def: 'strength of mind that enables one to endure adversity' },
  { word: 'Fortuitous', def: 'lucky; occurring by happy chance' },
  { word: 'Foster', def: 'providing nurture though not related by blood or legal ties' },
  { word: 'Fractious', def: 'easily irritated or annoyed' },
  { word: 'Fraught', def: 'filled with or attended with' },
  { word: 'Frenetic', def: 'fast and energetic in an uncontrolled or wild way' },
  { word: 'Frivolous', def: 'not serious in content, attitude, or behavior' },
  { word: 'Frugal', def: 'avoiding waste' },
  { word: 'Furtive', def: 'secret and sly' },
  { word: 'Garish', def: 'tastelessly showy' },
  { word: 'Garrulous', def: 'full of trivial conversation' },
  { word: 'Genial', def: 'diffusing warmth and friendliness' },
  { word: 'Gluttony', def: 'habitual eating to excess' },
  { word: 'Goad', def: 'stab or urge on as if with a pointed stick' },
  { word: 'Grandiloquence', def: 'high-flown style; excessive use of verbal ornamentation' },
  { word: 'Grandiose', def: 'impressive because of unnecessary largeness or magnificence' },
  { word: 'Gratuitous', def: 'unnecessary and unwarranted' },
  { word: 'Gregarious', def: 'temperamentally seeking and enjoying the company of others' },
  { word: 'Grievous', def: 'causing or marked by grief or anguish' },
  { word: 'Guile', def: 'shrewdness as demonstrated by being skilled in deception' },
  { word: 'Hackneyed', def: 'repeated too often; overfamiliar through overuse' },
  { word: 'Hallowed', def: 'worthy of religious veneration' },
  { word: 'Hapless', def: 'unfortunate and deserving pity' },
  { word: 'Harangue', def: 'a loud bombastic declamation expressed with strong emotion' },
  { word: 'Hardy', def: 'having rugged physical strength' },
  { word: 'Harrowing', def: 'causing extreme distress' },
  { word: 'Haughty', def: 'having or showing arrogant superiority' },
  { word: 'Hegemony', def: 'the dominance or leadership of one social group over others' },
  { word: 'Heinous', def: 'extremely wicked or deeply criminal' },
  { word: 'Heterogeneous', def: 'consisting of elements not of the same kind or nature' },
  { word: 'Hiatus', def: 'an interruption in the intensity or amount of something' },
  { word: 'Hierarchy', def: 'a series of ordered groupings within a system' },
  { word: 'Hypocrisy', def: 'pretending to have qualities or beliefs that you do not have' },
  { word: 'Iconoclast', def: 'someone who attacks cherished ideas or institutions' },
  { word: 'Idiosyncratic', def: 'peculiar to the individual' },
  { word: 'Ignominious', def: 'deserving or bringing disgrace or shame' },
  { word: 'Illicit', def: 'contrary to accepted morality or convention' },
  { word: 'Immutable', def: 'not subject or susceptible to change or variation' },
  { word: 'Impassive', def: 'having or revealing little emotion or sensibility' },
  { word: 'Impeccable', def: 'without error or flaw' },
  { word: 'Impecunious', def: 'not having enough money to pay for necessities' },
  { word: 'Imperative', def: 'requiring attention or action' },
  { word: 'Imperious', def: 'having or showing arrogant superiority' },
  { word: 'Impertinent', def: 'improperly forward or bold' },
  { word: 'Impervious', def: 'not admitting of passage or capable of being affected' },
  { word: 'Impetuous', def: 'characterized by undue haste and lack of thought' },
  { word: 'Implacable', def: 'incapable of being appeased or pacified' },
  { word: 'Implicate', def: 'bring into intimate and incriminating connection' },
  { word: 'Implicit', def: 'suggested though not directly expressed' },
  { word: 'Impudent', def: 'improperly forward or bold' },
  { word: 'Impute', def: 'attribute or credit to' },
  { word: 'Inane', def: 'devoid of intelligence' },
  { word: 'Inarticulate', def: 'without or deprived of the use of speech or words' },
  { word: 'Incendiary', def: 'capable of causing fires or catching fire spontaneously' },
  { word: 'Incessant', def: 'uninterrupted in time and indefinitely long continuing' },
  { word: 'Inchoate', def: 'only partly in existence; imperfectly formed' },
  { word: 'Incisive', def: 'demonstrating ability to recognize or draw fine distinctions' },
  { word: 'Incontrovertible', def: 'impossible to deny or disprove' },
  { word: 'Incorrigible', def: 'impervious to correction by punishment' },
  { word: 'Incumbent', def: 'necessary as a duty or responsibility; morally binding' },
  { word: 'Indefatigable', def: 'showing sustained enthusiasm with unflagging vitality' },
  { word: 'Indigenous', def: 'originating where it is found' },
  { word: 'Indigent', def: 'poor enough to need help from others' },
  { word: 'Indignation', def: 'a feeling of righteous anger' },
  { word: 'Indolent', def: 'disinclined to work or exertion' },
  { word: 'Indomitable', def: 'impossible to subdue' },
  { word: 'Ineffable', def: 'defying expression or description' },
  { word: 'Inept', def: 'generally incompetent and ineffectual' },
  { word: 'Inexorable', def: 'impossible to prevent, resist, or stop' },
  { word: 'Inextricable', def: 'incapable of being disentangled or untied' },
  { word: 'Infamy', def: 'a state of extreme dishonor' },
  { word: 'Ingenious', def: 'showing inventiveness and skill' },
  { word: 'Ingenuous', def: 'lacking in sophistication or worldliness' },
  { word: 'Inhibit', def: 'limit the range or extent of' },
  { word: 'Inimical', def: 'tending to obstruct or cause harm' },
  { word: 'Iniquity', def: 'absence of moral or spiritual values' },
  { word: 'Innate', def: 'present at birth but not necessarily hereditary' },
  { word: 'Innocuous', def: 'not injurious to physical or mental health' },
  { word: 'Innuendo', def: 'an indirect and usually malicious implication' },
  { word: 'Insatiable', def: 'impossible to fulfill, appease, or gratify' },
  { word: 'Insidious', def: 'working or spreading in a hidden and usually injurious way' },
  { word: 'Insinuate', def: 'suggest in an indirect or covert way; give to understand' },
  { word: 'Insipid', def: 'lacking interest or significance or impact' },
  { word: 'Insolent', def: 'marked by casual disrespect' },
  { word: 'Instigate', def: 'provoke or stir up' },
  { word: 'Integral', def: 'existing as an essential constituent or characteristic' },
  { word: 'Interminable', def: 'tiresomely long; seemingly without end' },
  { word: 'Intimation', def: 'a slight suggestion or vague understanding' },
  { word: 'Intractable', def: 'difficult to manage or mold' },
  { word: 'Intransigent', def: 'impervious to pleas, persuasion, requests, or reason' },
  { word: 'Intrepid', def: 'invulnerable to fear or intimidation' },
  { word: 'Inundate', def: 'fill or cover completely, usually with water' },
  { word: 'Inure', def: 'cause to accept or become hardened to' },
  { word: 'Invective', def: 'abusive language used to express blame or censure' },
  { word: 'Inveterate', def: 'habitual' },
  { word: 'Inviolable', def: 'incapable of being transgressed or dishonored' },
  { word: 'Iridescent', def: 'varying in color when seen in different lights' },
  { word: 'Irrevocable', def: 'incapable of being retracted' },
  { word: 'Jubilant', def: 'full of high-spirited delight' },
  { word: 'Judicious', def: 'marked by the exercise of common sense in practical matters' },
  { word: 'Juxtaposition', def: 'the act of positioning close together' },
  { word: 'Laconic', def: 'brief and to the point' },
  { word: 'Languid', def: 'lacking spirit or liveliness' },
  { word: 'Largess', def: 'liberality in bestowing gifts' },
  { word: 'Latent', def: 'potentially existing but not presently evident or realized' },
  { word: 'Laudatory', def: 'full of or giving praise' },
  { word: 'Lavish', def: 'given or giving freely, generously, or without restriction' },
  { word: 'Lenient', def: 'inclined to be permissive or indulgent' },
  { word: 'Lethargic', def: 'deficient in alertness or activity' },
  { word: 'Lithe', def: 'moving and bending with ease' },
  { word: 'Lucid', def: 'transparently clear; easily understandable' },
  { word: 'Luminous', def: 'softly bright or radiant' },
  { word: 'Lurid', def: 'glaringly vivid and graphic; marked by sensationalism' },
  { word: 'Magnanimous', def: 'noble and generous in spirit' },
  { word: 'Malevolent', def: 'wishing or appearing to wish evil to others' },
  { word: 'Malleable', def: 'capable of being shaped or bent' },
  { word: 'Manifest', def: 'clearly revealed to the mind or the senses or judgment' },
  { word: 'Maudlin', def: 'very sentimental or emotional' },
  { word: 'Maverick', def: 'someone who exhibits independence in thought and action' },
  { word: 'Maxim', def: 'a saying that is widely accepted on its own merits' },
  { word: 'Meager', def: 'deficient in amount or quality or extent' },
  { word: 'Mendacious', def: 'given to lying' },
  { word: 'Mercurial', def: 'liable to sudden unpredictable change' },
  { word: 'Meritorious', def: 'deserving reward or praise' },
  { word: 'Metamorphosis', def: 'striking change in appearance or character or circumstances' },
  { word: 'Meticulous', def: 'marked by precise accordance with details' },
  { word: 'Mitigate', def: 'lessen or to try to lessen the seriousness or extent of' },
  { word: 'Modicum', def: 'a small or moderate or token amount' },
  { word: 'Morose', def: 'showing a brooding ill humor' },
  { word: 'Multifarious', def: 'having many aspects' },
  { word: 'Mundane', def: 'found in the ordinary course of events' },
  { word: 'Munificence', def: 'liberality in bestowing gifts' },
  { word: 'Mutable', def: 'capable of or tending to change in form or quality or nature' },
  { word: 'Myriad', def: 'a large indefinite number' },
  { word: 'Nadir', def: 'the lowest point of anything' },
  { word: 'Nascent', def: 'being born or beginning' },
  { word: 'Nebulous', def: 'lacking definite form or limits' },
  { word: 'Nefarious', def: 'extremely wicked' },
  { word: 'Negligent', def: 'characterized by undue lack of attention or concern' },
  { word: 'Neophyte', def: 'a participant with no experience with an activity' },
  { word: 'Nocturnal', def: 'belonging to or active during the night' },
  { word: 'Nonchalant', def: 'marked by casual unconcern or indifference' },
  { word: 'Notorious', def: 'known widely and usually unfavorably' },
  { word: 'Noxious', def: 'injurious to physical or mental health' },
  { word: 'Nuance', def: 'a subtle difference in meaning or opinion or attitude' },
  { word: 'Obdurate', def: 'stubbornly persistent in wrongdoing' },
  { word: 'Oblique', def: 'slanting or inclined in direction or course or position' },
  { word: 'Oblivious', def: 'lacking conscious awareness of' },
  { word: 'Obscure', def: 'not clearly understood or expressed' },
  { word: 'Obsequious', def: 'attempting to win favor from influential people by flattery' },
  { word: 'Obsolete', def: 'no longer in use' },
  { word: 'Obstinate', def: 'marked by tenacious unwillingness to yield' },
  { word: 'Obstreperous', def: 'noisily and stubbornly defiant' },
  { word: 'Odious', def: 'extremely repulsive or unpleasant' },
  { word: 'Officious', def: 'intrusive in a meddling or offensive manner' },
  { word: 'Ominous', def: 'threatening or foreshadowing evil or tragic developments' },
  { word: 'Onerous', def: 'burdensome or difficult to endure' },
  { word: 'Opulent', def: 'rich and superior in quality' },
  { word: 'Orthodox', def: 'adhering to what is commonly accepted' },
  { word: 'Ostensible', def: 'appearing as such but not necessarily so' },
  { word: 'Ostentatious', def: 'intended to attract notice and impress others' },
  { word: 'Ostracism', def: 'the act of excluding someone from society by general consent' },
  { word: 'Palliate', def: 'lessen or to try to lessen the seriousness or extent of' },
  { word: 'Pallid', def: 'pale, as of a person\'s complexion' },
  { word: 'Panacea', def: 'hypothetical remedy for all ills or diseases' },
  { word: 'Paradox', def: 'a statement that contradicts itself' },
  { word: 'Paragon', def: 'a perfect embodiment of a concept' },
  { word: 'Paramount', def: 'more important than anything else; supreme' },
  { word: 'Pariah', def: 'a person who is rejected from society or home' },
  { word: 'Parsimony', def: 'extreme stinginess' },
  { word: 'Partisan', def: 'a fervent and even militant proponent of something' },
  { word: 'Pathos', def: 'a quality that arouses emotions, especially pity or sorrow' },
  { word: 'Paucity', def: 'an insufficient quantity or number' },
  { word: 'Pejorative', def: 'expressing disapproval' },
  { word: 'Penchant', def: 'a strong liking or preference' },
  { word: 'Penitent', def: 'feeling or expressing remorse for misdeeds' },
  { word: 'Perfidious', def: 'tending to betray' },
  { word: 'Perfunctory', def: 'hasty and without attention to detail; not thorough' },
  { word: 'Permeate', def: 'spread or diffuse through' },
  { word: 'Pernicious', def: 'exceedingly harmful' },
  { word: 'Perspicacity', def: 'the ability to assess situations or circumstances shrewdly' },
  { word: 'Pertinacious', def: 'stubbornly unyielding' },
  { word: 'Pervasive', def: 'spreading or spread throughout' },
  { word: 'Petulance', def: 'an irritable feeling' },
  { word: 'Philanthropic', def: 'of or relating to charitable giving' },
  { word: 'Pithy', def: 'concise and full of meaning' },
  { word: 'Placate', def: 'cause to be more favorably inclined' },
  { word: 'Placid', def: 'calm and free from disturbance' },
  { word: 'Platitude', def: 'a trite or obvious remark' },
  { word: 'Plausible', def: 'apparently reasonable, valid, or truthful' },
  { word: 'Plethora', def: 'extreme excess' },
  { word: 'Poignant', def: 'keenly distressing to the mind or feelings' },
  { word: 'Polemic', def: 'a verbal or written attack, especially of a belief or dogma' },
  { word: 'Portent', def: 'a sign of something about to happen' },
  { word: 'Pragmatic', def: 'concerned with practical matters' },
  { word: 'Preclude', def: 'make impossible, especially beforehand' },
  { word: 'Precocious', def: 'characterized by exceptionally early development' },
  { word: 'Predilection', def: 'a predisposition in favor of something' },
  { word: 'Preponderance', def: 'exceeding in heaviness; having greater weight' },
  { word: 'Presage', def: 'a foreboding about what is about to happen' },
  { word: 'Prescient', def: 'perceiving the significance of events before they occur' },
  { word: 'Presumptuous', def: 'going beyond what is appropriate, permitted, or courteous' },
  { word: 'Pretense', def: 'the act of giving a false appearance' },
  { word: 'Primeval', def: 'having existed from the beginning' },
  { word: 'Privation', def: 'the act of stripping someone of food, money, or rights' },
  { word: 'Probity', def: 'complete and confirmed integrity' },
  { word: 'Proclivity', def: 'a natural inclination' },
  { word: 'Procure', def: 'get by special effort' },
  { word: 'Profane', def: 'grossly irreverent toward what is held to be sacred' },
  { word: 'Profligate', def: 'unrestrained by convention or morality' },
  { word: 'Profuse', def: 'produced or growing in extreme abundance' },
  { word: 'Promulgate', def: 'state or announce' },
  { word: 'Propagate', def: 'multiply through reproduction' },
  { word: 'Propensity', def: 'a natural inclination' },
  { word: 'Propitious', def: 'presenting favorable circumstances' },
  { word: 'Propriety', def: 'correct behavior' },
  { word: 'Prosaic', def: 'lacking wit or imagination' },
  { word: 'Proscribe', def: 'command against' },
  { word: 'Protean', def: 'taking on different forms' },
  { word: 'Prowess', def: 'a superior skill learned by study and practice' },
  { word: 'Prudence', def: 'discretion in practical affairs' },
  { word: 'Puerile', def: 'displaying or suggesting a lack of maturity' },
  { word: 'Pugnacious', def: 'ready and able to resort to force or violence' },
  { word: 'Punctilious', def: 'marked by precise accordance with details' },
  { word: 'Pungent', def: 'strong and sharp to the sense of taste or smell' },
  { word: 'Putrid', def: 'of or relating to the process of decay' },
  { word: 'Quandary', def: 'state of uncertainty in a choice between unfavorable options' },
  { word: 'Quell', def: 'suppress or crush completely' },
  { word: 'Querulous', def: 'habitually complaining' },
  { word: 'Quixotic', def: 'not sensible about practical matters' },
  { word: 'Rancor', def: 'a feeling of deep and bitter anger and ill-will' },
  { word: 'Rapport', def: 'a relationship of mutual understanding between people' },
  { word: 'Raucous', def: 'unpleasantly loud and harsh' },
  { word: 'Rebuke', def: 'an act or expression of criticism and censure' },
  { word: 'Recalcitrant', def: 'stubbornly resistant to authority or control' },
  { word: 'Rectitude', def: 'righteousness as a consequence of being honorable and honest' },
  { word: 'Redoubtable', def: 'inspiring fear' },
  { word: 'Refute', def: 'overthrow by argument, evidence, or proof' },
  { word: 'Relegate', def: 'assign to a lower position' },
  { word: 'Remedial', def: 'tending or intended to rectify or improve' },
  { word: 'Remiss', def: 'failing in what duty requires' },
  { word: 'Renown', def: 'the state or quality of being widely honored and acclaimed' },
  { word: 'Replete', def: 'filled to satisfaction with food or drink' },
  { word: 'Reprehensible', def: 'bringing or deserving severe rebuke or censure' },
  { word: 'Reprove', def: 'reprimand, scold, or express dissatisfaction with' },
  { word: 'Repudiate', def: 'refuse to acknowledge, ratify, or recognize as valid' },
  { word: 'Resilient', def: 'recovering readily from adversity, depression, or the like' },
  { word: 'Resolute', def: 'firm in purpose or belief' },
  { word: 'Respite', def: 'a pause from doing something' },
  { word: 'Resplendent', def: 'having great beauty' },
  { word: 'Restitution', def: 'the act of restoring something to its original state' },
  { word: 'Retract', def: 'formally reject or disavow' },
  { word: 'Ruminate', def: 'reflect deeply on a subject' },
  { word: 'Saccharine', def: 'overly sweet' },
  { word: 'Sacrosanct', def: 'treated as if holy and kept free from violation or criticism' },
  { word: 'Sagacity', def: 'the trait of having wisdom and good judgment' },
  { word: 'Salient', def: 'conspicuous, prominent, or important' },
  { word: 'Sanctimonious', def: 'excessively or hypocritically pious' },
  { word: 'Sanguine', def: 'confidently optimistic and cheerful' },
  { word: 'Satiate', def: 'fill to satisfaction' },
  { word: 'Scathing', def: 'marked by harshly abusive criticism' },
  { word: 'Scrupulous', def: 'characterized by extreme care and great effort' },
  { word: 'Scurrilous', def: 'expressing offensive, insulting, or scandalous criticism' },
  { word: 'Seminal', def: 'influential and providing a basis for later development' },
  { word: 'Serendipity', def: 'good luck in making unexpected and fortunate discoveries' },
  { word: 'Serene', def: 'not agitated' },
  { word: 'Servile', def: 'submissive or fawning in attitude or behavior' },
  { word: 'Sobriety', def: 'the state of being unaffected or not intoxicated by alcohol' },
  { word: 'Solicitous', def: 'full of anxiety and concern' },
  { word: 'Somnolent', def: 'inclined to or marked by drowsiness' },
  { word: 'Speculative', def: 'not based on fact or investigation' },
  { word: 'Spurious', def: 'plausible but false' },
  { word: 'Stagnate', def: 'stand still' },
  { word: 'Stoic', def: 'seeming unaffected by pleasure or pain; impassive' },
  { word: 'Stolid', def: 'having or revealing little emotion or sensibility' },
  { word: 'Strenuous', def: 'taxing to the utmost; testing powers of endurance' },
  { word: 'Strident', def: 'unpleasantly loud and harsh' },
  { word: 'Subjugate', def: 'make subservient; force to submit or subdue' },
  { word: 'Sublime', def: 'of high moral or intellectual value' },
  { word: 'Succinct', def: 'briefly giving the gist of something' },
  { word: 'Superfluous', def: 'more than is needed, desired, or required' },
  { word: 'Surmise', def: 'infer from incomplete evidence' },
  { word: 'Surreptitious', def: 'marked by quiet and caution and secrecy' },
  { word: 'Sycophant', def: 'a person who tries to please someone to gain an advantage' },
  { word: 'Tacit', def: 'implied by or inferred from actions or statements' },
  { word: 'Taciturn', def: 'habitually reserved and uncommunicative' },
  { word: 'Tangential', def: 'of superficial relevance if any' },
  { word: 'Tedious', def: 'so lacking in interest as to cause mental weariness' },
  { word: 'Temerity', def: 'fearless daring' },
  { word: 'Temperance', def: 'the trait of avoiding excesses' },
  { word: 'Tenable', def: 'based on sound reasoning or evidence' },
  { word: 'Tenuous', def: 'lacking substance or significance' },
  { word: 'Timorous', def: 'shy and fearful by nature' },
  { word: 'Tirade', def: 'a speech of violent denunciation' },
  { word: 'Tome', def: 'a large and scholarly book' },
  { word: 'Torpid', def: 'in a condition of biological rest or suspended animation' },
  { word: 'Tortuous', def: 'marked by repeated turns and bends' },
  { word: 'Tractable', def: 'easily managed' },
  { word: 'Tranquil', def: 'free from disturbance by heavy waves' },
  { word: 'Transgress', def: 'act in disregard of laws, rules, contracts, or promises' },
  { word: 'Transient', def: 'lasting a very short time' },
  { word: 'Transmute', def: 'change or alter in form, appearance, or nature' },
  { word: 'Tremulous', def: 'quivering as from weakness or fear' },
  { word: 'Trenchant', def: 'having keenness and forcefulness and penetration in thought' },
  { word: 'Trepidation', def: 'a feeling of alarm or dread' },
  { word: 'Truculent', def: 'defiantly aggressive' },
  { word: 'Truncate', def: 'make shorter as if by cutting off' },
  { word: 'Turgid', def: 'ostentatiously lofty in style' },
  { word: 'Ubiquitous', def: 'being present everywhere at once' },
  { word: 'Umbrage', def: 'a feeling of anger caused by being offended' },
  { word: 'Uncanny', def: 'surpassing the ordinary or normal' },
  { word: 'Unctuous', def: 'unpleasantly and excessively suave or ingratiating' },
  { word: 'Undulate', def: 'move in a wavy pattern or with a rising and falling motion' },
  { word: 'Upbraid', def: 'express criticism towards' },
  { word: 'Usurp', def: 'seize and take control without authority' },
  { word: 'Vacillate', def: 'be undecided about something' },
  { word: 'Vapid', def: 'lacking significance or liveliness or spirit or zest' },
  { word: 'Vehemently', def: 'in a forceful manner' },
  { word: 'Venerable', def: 'profoundly honored' },
  { word: 'Venerate', def: 'regard with feelings of respect and reverence' },
  { word: 'Veracity', def: 'unwillingness to tell lies' },
  { word: 'Verbose', def: 'using or containing too many words' },
  { word: 'Vestige', def: 'an indication that something has been present' },
  { word: 'Vex', def: 'disturb, especially by minor irritations' },
  { word: 'Vicarious', def: 'experienced at secondhand' },
  { word: 'Vigilant', def: 'carefully observant or attentive' },
  { word: 'Vilify', def: 'spread negative information about' },
  { word: 'Vindicate', def: 'show to be right by providing justification or proof' },
  { word: 'Vindictive', def: 'disposed to seek revenge or intended for revenge' },
  { word: 'Virtuoso', def: 'someone who is dazzlingly skilled in any field' },
  { word: 'Vitriolic', def: 'harsh, bitter, or malicious in tone' },
  { word: 'Vivacious', def: 'vigorous and animated' },
  { word: 'Vociferous', def: 'conspicuously and offensively loud' },
  { word: 'Wane', def: 'a gradual decline in size or strength or power or number' },
  { word: 'Whimsical', def: 'determined by chance or impulse rather than by necessity' },
  { word: 'Wily', def: 'marked by skill in deception' },
  { word: 'Winsome', def: 'charming in a childlike or naive way' },
  { word: 'Wistful', def: 'showing pensive sadness' },
  { word: 'Wrath', def: 'intense anger' },
  { word: 'Zealous', def: 'marked by active interest and enthusiasm' },
  { word: 'Zenith', def: 'the highest point of something' },
  { word: 'Zephyr', def: 'a slight wind' },
];

let satVocabIndex = 0;

function renderSatVocab() {
  const card = satVocabList[satVocabIndex];
  document.getElementById("sat-vocab-word").textContent = card.word;
  document.getElementById("sat-vocab-def").textContent  = card.def;
  document.getElementById("sat-vocab-pos").textContent  = (satVocabIndex + 1) + " / " + satVocabList.length;
  // reset flip state
  document.getElementById("sat-vocab-card").classList.remove("flipped");
}

document.getElementById("sat-vocab-card").addEventListener("click", () => {
  document.getElementById("sat-vocab-card").classList.toggle("flipped");
});

document.getElementById("sat-vocab-next").addEventListener("click", () => {
  satVocabIndex = (satVocabIndex + 1) % satVocabList.length;
  renderSatVocab();
});

document.getElementById("sat-vocab-prev").addEventListener("click", () => {
  satVocabIndex = (satVocabIndex - 1 + satVocabList.length) % satVocabList.length;
  renderSatVocab();
});

document.getElementById("sat-vocab-shuffle").addEventListener("click", () => {
  for (let i = satVocabList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [satVocabList[i], satVocabList[j]] = [satVocabList[j], satVocabList[i]];
  }
  satVocabIndex = 0;
  renderSatVocab();
});

renderSatVocab();


// SAT FORMULA SHEET
// every math formula that shows up on the sat

const satFormulas = [
  { category: "Algebra",      name: "Slope",                  formula: "m = (y₂ − y₁) / (x₂ − x₁)" },
  { category: "Algebra",      name: "Slope-intercept form",   formula: "y = mx + b" },
  { category: "Algebra",      name: "Point-slope form",       formula: "y − y₁ = m(x − x₁)" },
  { category: "Algebra",      name: "Quadratic formula",      formula: "x = (−b ± √(b²−4ac)) / 2a" },
  { category: "Algebra",      name: "Standard form (line)",   formula: "Ax + By = C" },
  { category: "Algebra",      name: "Distance formula",       formula: "d = √((x₂−x₁)² + (y₂−y₁)²)" },
  { category: "Algebra",      name: "Midpoint formula",       formula: "M = ((x₁+x₂)/2, (y₁+y₂)/2)" },
  { category: "Geometry",     name: "Area of a triangle",     formula: "A = ½ × base × height" },
  { category: "Geometry",     name: "Area of a circle",       formula: "A = πr²" },
  { category: "Geometry",     name: "Circumference",          formula: "C = 2πr" },
  { category: "Geometry",     name: "Area of rectangle",      formula: "A = length × width" },
  { category: "Geometry",     name: "Pythagorean theorem",    formula: "a² + b² = c²" },
  { category: "Geometry",     name: "Volume of a cylinder",   formula: "V = πr²h" },
  { category: "Geometry",     name: "Volume of a cone",       formula: "V = ⅓πr²h" },
  { category: "Geometry",     name: "Volume of a sphere",     formula: "V = (4/3)πr³" },
  { category: "Geometry",     name: "Volume of a pyramid",    formula: "V = ⅓ × base area × h" },
  { category: "Statistics",   name: "Mean",                   formula: "x̄ = Σx / n" },
  { category: "Statistics",   name: "Percent change",         formula: "% = (new − old) / old × 100" },
  { category: "Statistics",   name: "Probability",            formula: "P(A) = favorable / total outcomes" },
  { category: "Trigonometry", name: "sin θ",                  formula: "sin θ = opposite / hypotenuse" },
  { category: "Trigonometry", name: "cos θ",                  formula: "cos θ = adjacent / hypotenuse" },
  { category: "Trigonometry", name: "tan θ",                  formula: "tan θ = opposite / adjacent" },
  { category: "Trigonometry", name: "Pythagorean identity",   formula: "sin²θ + cos²θ = 1" },
];

function renderFormulas() {
  const grid = document.getElementById("formula-grid");
  if (!grid) return;

  // group by category
  const grouped = {};
  satFormulas.forEach(f => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  Object.entries(grouped).forEach(([cat, formulas]) => {
    const section = document.createElement("div");
    section.className = "formula-section";

    const heading = document.createElement("h3");
    heading.className   = "formula-category";
    heading.textContent = cat;
    section.appendChild(heading);

    formulas.forEach(f => {
      const card = document.createElement("div");
      card.className = "formula-card";
      card.innerHTML = `<div class="formula-name">${f.name}</div><div class="formula-expr">${f.formula}</div>`;
      section.appendChild(card);
    });

    grid.appendChild(section);
  });
}

renderFormulas();


// THEME SWITCHER
// 5 color options, saves your pick so it loads next time

const themes = {
  blue:    { accent: "#2563eb", hover: "#1d4ed8", tint: "rgba(37,99,235,.12)",  focus: "rgba(37,99,235,.12)"  },
  violet:  { accent: "#7c3aed", hover: "#6d28d9", tint: "rgba(124,58,237,.12)", focus: "rgba(124,58,237,.12)" },
  emerald: { accent: "#059669", hover: "#047857", tint: "rgba(5,150,105,.12)",  focus: "rgba(5,150,105,.12)"  },
  rose:    { accent: "#e11d48", hover: "#be123c", tint: "rgba(225,29,72,.12)",  focus: "rgba(225,29,72,.12)"  },
  slate:   { accent: "#475569", hover: "#334155", tint: "rgba(71,85,105,.12)",  focus: "rgba(71,85,105,.12)"  }
};

function applyTheme(name) {
  const t = themes[name];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty("--accent",   t.accent);
  root.style.setProperty("--accent-h", t.hover);
  root.style.setProperty("--accent-t", t.tint);

  // update active dot
  document.querySelectorAll(".theme-dot").forEach(d => {
    d.classList.toggle("active", d.dataset.theme === name);
  });

  saveToStorage("selectedTheme", name);
}

// wire up each dot
document.querySelectorAll(".theme-dot").forEach(dot => {
  dot.addEventListener("click", () => applyTheme(dot.dataset.theme));
});

// restore saved theme on load
applyTheme(loadFromStorage("selectedTheme", "blue"));
