// ==== STORAGE HELPERS ====
const Storage = {
  async get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error getting ${key} from localStorage`, e);
      return [];
    }
  },

  async set(key, value) {
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
async function addAssignment() {
  const text = document.getElementById("assignmentInput").value;
  const date = document.getElementById("dueDate").value;
  if (!text) return;

  const assignment = new Assignment(text, date);
  assignments.push(assignment);
  await Storage.set("assignments", assignments);
  renderAssignments();
}

async function renderAssignments() {
  assignments = await Storage.get("assignments");
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";

  assignments.forEach((a, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${a.text} (Due: ${a.date}) <button onclick="completeAssignment(${i})">Done</button>`;
    list.appendChild(li);
  });

  document.getElementById("assignmentsRemaining").innerText = assignments.length;
}

async function completeAssignment(index) {
  assignments.splice(index, 1);
  await Storage.set("assignments", assignments);
  tasksCompleted++;
  document.getElementById("tasksCompleted").innerText = tasksCompleted;
  renderAssignments();
}

// ==== TASKS ====
async function addTask() {
  const text = document.getElementById("taskInput").value;
  if (!text) return;

  const task = new Task(text);
  tasks.push(task);
  await Storage.set("tasks", tasks);
  renderTasks();
}

async function renderTasks() {
  tasks = await Storage.get("tasks");
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${t.text} <button onclick="completeTask(${i})">Done</button>`;
    list.appendChild(li);
  });
}

async function completeTask(index) {
  tasks.splice(index, 1);
  await Storage.set("tasks", tasks);
  tasksCompleted++;
  document.getElementById("tasksCompleted").innerText = tasksCompleted;
  renderTasks();
}

// ==== GRADES ====
async function addGrade() {
  const g = parseFloat(document.getElementById("gradeInput").value);
  if (isNaN(g)) return;

  const grade = new Grade(g);
  grades.push(grade);
  await Storage.set("grades", grades);

  const avg = grades.reduce((sum, g) => sum + g.value, 0) / grades.length;
  document.getElementById("averageGrade").innerText = avg.toFixed(2);
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
    document.getElementById("timer").innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (time <= 0) {
      clearInterval(timerInterval);
      studyMinutes += 25;
      document.getElementById("studyTime").innerText = studyMinutes;
      alert("Break Time!");
      time = 300; // 5 minutes break
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  time = 1500;
  document.getElementById("timer").innerText = "25:00";
}

// ==== FOCUS MODE ====
function focusMode() {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:40px">
      <div id="timer">25:00</div>
      <p>"Success is built in hours of focus."</p>
      <button onclick="location.reload()">Exit</button>
    </div>
  `;
}

// ==== DARK MODE ====
document.getElementById("darkModeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

// ==== INITIAL RENDER ====
(async function init() {
  assignments = await Storage.get("assignments");
  tasks = await Storage.get("tasks");
  grades = await Storage.get("grades");
  renderAssignments();
  renderTasks();
})();
