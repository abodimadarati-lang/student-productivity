// script.js

// Dark Mode Toggle
const toggleDarkMode = () => {
    const body = document.body;
    body.classList.toggle('dark-mode');
};

// Assignments Management
const assignments = [];
const addAssignment = (title, deadline) => {
    assignments.push({ title, deadline });
};

// Tasks Management
const tasks = [];
const addTask = (task) => {
    tasks.push({ task, completed: false });
};

// Timer Functionality
let timer;
const startTimer = (duration) => {
    clearInterval(timer);
    let timeRemaining = duration;
    timer = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(timer);
            alert('Time is up!');
        } else {
            timeRemaining--;
            displayTime(timeRemaining);
        }
    }, 1000);
};

const displayTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timerDisplay = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    document.getElementById('timer').textContent = timerDisplay;
};

// Grades Management
const grades = {};
const addGrade = (subject, grade) => {
    grades[subject] = grade;
};

// Focus Mode
const toggleFocusMode = () => {
    const focusElement = document.getElementById('focus-mode');
    focusElement.classList.toggle('active');
};

// Section Navigation
const navigateToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners for UI
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

// Add more event listeners as necessary for other UI components.