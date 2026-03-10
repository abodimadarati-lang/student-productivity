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

// ==== MAIN APP STATE ====
const App = {
    assignments: [],
    tasks: [],
    grades: [],
    tasksCompleted: 0,
    studyMinutes: 0,
    timer: { total: 25 * 60, interval: null }
};

// ==== RENDER HELPERS ====
function renderAssignments() {
    const list = document.getElementById("assignmentList");
    list.innerHTML = "";
    App.assignments.forEach((a, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${a.text} (Due: ${a.date})
            <button data-index="${i}" class="complete-assignment">Done</button>`;
        list.appendChild(li);
    });
    document.getElementById("assignmentsRemaining").innerText = App.assignments.length;
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    App.tasks.forEach((t, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${t.text}
            <button data-index="${i}" class="complete-task">Done</button>`;
        list.appendChild(li);
    });
}

function renderGrades() {
    if (App.grades.length === 0) {
        document.getElementById("averageGrade").innerText = "N/A";
        return;
    }
    const avg = App.grades.reduce((sum, g) => sum + g.value, 0) / App.grades.length;
    document.getElementById("averageGrade").innerText = avg.toFixed(2);
}

function updateStats() {
    document.getElementById("tasksCompleted").innerText = App.tasksCompleted;
    document.getElementById("studyTime").innerText = App.studyMinutes;
}

// ==== ASSIGNMENT / TASK / GRADE FUNCTIONS ====
async function addAssignment() {
    const text = document.getElementById("assignmentInput").value;
    const date = document.getElementById("dueDate").value;
    if (!text) return;

    App.assignments.push(new Assignment(text, date));
    await Storage.set("assignments", App.assignments);
    renderAssignments();
}

async function completeAssignment(index) {
    App.assignments.splice(index, 1);
    App.tasksCompleted++;
    await Storage.set("assignments", App.assignments);
    updateStats();
    renderAssignments();
}

async function addTask() {
    const text = document.getElementById("taskInput").value;
    if (!text) return;

    App.tasks.push(new Task(text));
    await Storage.set("tasks", App.tasks);
    renderTasks();
}

async function completeTask(index) {
    App.tasks.splice(index, 1);
    App.tasksCompleted++;
    updateStats();
    await Storage.set("tasks", App.tasks);
    renderTasks();
}

async function addGrade() {
    const value = parseFloat(document.getElementById("gradeInput").value);
    if (isNaN(value)) return;

    App.grades.push(new Grade(value));
    await Storage.set("grades", App.grades);
    renderGrades();
}

// ==== TIMER FUNCTIONS ====
function startTimer() {
    clearInterval(App.timer.interval);
    App.timer.interval = setInterval(() => {
        App.timer.total--;
        const minutes = Math.floor(App.timer.total / 60);
        const seconds = App.timer.total % 60;
        document.getElementById("timer").innerText = `${minutes}:${seconds.toString().padStart(2,"0")}`;

        if (App.timer.total <= 0) {
            clearInterval(App.timer.interval);
            App.studyMinutes += 25;
            updateStats();
            alert("Break Time!");
            App.timer.total = 5 * 60; // 5 min break
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(App.timer.interval);
    App.timer.total = 25 * 60;
    document.getElementById("timer").innerText = "25:00";
}

// ==== FOCUS MODE ====
function focusMode() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:40px">
            <div id="timer">25:00</div>
            <p>"Success is built in hours of focus."</p>
            <button onclick="location.reload()">Exit</button>
        </div>`;
    startTimer();
}

// ==== DARK MODE ====
document.getElementById("darkModeToggle").onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};

// ==== EVENT DELEGATION FOR DYNAMIC BUTTONS ====
document.addEventListener("click", async e => {
    if (e.target.classList.contains("complete-assignment")) {
        await completeAssignment(parseInt(e.target.dataset.index));
    } else if (e.target.classList.contains("complete-task")) {
        await completeTask(parseInt(e.target.dataset.index));
    }
});

// ==== INITIALIZATION ====
async function init() {
    App.assignments = await Storage.get("assignments");
    App.tasks = await Storage.get("tasks");
    App.grades = await Storage.get("grades");
    const darkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (darkMode) document.body.classList.add("dark");

    renderAssignments();
    renderTasks();
    renderGrades();
    updateStats();
}

init();
