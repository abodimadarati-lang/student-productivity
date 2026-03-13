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
// simple average of all course grades out of 100

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
// clicking the logo or hamburger toggles the sidebar

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
// increments if you open the app on a new day, resets if you miss a day

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
// shows on first ever visit, asks for name, saves it, never shows again

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
// fires when you mark an assignment or task as done

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


// ─────────────────────────────────────────
// SAT SCORE TRACKER
// ─────────────────────────────────────────

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


// ─────────────────────────────────────────
// SAT WRONG ANSWER LOGGER
// ─────────────────────────────────────────

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


// ─────────────────────────────────────────
// SAT VOCAB FLASHCARDS
// 50 high-frequency SAT words built in
// ─────────────────────────────────────────

let satVocabList = [
  { word: "Aberrant",     def: "Departing from an accepted standard; abnormal." },
  { word: "Acrimony",     def: "Bitterness or ill feeling in speech or manner." },
  { word: "Adulterate",   def: "To make impure by adding inferior or tainted substances." },
  { word: "Aesthetic",    def: "Concerned with beauty or the appreciation of beauty." },
  { word: "Alleviate",    def: "To make suffering or a problem less severe." },
  { word: "Ambiguous",    def: "Open to more than one interpretation; unclear." },
  { word: "Anachronism",  def: "Something out of its proper historical time." },
  { word: "Antipathy",    def: "A deep-seated feeling of dislike or aversion." },
  { word: "Apathy",       def: "Lack of interest or concern; indifference." },
  { word: "Arbitrary",    def: "Based on random choice rather than reason or system." },
  { word: "Arcane",       def: "Known or understood by very few; mysterious." },
  { word: "Arduous",      def: "Requiring a lot of effort and endurance; difficult." },
  { word: "Austere",      def: "Severe or strict in manner; without luxury." },
  { word: "Banal",        def: "Lacking originality; predictably boring." },
  { word: "Benevolent",   def: "Well-meaning and kindly toward others." },
  { word: "Cacophony",    def: "A harsh mixture of loud and discordant sounds." },
  { word: "Candid",       def: "Truthful and straightforward; frank." },
  { word: "Capricious",   def: "Given to sudden and unaccountable mood changes." },
  { word: "Circumspect",  def: "Wary and unwilling to take risks; cautious." },
  { word: "Coalesce",     def: "Come together to form one mass or whole." },
  { word: "Cogent",       def: "Clear, logical, and convincing in argument." },
  { word: "Complacent",   def: "Showing uncritical satisfaction with oneself or one's achievements." },
  { word: "Conciliatory", def: "Intended to make someone less angry or hostile." },
  { word: "Condone",      def: "To accept or overlook behavior considered wrong." },
  { word: "Contentious",  def: "Causing or likely to cause disagreement or argument." },
  { word: "Convoluted",   def: "Extremely complex and difficult to follow." },
  { word: "Corroborate",  def: "To confirm or support with evidence." },
  { word: "Cynical",      def: "Believing that people are motivated only by self-interest." },
  { word: "Deference",    def: "Humble submission and respect toward another." },
  { word: "Derivative",   def: "Imitative of the work of another; not original." },
  { word: "Diatribe",     def: "A forceful and bitter verbal attack against someone." },
  { word: "Didactic",     def: "Intended to teach, often in a preachy way." },
  { word: "Diffident",    def: "Modest or shy due to a lack of self-confidence." },
  { word: "Dilettante",   def: "A person who dabbles in a subject without deep knowledge." },
  { word: "Discordant",   def: "Disagreeing or incongruous; not in harmony." },
  { word: "Disparate",    def: "Essentially different in kind; not comparable." },
  { word: "Ebullient",    def: "Cheerful and full of energy; exuberant." },
  { word: "Enigmatic",    def: "Difficult to interpret or understand; mysterious." },
  { word: "Ephemeral",    def: "Lasting for a very short time; transitory." },
  { word: "Equivocal",    def: "Open to more than one interpretation; ambiguous." },
  { word: "Erudite",      def: "Having or showing great knowledge or learning." },
  { word: "Esoteric",     def: "Intended for or understood by only a small group." },
  { word: "Eulogy",       def: "A speech that praises someone, typically after death." },
  { word: "Exacerbate",   def: "To make a problem or bad situation worse." },
  { word: "Facetious",    def: "Treating serious issues with inappropriate humor." },
  { word: "Florid",       def: "Elaborately ornate; having too much decoration." },
  { word: "Garrulous",    def: "Excessively talkative, especially on trivial matters." },
  { word: "Gratuitous",   def: "Uncalled for; lacking good reason; unwarranted." },
  { word: "Hackneyed",    def: "Lacking originality due to overuse; trite." },
  { word: "Iconoclast",   def: "A person who attacks cherished beliefs or institutions." }
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


// ─────────────────────────────────────────
// SAT FORMULA SHEET
// every formula tested on the SAT
// ─────────────────────────────────────────

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
// 5 preset accent colors, saves to localStorage

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
