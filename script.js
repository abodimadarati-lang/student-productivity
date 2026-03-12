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

      renderTaskList();
      refreshDashboard();
    };

    li.appendChild(text);
    li.appendChild(doneBtn);
    list.appendChild(li);
  });
}


// GRADE CALCULATOR
// ignores empty inputs, only averages the ones you filled in

document.getElementById("grades-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const filled = [...document.querySelectorAll(".grade-entry")]
    .map(input => parseFloat(input.value))
    .filter(val => !isNaN(val));

  if (!filled.length) return;

  const avg = filled.reduce((sum, v) => sum + v, 0) / filled.length;
  document.getElementById("calculated-avg").textContent = avg.toFixed(2);
});


// GPA CALCULATOR
// formula is (grade points * credits) added up, divided by total credits

document.getElementById("gpa-entry-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const courseName  = document.getElementById("course-name").value.trim();
  const gradePoints = parseFloat(document.getElementById("course-letter-grade").value);
  const creditHours = parseFloat(document.getElementById("course-credits").value);

  if (!courseName || isNaN(gradePoints) || isNaN(creditHours)) return;

  gpaCourseList.push({ course: courseName, grade: gradePoints, credits: creditHours });
  saveToStorage("gpaCourses", gpaCourseList);

  // clear the form
  document.getElementById("course-name").value         = "";
  document.getElementById("course-letter-grade").value = "";
  document.getElementById("course-credits").value      = "";

  renderGPACourses();
});

function renderGPACourses() {
  const list = document.getElementById("course-list");
  list.innerHTML = "";

  let totalPoints  = 0;
  let totalCredits = 0;

  gpaCourseList.forEach((entry, idx) => {
    totalPoints  += entry.grade * entry.credits;
    totalCredits += entry.credits;

    const li   = document.createElement("li");
    const text = document.createElement("span");

    text.innerHTML = entry.course + ' — <strong>' + gradePointsToLetter(entry.grade) + '</strong> (' + entry.credits + ' cr)';

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

  // update the GPA result
  document.getElementById("gpa-output").textContent =
    totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "—";
}

// converts a grade point value back to its letter grade
function gradePointsToLetter(val) {
  const map = {
    4.0: "A", 3.7: "A-", 3.3: "B+", 3.0: "B",
    2.7: "B-", 2.3: "C+", 2.0: "C", 1.7: "C-",
    1.0: "D", 0.0: "F"
  };
  return map[val] ?? val;
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
