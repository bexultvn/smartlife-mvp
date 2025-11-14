SmartLife MVP — Productivity Platform (Frontend)
SmartLife is a frontend-only MVP productivity platform that includes a dashboard, task manager, Pomodoro timer, note-taking tool (Conspectus), and user settings.
This project is built according to the provided UX/UI Figma design and uses HTML, CSS (Tailwind), JavaScript (ES Modules), and Vite.
📌 Tech Stack
Frontend:
HTML5 + Tailwind CSS
Vanilla JavaScript (ES Modules)
Vite (local dev server + bundler)
Data Storage:
LocalStorage used as temporary backend replacement (MVP)
Project Structure:
Modular pages in src/pages/
Shared layout components in src/js/layout.js
Reusable UI utilities in src/js/
📄 Pages Included
All pages from the Figma design are implemented:
User
/pages/login.html
/pages/register.html
Main App
/pages/dashboard.html
/pages/my-tasks.html
/pages/add-task.html
/pages/edit-task.html
/pages/pomodoro.html
/pages/conspectus.html
/pages/settings.html
/pages/settings-change.html
Each page dynamically loads its content using ES modules.