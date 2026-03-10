{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // LOCAL STORAGE LOAD\
\
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];\
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];\
let grades = JSON.parse(localStorage.getItem("grades")) || [];\
let tasksCompleted = 0;\
let studyMinutes = 0;\
\
// ASSIGNMENTS\
\
function addAssignment()\{\
\
let text = document.getElementById("assignmentInput").value;\
let date = document.getElementById("dueDate").value;\
\
if(text==="") return;\
\
assignments.push(\{text,date\});\
\
localStorage.setItem("assignments",JSON.stringify(assignments));\
\
renderAssignments();\
\}\
\
function renderAssignments()\{\
\
let list = document.getElementById("assignmentList");\
list.innerHTML="";\
\
assignments.forEach((a,i)=>\{\
\
let li=document.createElement("li");\
li.innerHTML=`$\{a.text\} (Due: $\{a.date\})\
<button onclick="completeAssignment($\{i\})">Done</button>`;\
\
list.appendChild(li);\
\
\});\
\
document.getElementById("assignmentsRemaining").innerText=assignments.length;\
\}\
\
function completeAssignment(i)\{\
\
assignments.splice(i,1);\
\
localStorage.setItem("assignments",JSON.stringify(assignments));\
\
tasksCompleted++;\
\
document.getElementById("tasksCompleted").innerText=tasksCompleted;\
\
renderAssignments();\
\}\
\
// TASKS\
\
function addTask()\{\
\
let text=document.getElementById("taskInput").value;\
\
if(text==="") return;\
\
tasks.push(text);\
\
localStorage.setItem("tasks",JSON.stringify(tasks));\
\
renderTasks();\
\}\
\
function renderTasks()\{\
\
let list=document.getElementById("taskList");\
\
list.innerHTML="";\
\
tasks.forEach((t,i)=>\{\
\
let li=document.createElement("li");\
\
li.innerHTML=`$\{t\}\
<button onclick="completeTask($\{i\})">Done</button>`;\
\
list.appendChild(li);\
\
\});\
\}\
\
function completeTask(i)\{\
\
tasks.splice(i,1);\
\
tasksCompleted++;\
\
document.getElementById("tasksCompleted").innerText=tasksCompleted;\
\
renderTasks();\
\}\
\
// GRADE CALCULATOR\
\
function addGrade()\{\
\
let g=parseFloat(document.getElementById("gradeInput").value);\
\
if(isNaN(g)) return;\
\
grades.push(g);\
\
localStorage.setItem("grades",JSON.stringify(grades));\
\
let avg = grades.reduce((a,b)=>a+b)/grades.length;\
\
document.getElementById("averageGrade").innerText=avg.toFixed(2);\
\}\
\
// TIMER\
\
let time=1500;\
let timerInterval;\
\
function startTimer()\{\
\
clearInterval(timerInterval);\
\
timerInterval=setInterval(()=>\{\
\
time--;\
\
let minutes=Math.floor(time/60);\
let seconds=time%60;\
\
document.getElementById("timer").innerText=\
`$\{minutes\}:$\{seconds.toString().padStart(2,"0")\}`;\
\
if(time<=0)\{\
\
clearInterval(timerInterval);\
\
studyMinutes+=25;\
\
document.getElementById("studyTime").innerText=studyMinutes;\
\
alert("Break Time!");\
\
time=300;\
\}\
\
\},1000);\
\
\}\
\
function resetTimer()\{\
\
clearInterval(timerInterval);\
\
time=1500;\
\
document.getElementById("timer").innerText="25:00";\
\}\
\
// FOCUS MODE\
\
function focusMode()\{\
\
document.body.innerHTML=\
\
`\
<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:40px">\
\
<div id="timer">25:00</div>\
\
<p>"Success is built in hours of focus."</p>\
\
<button onclick="location.reload()">Exit</button>\
\
</div>\
`;\
\}\
\
// DARK MODE\
\
document.getElementById("darkModeToggle").onclick=()=>\{\
\
document.body.classList.toggle("dark");\
\}\
\
// INITIAL RENDER\
\
renderAssignments();\
renderTasks();}