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

// ==== CLASSES ====
class Assignment {
  constructor(text, date) {
    this.text = text;
    this.date = date;
  }
}

class Task {
  constructor(text) {
    this.text = text;
    this.completed = false;
  }
}

class Grade {
  constructor(value) {
    this.value = value;
  }
}

// ==== APP STATE ====
let assignments = [];
let tasks = [];
let grades = [];
let tasksCompleted = 0;
let studyMinutes = 0;

// ==== ASSIGNMENTS ====
function addAssignment() {
  const textInput = document.getElementById("assignmentInput");
  const dateInput = document.getElementById("dueDate");
  const text = textInput.value.trim();
  const date = dateInput.value;

  if (!text) return;

  const assignment = new Assignment(text, date);
  assignments.push(assignment);
  Storage.set("assignments", assignments);

  renderAssignments();
  textInput.value = "";
  dateInput.value = "";
}

function renderAssignments() {
  assignments = Storage.get("assignments");
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";

  assignments.forEach((a, i) => {
    const li = document.createElement("li");
    li.textContent = `${a.text} (Due: ${a.date}) `;

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

// ==== TASKS ====
function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (!text) return;

  const task = new Task(text);
  tasks.push(task);
  Storage.set("tasks", tasks);

  renderTasks();
  input.value = "";
}

function renderTasks() {
  tasks = Storage.get("tasks");
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t.text + " ";

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

// ==== GRADES ====
function addGrade() {
  const input = document.getElementById("gradeInput");
  const value = parseFloat(input.value);
  if (isNaN(value)) return;

  const grade = new Grade(value);
  grades.push(grade);
  Storage.set("grades", grades);

  if (grades.length > 0) {
    const avg = grades.reduce((sum, g) => sum + g.value, 0) / grades.length;
    document.getElementById("averageGrade").textContent = avg.toFixed(2);
  }

  input.value = "";
}

// ==== TIMER ====
let time = 1500; // 25 minutes
let timerInterval;

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time--;
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (time <= 0) {
      clearInterval(timerInterval);
      studyMinutes += 25;
      document.getElementById("studyTime").textContent = studyMinutes;
      alert("Break Time!");
      time = 300; // 5 minutes break
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  time = 1500;
  document.getElementById("timer").textContent = "25:00";
}

// ==== FOCUS MODE ====
function focusMode() {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  container.style = "display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:40px";

  const timerEl = document.createElement("div");
  timerEl.id = "timer";
  timerEl.textContent = "25:00";

  const message = document.createElement("p");
  message.textContent = "Success is built in hours of focus.";

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit";
  exitBtn.addEventListener("click", () => location.reload());

  container.appendChild(timerEl);
  container.appendChild(message);
  container.appendChild(exitBtn);
  document.body.appendChild(container);
}

// ==== DARK MODE ====
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// ==== INITIAL RENDER ====
assignments = Storage.get("assignments");
tasks = Storage.get("tasks");
grades = Storage.get("grades");
renderAssignments();
renderTasks();
