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
let tasksCompleted = 0;
let studyMinutes = 0;

// ==== NAVIGATION ====
// Handles sidebar buttons switching between sections
document.querySelectorAll(".sidebar nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active from all buttons and sections
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

    // Activate clicked button and matching section
    btn.classList.add("active");
    const sectionId = btn.getAttribute("data-section");
    document.getElementById(sectionId).classList.add("active");
  });
});

// ==== DARK MODE ====
// HTML uses a checkbox with id="darkModeSwitch"
document.getElementById("darkModeSwitch").addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

// ==== ASSIGNMENTS ====
document.getElementById("assignmentForm").addEventListener("submit", (e) => {
  e.preventDefault(); // Stops page from reloading on form submit
  addAssignment();
});

function addAssignment() {
  const textInput = document.getElementById("assignmentInput");
  const dateInput = document.getElementById("assignmentDate"); // Fixed: was "dueDate"
  const text = textInput.value.trim();
  const date = dateInput.value;

  if (!text) return;

  assignments.push({ text, date });
  Storage.set("assignments", assignments);

  renderAssignments();
  textInput.value = "";
  dateInput.value = "";
}

function renderAssignments() {
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";

  assignments.forEach((a, i) => {
    const li = document.createElement("li");
    li.textContent = `${a.text} (Due: ${a.date || "No date"}) `;

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.addEventListener("click", () => completeAssignment(i));

    li.appendChild(doneBtn);
    list.appendChild(li);
  });

  document.getElementById("assignmentsRemaining").textContent = assignments.length;
}

function completeAssignment(index) {
  assignments.splice(index, 1);
  Storage.set("assignments", assignments);
  tasksCompleted++;
  document.getElementById("tasksCompleted").textContent = tasksCompleted;
  renderAssignments();
}

// ==== PLANNER (was called "Tasks" in JS but "Planner" in HTML) ====
document.getElementById("plannerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  addTask();
});

function addTask() {
  const taskInput = document.getElementById("plannerTask"); // Fixed: was "taskInput"
  const timeInput = document.getElementById("plannerTime");
  const text = taskInput.value.trim();
  const time = timeInput.value;

  if (!text) return;

  tasks.push({ text, time, completed: false });
  Storage.set("tasks", tasks);

  renderTasks();
  taskInput.value = "";
  timeInput.value = "";
}

function renderTasks() {
  const list = document.getElementById("plannerList"); // Fixed: was "taskList"
  list.innerHTML = "";

  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${t.text}${t.time ? " at " + t.time : ""} `;

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done";
    doneBtn.addEventListener("click", () => completeTask(i));

    li.appendChild(doneBtn);
    list.appendChild(li);
  });
}

function completeTask(index) {
  tasks.splice(index, 1);
  Storage.set("tasks", tasks);
  tasksCompleted++;
  document.getElementById("tasksCompleted").textContent = tasksCompleted;
  renderTasks();
}

// ==== GRADE CALCULATOR ====
document.getElementById("gradeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  calculateGrades();
});

function calculateGrades() {
  // HTML uses multiple inputs with class "gradeInput" (not a single id)
  const inputs = document.querySelectorAll(".gradeInput");
  const values = [];

  inputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) values.push(val);
  });

  if (values.length === 0) return;

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  document.getElementById("averageGrade").textContent = avg.toFixed(2);
}

// ==== POMODORO TIMER ====
// HTML has separate <span id="minutes"> and <span id="seconds">, not a single #timer
let timeLeft = 1500; // 25 minutes in seconds
let timerInterval = null;
let isOnBreak = false;

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById("minutes").textContent = String(mins).padStart(2, "0");
  document.getElementById("seconds").textContent = String(secs).padStart(2, "0");

  // Also update Focus Mode display if it's visible
  const focusTimerEl = document.getElementById("focusTimer");
  if (focusTimerEl) {
    focusTimerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

document.getElementById("startTimer").addEventListener("click", () => {
  if (timerInterval) return; // Already running
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
        timeLeft = 300; // 5 min break
        isOnBreak = true;
      } else {
        alert("Break over! Back to work.");
        timeLeft = 1500; // 25 min work
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
updateTimerDisplay();
