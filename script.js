// ==== STORAGE HELPERS ====
const Storage = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error getting ${key} from localStorage`, e);
      return [];
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
    }
  }
};

// ==== APP STATE ====
let assignments = Storage.get("assignments");
let tasks = Storage.get("tasks");
let gpaCourses = Storage.get("gpaCourses");
let flashcards = Storage.get("flashcards");
let exams = Storage.get("exams");
let tasksCompleted = 0;
let studyMinutes = 0;
let fcIndex = 0;

// ==== NAVIGATION ====
document.querySelectorAll(".sidebar nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.getAttribute("data-section")).classList.add("active");
  });
});

// ==== DARK MODE ====
document.getElementById("darkModeSwitch").addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

// ==== ASSIGNMENTS ====
document.getElementById("assignmentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const textInput = document.getElementById("assignmentInput");
  const dateInput = document.getElementById("assignmentDate");
  const text = textInput.value.trim();
  const date = dateInput.value;
  if (!text) return;
  assignments.push({ text, date });
  Storage.set("assignments", assignments);
  renderAssignments();
  textInput.value = "";
  dateInput.value = "";
});

function renderAssignments() {
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";
  assignments.forEach((a, i) => {
    const li = document.createElement("li");
    li.textContent = `${a.text} (Due: ${a.date || "No date"}) `;
    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.addEventListener("click", () => {
      assignments.splice(i, 1);
      Storage.set("assignments", assignments);
      tasksCompleted++;
      document.getElementById("tasksCompleted").textContent = tasksCompleted;
      renderAssignments();
    });
    li.appendChild(doneBtn);
    list.appendChild(li);
  });
  document.getElementById("assignmentsRemaining").textContent = assignments.length;
}

// ==== PLANNER ====
document.getElementById("plannerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const taskInput = document.getElementById("plannerTask");
  const timeInput = document.getElementById("plannerTime");
  const text = taskInput.value.trim();
  const time = timeInput.value;
  if (!text) return;
  tasks.push({ text, time, completed: false });
  Storage.set("tasks", tasks);
  renderTasks();
  taskInput.value = "";
  timeInput.value = "";
});

function renderTasks() {
  const list = document.getElementById("plannerList");
  list.innerHTML = "";
  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${t.text}${t.time ? " at " + t.time : ""} `;
    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.addEventListener("click", () => {
      tasks.splice(i, 1);
      Storage.set("tasks", tasks);
      tasksCompleted++;
      document.getElementById("tasksCompleted").textContent = tasksCompleted;
      renderTasks();
    });
    li.appendChild(doneBtn);
    list.appendChild(li);
  });
}

// ==== GRADE CALCULATOR ====
document.getElementById("gradeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = document.querySelectorAll(".gradeInput");
  const values = [];
  inputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) values.push(val);
  });
  if (values.length === 0) return;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  document.getElementById("averageGrade").textContent = avg.toFixed(2);
});

// ==== GPA CALCULATOR ====
document.getElementById("gpaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const course = document.getElementById("gpaCourse").value.trim();
  const grade = parseFloat(document.getElementById("gpaGrade").value);
  const credits = parseFloat(document.getElementById("gpaCredits").value);
  if (!course || isNaN(grade) || isNaN(credits)) return;
  gpaCourses.push({ course, grade, credits });
  Storage.set("gpaCourses", gpaCourses);
  renderGPA();
  document.getElementById("gpaCourse").value = "";
  document.getElementById("gpaGrade").value = "";
  document.getElementById("gpaCredits").value = "";
});

function renderGPA() {
  const list = document.getElementById("gpaCourseList");
  list.innerHTML = "";
  let totalPoints = 0;
  let totalCredits = 0;

  gpaCourses.forEach((c, i) => {
    totalPoints += c.grade * c.credits;
    totalCredits += c.credits;
    const li = document.createElement("li");
    li.textContent = `${c.course} — ${gradeLabel(c.grade)} (${c.credits} cr) `;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      gpaCourses.splice(i, 1);
      Storage.set("gpaCourses", gpaCourses);
      renderGPA();
    });
    li.appendChild(removeBtn);
    list.appendChild(li);
  });

  document.getElementById("gpaResult").textContent =
    totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "—";
}

function gradeLabel(val) {
  const map = { 4.0: "A", 3.7: "A-", 3.3: "B+", 3.0: "B", 2.7: "B-", 2.3: "C+", 2.0: "C", 1.7: "C-", 1.0: "D", 0.0: "F" };
  return map[val] || val;
}

// ==== FLASHCARDS ====
document.getElementById("flashcardForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const front = document.getElementById("flashcardFront").value.trim();
  const back = document.getElementById("flashcardBack").value.trim();
  if (!front || !back) return;
  flashcards.push({ front, back });
  Storage.set("flashcards", flashcards);
  document.getElementById("flashcardFront").value = "";
  document.getElementById("flashcardBack").value = "";
  fcIndex = flashcards.length - 1;
  renderFlashcard();
});

document.getElementById("flashcard").addEventListener("click", () => {
  document.getElementById("flashcard").classList.toggle("flipped");
});

document.getElementById("fcNext").addEventListener("click", () => {
  if (flashcards.length === 0) return;
  fcIndex = (fcIndex + 1) % flashcards.length;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

document.getElementById("fcPrev").addEventListener("click", () => {
  if (flashcards.length === 0) return;
  fcIndex = (fcIndex - 1 + flashcards.length) % flashcards.length;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

document.getElementById("fcShuffle").addEventListener("click", () => {
  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }
  Storage.set("flashcards", flashcards);
  fcIndex = 0;
  document.getElementById("flashcard").classList.remove("flipped");
  renderFlashcard();
});

function renderFlashcard() {
  const studyDiv = document.getElementById("flashcardStudy");
  const emptyNote = document.getElementById("fcEmpty");
  if (flashcards.length === 0) {
    studyDiv.classList.add("hidden");
    emptyNote.style.display = "block";
    return;
  }
  studyDiv.classList.remove("hidden");
  emptyNote.style.display = "none";
  document.getElementById("fcFront").textContent = flashcards[fcIndex].front;
  document.getElementById("fcBack").textContent = flashcards[fcIndex].back;
  document.getElementById("fcCounter").textContent = `${fcIndex + 1} / ${flashcards.length}`;
}

// ==== EXAM COUNTDOWN ====
document.getElementById("examForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("examName").value.trim();
  const date = document.getElementById("examDate").value;
  if (!name || !date) return;
  exams.push({ name, date });
  Storage.set("exams", exams);
  renderExams();
  document.getElementById("examName").value = "";
  document.getElementById("examDate").value = "";
});

function renderExams() {
  const grid = document.getElementById("examList");
  grid.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((exam, i) => {
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    const daysLabel = diff < 0 ? "Passed" : diff === 0 ? "Today!" : `${diff} day${diff !== 1 ? "s" : ""}`;

    const card = document.createElement("div");
    card.className = "exam-card";
    if (diff >= 0 && diff <= 3) card.classList.add("urgent");
    else if (diff > 3 && diff <= 7) card.classList.add("soon");

    card.innerHTML = `
      <div class="exam-days">${daysLabel}</div>
      <div class="exam-name">${exam.name}</div>
      <div class="exam-date">${examDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
      <button class="exam-remove" data-index="${i}">Remove</button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".exam-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const orig = exams.findIndex(e =>
        e.name === sorted[btn.dataset.index].name &&
        e.date === sorted[btn.dataset.index].date
      );
      exams.splice(orig, 1);
      Storage.set("exams", exams);
      renderExams();
    });
  });

  updateDashboardExam();
}

function updateDashboardExam() {
  const dashEl = document.getElementById("nextExamDash");
  if (!dashEl) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = exams
    .map(e => ({ ...e, diff: Math.ceil((new Date(e.date) - today) / (1000 * 60 * 60 * 24)) }))
    .filter(e => e.diff >= 0)
    .sort((a, b) => a.diff - b.diff);
  dashEl.textContent = upcoming.length > 0 ? `${upcoming[0].diff}d` : "—";
}

// ==== POMODORO TIMER ====
let timeLeft = 1500;
let timerInterval = null;
let isOnBreak = false;

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById("minutes").textContent = String(mins).padStart(2, "0");
  document.getElementById("seconds").textContent = String(secs).padStart(2, "0");
  const focusTimerEl = document.getElementById("focusTimer");
  if (focusTimerEl) focusTimerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

document.getElementById("startTimer").addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (!isOnBreak) {
        studyMinutes += 25;
        document.getElementById("studyTime").textContent = studyMinutes + " min";
        alert("Great work! Time for a 5-minute break.");
        timeLeft = 300;
        isOnBreak = true;
      } else {
        alert("Break over! Back to work.");
        timeLeft = 1500;
        isOnBreak = false;
      }
      updateTimerDisplay();
    }
  }, 1000);
});

document.getElementById("pauseTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

document.getElementById("resetTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 1500;
  isOnBreak = false;
  updateTimerDisplay();
});

// ==== INITIAL RENDER ====
renderAssignments();
renderTasks();
renderGPA();
renderFlashcard();
renderExams();
updateTimerDisplay();
