# Контракт фронтенда SmartLife с backend

Этот документ описывает, какие эндпоинты и поля нужны бэкенду (Spring), чтобы заменить нынешний мок на `localStorage` и работать с реальным сервером.

---

## 1. Базовый URL и окружение

- Фронтенд читает `VITE_API_BASE_URL` (по умолчанию `http://localhost:8080/api`).
- Код: `src/js/api/config.js`.
- Все запросы отправляются через `fetch` с этим базовым URL.

> При запуске `npm run dev` / `npm run build` установите `VITE_API_BASE_URL=http://ваш-домен/api`.

---

## 2. Эндпоинты аутентификации (`src/js/api/auth.js`)

| Метод | Путь             | Назначение               | Ожидаемый статус |
|-------|------------------|--------------------------|------------------|
| POST  | `/auth/login`    | Авторизация пользователя | `200` |
| POST  | `/auth/register` | Регистрация              | `201` (или `200`) |
| GET   | `/auth/me`       | Получение текущего профиля| `200` |
| PUT   | `/auth/me`       | Обновление профиля       | `200` |
| POST  | `/auth/logout`   | Завершение сессии        | `204` (или `200`) |

### Общие требования
- Заголовок `Authorization: Bearer <accessToken>` передается везде, кроме `login` и `register`.
- 4xx ошибки (валидация и т.п.) показываются пользователю; 5xx или сетевые ошибки → фронт молча откатывается к `localStorage`.
- При `401` фронтенд очищает сессию и отправляет пользователя на логин.

### 2.1 Форматы запросов/ответов

#### POST `/auth/login`
**Запрос**
```json
{
  "username": "string",
  "password": "string"
}
```

**Ответ**
```json
{
  "user": {
    "id": "string|number",
    "username": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "avatar": "string (URL) | null"
  },
  "accessToken": "string",         // обязателен, если нужны защищенные запросы
  "refreshToken": "string | null"  // опционально, сохраняется на будущее
}
```

#### POST `/auth/register`
**Запрос**
```json
{
  "username": "string",
  "password": "string",
  "confirmPassword": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```

**Ответ**
- Можно вернуть тот же формат, что в `login`, или просто сохранённого пользователя.
- Сейчас фронт после успеха просто переходит на страницу входа.

#### GET `/auth/me`
**Ответ**
```json
{
  "id": "string|number",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "avatar": "string (URL) | null"
}
```

#### POST `/auth/logout`
- Тело не требуется.
- В ответе данные не нужны.

---

### 2.2 Обновление профиля

#### PUT `/auth/me`
**Запрос**
- Можно отправлять частичное обновление; отсутствующие поля не меняются.
- `username` передаётся, только если пользователь хочет его сменить; пустая строка игнорируется.
```json
{
  "username": "string | null",
  "firstName": "string | null",
  "lastName": "string | null",
  "email": "string | null",
  "avatar": "string (URL) | null"
}
```

**Ответ**
- Возвращает актуализированного пользователя в том же формате, что и `GET /auth/me`.
```json
{
  "id": "string|number",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "avatar": "string (URL) | null"
}
```

- Фронтенд ожидает, что после успешного ответа обновлённые данные будут возвращены и станут источником правды для сессии.
- При валидационных ошибках верните `400` с сообщением в поле `message`. Если e-mail или username уже заняты — `409`.
- Если `username` изменился, верните его в ответе и убедитесь, что refresh/access токен отражают новый логин (иначе фронт инициирует `login` повторно).

---

## 3. Эндпоинты задач (`src/js/api/tasks.js`)

| Метод | Путь            | Назначение                       | Ожидаемый статус |
|-------|-----------------|----------------------------------|------------------|
| GET   | `/tasks`        | Список задач текущего пользователя | `200` |
| POST  | `/tasks`        | Создание задачи                  | `201` (или `200`) |
| PUT   | `/tasks/{id}`   | Обновление задачи                | `200` |
| DELETE| `/tasks/{id}`   | Удаление задачи                  | `204` (или `200`) |

- Все запросы защищены Bearer-токеном.
- Фронтенд переходит на локальный кеш только при 5xx/таймауте; 4xx ошибки показываются пользователю.

### 3.1 Task DTO (то, что ожидает фронт)

```json
{
  "id": "string|number",
  "title": "string",
  "desc": "string",
  "priority": "Extreme | Moderate | Low",
  "status": "Not Started | In Progress | Completed",
  "deadline": "ISO timestamp | null",
  "coverImage": "string (URL) | null",
  "accent": "string | null",
  "completedAt": "ISO timestamp | null"
}
```

### 3.2 Детали эндпоинтов

#### GET `/tasks`
Возвращает массив DTO.
```json
[
  {
    "id": "42",
    "title": "Подготовить демо",
    "desc": "Синк с продуктологами",
    "priority": "Moderate",
    "status": "In Progress",
    "deadline": "2024-10-12T15:00:00Z",
    "coverImage": null,
    "accent": null,
    "completedAt": null
  }
]
```

#### POST `/tasks`
**Запрос**
```json
{
  "title": "string",
  "desc": "string",
  "priority": "Extreme | Moderate | Low",
  "status": "Not Started | In Progress | Completed",
  "deadline": "ISO timestamp | null",
  "coverImage": "string (URL) | null"
}
```

**Ответ**
- Должен вернуть сохранённую задачу в формате DTO (с `id`).

#### PUT `/tasks/{id}`
- Принимает тот же payload, что POST.
- Возвращает обновлённую задачу (DTO).

#### DELETE `/tasks/{id}`
- Тело не требуется.
- Ответ `204`/`200`.

> При drag’n’drop на канбан-доске отправляется `PUT /tasks/{id}` с полем `{ "status": "<новый статус>" }`.

---

## 4. Где реализованы запросы на фронте

| Назначение       | Файлы |
|------------------|-------|
| Настройки API    | `src/js/api/config.js` |
| HTTP-клиент      | `src/js/api/http-client.js` |
| Сессия пользователя | `src/js/stores/session-store.js` |
| Аутентификация   | `src/js/api/auth.js`, `src/pages/login.js`, `src/pages/register.js` |
| Настройки профиля | `src/pages/settings.js`, `src/js/profile-store.js` |
| CRUD задач       | `src/js/api/tasks.js`, `src/js/tasks-store.js`, `src/pages/dashboard.js`, `src/pages/my-tasks.js`, `src/pages/add-task.js` |

- Все изменений по маршрутам и полям достаточно внести в `src/js/api/*.js`, остальной UI автоматически подстроится.
- При падении API в консоли появится предупреждение: `"Tasks API unavailable. Falling back to local storage."`.
- Профиль сейчас лежит в `src/js/profile-store.js`; после подключения `PUT /auth/me` нужно будет заменить сохранение в `localStorage` на обращение к серверу.

---

## 5. Обработка ошибок

- Для 4xx возвращайте удобочитаемое `message` — оно покажется пользователю.
- Можно дополнительно присылать `errors` по полям, но фронт сейчас использует только `message`.
- `401` обязателен для протухших/невалидных токенов.
- Старайтесь укладываться в разумное время ответа (<10 секунд), иначе `fetch` может упасть по таймауту.

---

## 6. Дополнительно (необязательно)

- Если нужен refresh токен — добавьте отдельный эндпоинт и свяжите его с `session-store`.
- Пагинация `/tasks` пока не нужна (список небольшой).
- После реализации `PUT /auth/me` фронтенд сможет отказаться от локального `saveProfile` и синхронизировать профиль с сервером.

---

Как только Spring-приложение реализует эти маршруты и структуры, фронтенд заработает с реальным backend’ом. После настройки достаточно выставить `VITE_API_BASE_URL`, дописывать код в фронт не нужно. При изменении контрактов сообщайте, и можно скорректировать модули в `src/js/api/…`.
