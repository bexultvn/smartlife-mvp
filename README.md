SmartLife MVP — Productivity Platform (Frontend)
SmartLife is a frontend-only MVP productivity platform that includes a dashboard, task manager, Pomodoro timer, note-taking tool, and user settings.
The project is built using HTML, TailwindCSS, JavaScript (ES Modules), and Vite.
📌 Tech Stack
Languages & Frameworks
HTML5
Tailwind CSS
JavaScript (Vanilla, ES Modules)
Vite (bundler & dev server)
Storage
LocalStorage (temporary backend substitute for MVP)
📁 Pages
All pages from the Figma design are included:
dashboard.html
my-tasks.html
add-task.html
edit-task.html
pomodoro.html
conspectus.html
settings.html
settings-change.html
login.html
register.html
Each page loads dynamic content from src/pages/*.
🚀 Getting Started
1. Install dependencies
npm install
2. Build Tailwind CSS
npm run build:css
3. Start development server
npm run dev
Vite will start the app at:
http://localhost:5173
4. Static alternative
You can also open:
/index.html
🧩 Features
🔹 Global Layout
Sidebar and header
Injected from src/js/layout.js
Shared across all pages
🔹 Task Manager (MVP)
Add / edit / delete tasks
Toggle task status
LocalStorage-based storage
🔹 Pomodoro Timer
Start / Pause / Reset
Minimalistic session logic
Simple countdown interface
🔹 Conspectus (Notes)
Create and save notes
Stored in LocalStorage
Clean editor layout (MVP)
🔹 User Settings
Load profile data from LocalStorage
Change profile settings