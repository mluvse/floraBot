# 🚀 Деплой FloraBot на Railway — пошаговая инструкция

## Что получишь в итоге
- Публичная ссылка вида `https://florabot-backend.up.railway.app` (бэкенд)
- Публичная ссылка вида `https://florabot-frontend.up.railway.app` (сайт)
- Бесплатный тариф: $5 кредитов/месяц (~500 часов работы)

---

## Шаг 1 — Зарегистрируйся на Railway

1. Зайди на **https://railway.app**
2. Нажми **"Login"** → выбери **"Login with GitHub"**
3. Если нет GitHub — зарегистрируйся там сначала (бесплатно)
4. Авторизуй Railway в своём GitHub аккаунте

---

## Шаг 2 — Загрузи код на GitHub

1. Зайди на **https://github.com/new**
2. Создай **приватный** репозиторий, назови `florabot`
3. Распакуй архив `florabot-project.zip` на своём компьютере
4. В папке `florabot/` выполни в терминале:

```bash
git init
git add .
git commit -m "Initial FloraBot commit"
git branch -M main
git remote add origin https://github.com/ТВО_ИМЯ/florabot.git
git push -u origin main
```

---

## Шаг 3 — Создай проект на Railway

1. Зайди на **https://railway.app/dashboard**
2. Нажми **"New Project"**
3. Выбери **"Deploy from GitHub repo"**
4. Выбери репозиторий `florabot`
5. Railway предложит деплоить — **пока нажми "Cancel"**, нам нужно настроить сервисы вручную

---

## Шаг 4 — Добавь PostgreSQL

В созданном проекте:
1. Нажми **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Дождись, пока база развернётся (30–60 секунд)
3. Нажми на PostgreSQL → вкладка **"Variables"**
4. Скопируй значение `DATABASE_URL` — оно понадобится позже

---

## Шаг 5 — Задеплой Backend

1. В проекте нажми **"+ New"** → **"GitHub Repo"**
2. Выбери репозиторий `florabot`
3. Railway спросит **Root Directory** — введи: `backend`
4. Нажми **"Deploy"**

### Настрой переменные окружения для Backend:
Нажми на сервис backend → **"Variables"** → добавь:

| Переменная | Значение |
|---|---|
| `PORT` | `5000` |
| `DATABASE_URL` | *(вставь DATABASE_URL из PostgreSQL выше)* |
| `JWT_SECRET` | `придумай_длинный_секретный_ключ_минимум_32_символа` |
| `JWT_EXPIRES` | `7d` |
| `NODE_ENV` | `production` |
| `YANDEX_API_KEY` | *(твой ключ Yandex Vision, или оставь пустым для демо)* |
| `YANDEX_FOLDER_ID` | *(твой Folder ID, или оставь пустым)* |

> **Важно:** После добавления переменных Railway автоматически перезапустит сервис.

### Получи URL бэкенда:
Нажми на сервис backend → вкладка **"Settings"** → раздел **"Networking"** → нажми **"Generate Domain"**

Скопируй URL вида: `https://florabot-backend-xxxx.up.railway.app`

---

## Шаг 6 — Задеплой Frontend

1. В проекте нажми **"+ New"** → **"GitHub Repo"**
2. Выбери репозиторий `florabot`
3. **Root Directory**: `frontend`
4. Нажми **"Deploy"**

### Настрой переменные для Frontend:
Нажми на сервис frontend → **"Variables"** → добавь:

| Переменная | Значение |
|---|---|
| `VITE_API_URL` | `https://florabot-backend-xxxx.up.railway.app` *(URL из шага 5)* |
| `PORT` | `3000` |

> После добавления `VITE_API_URL` нажми **"Redeploy"** — фронт пересоберётся с правильным URL бэкенда.

### Получи URL фронта:
Нажми на сервис frontend → **"Settings"** → **"Networking"** → **"Generate Domain"**

---

## Шаг 7 — Обнови CORS на бэкенде

Теперь когда знаешь URL фронтенда, добавь его в переменные бэкенда:

| Переменная | Значение |
|---|---|
| `FRONTEND_URL` | `https://florabot-frontend-xxxx.up.railway.app` |

Railway автоматически перезапустит бэкенд.

---

## Шаг 8 — Проверка

1. Открой URL фронтенда в браузере
2. Нажми **"Зарегистрироваться"** → создай аккаунт
3. Зайди в **"Распознать"** → загрузи любое фото цветка
4. Зайди в **"Каталог"** → убедись, что деревья загружены

### Health check бэкенда:
```
https://florabot-backend-xxxx.up.railway.app/api/health
```
Должен вернуть: `{"status":"ok","timestamp":"..."}`

---

## ❓ Частые проблемы

### Бэкенд не запускается
- Проверь, что `DATABASE_URL` скопирован без лишних пробелов
- Посмотри логи: нажми на сервис → вкладка **"Logs"**

### Фронт не соединяется с бэком (CORS ошибка)
- Убедись, что `FRONTEND_URL` в переменных бэкенда совпадает с реальным URL фронта (включая `https://`)
- После изменения переменной дождись перезапуска

### "Демо-режим" вместо реального ИИ
- Настрой `YANDEX_API_KEY` и `YANDEX_FOLDER_ID` (см. README.md)
- Без ключей приложение работает, но возвращает случайное дерево

---

## 💰 Бесплатный тариф Railway

- **$5 кредитов** в месяц автоматически
- Хватает примерно на **500 часов** работы трёх сервисов
- При превышении сервисы засыпают (не удаляются)
- Для учебного проекта более чем достаточно

---

## 🔗 Полезные ссылки

- Railway Dashboard: https://railway.app/dashboard
- Логи сервиса: нажми на сервис → **"Logs"**
- Документация Railway: https://docs.railway.app
