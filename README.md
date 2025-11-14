# SmartLife MVP (Frontend — all pages)

В проект добавлены все страницы из макета:
- /pages/dashboard.html
- /pages/my-tasks.html
- /pages/add-task.html
- /pages/edit-task.html
- /pages/pomodoro.html
- /pages/conspectus.html
- /pages/settings.html
- /pages/settings-change.html
- /pages/login.html
- /pages/register.html

## Запуск
npm install
npm run build:css
npm run dev

(или открой /index.html, если ты используешь статический сервер)

## Примечания
- Общий layout и навигация собраны в src/js/layout.js
- Контент страниц рендерится из модульных скриптов в src/pages/*
- Pomodoro — простая логика (Start/Pause/Reset)
- Add task — сохраняет в localStorage как MVP
