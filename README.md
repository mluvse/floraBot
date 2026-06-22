# 🌸 FloraBot — Распознавание деревьев по цветкам

> Веб-приложение на React + Node.js + PostgreSQL с Yandex Vision AI для определения вида дерева по фотографии цветка.

## 📸 Скриншоты и страницы

| Страница | Описание |
|---|---|
| `/` | Главная с анимированным фоном, падающими лепестками, статистикой |
| `/recognize` | Распознавание (загрузка файла + камера телефона) |
| `/catalog` | Каталог деревьев с поиском и фильтрами |
| `/catalog/:id` | Детальная карточка дерева |
| `/catalog/new` | Добавление нового дерева (форма, CRUD) |
| `/profile` | Профиль пользователя + история распознаваний |
| `/login` | Авторизация (JWT) |
| `/register` | Регистрация (JWT) |

---

## ✅ Требования — Чеклист

| # | Требование | Реализация |
|---|---|---|
| 1 | Минимум 3 страницы | 8 страниц: главная, распознавание, каталог, детали дерева, форма, профиль, логин, регистрация |
| 2 | Mobile-first (адаптивность) | Tailwind CSS, все компоненты адаптивные, камера через `facingMode: environment` |
| 3 | Форма для заполнения | Регистрация, логин, добавление/редактирование дерева, заметки к распознаванию |
| 4 | React фреймворк | React 18 + React Router v6 + Vite |
| 5 | Анимация фона | Падающие лепестки (CSS), анимированные blob-и, floating icons, анимация уверенности |
| 6 | БД с 3 связанными таблицами | `users` ← `recognition_history` → `trees` (FK-связи) |
| 7 | JWT аутентификация | bcrypt + jsonwebtoken, регистрация + логин + `/api/auth/me` |
| 8 | CRUD операции | Полный CRUD для деревьев + история распознаваний (create, read, update notes, delete) |
| 9 | Цветовая палитра | Зелёно-розовая палитра (flora/blossom/earth), соответствует теме природы |
| 10 | Иконка сайта | SVG-логотип, нарисованный вручную (`FloraLogo.jsx` + `favicon.svg`) |
| + | Lazy loading | React `lazy()` + `Suspense`, `IntersectionObserver` для карточек, `loading="lazy"` для img |
| + | Логи/мониторинг | Morgan (HTTP), кастомный logger (app.log, access.log), `/api/health` |
| + | Docker | Dockerfile для backend и frontend, `docker-compose.yml` с PostgreSQL |

---

## 🗄️ Схема базы данных

```sql
users (id, username, email, password_hash, avatar_url, created_at)
    ↓ (user_id FK)
recognition_history (id, user_id, tree_id, image_url, confidence, raw_result, notes, created_at)
    ↑ (tree_id FK)
trees (id, name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url)
```

---

## 🚀 Запуск через Docker (рекомендуется)

```bash
# 1. Клонируйте репозиторий
git clone <repo-url> florabot
cd florabot

# 2. Скопируйте конфиг
cp .env.example .env
# Заполните YANDEX_API_KEY и YANDEX_FOLDER_ID

# 3. Запустите
docker-compose up --build

# Приложение: http://localhost
# API:        http://localhost:5000/api
```

---

## 🛠️ Запуск для разработки (без Docker)

### Требования
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend
npm install
cp .env.example .env    # заполните переменные
node src/index.js       # или: npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:3000
```

---

## 🤖 Yandex Vision API — Настройка

1. Зайдите на [console.cloud.yandex.ru](https://console.cloud.yandex.ru)
2. Создайте сервисный аккаунт → выдайте роль `ai.vision.user`
3. Создайте API-ключ для сервисного аккаунта
4. Получите `Folder ID` (в верхней части консоли)
5. Заполните `.env`:
   ```
   YANDEX_API_KEY=AQVN...
   YANDEX_FOLDER_ID=b1g...
   ```

> **Без API-ключа** приложение работает в **демо-режиме**: возвращает случайное дерево из БД. Все остальные функции работают полностью.

---

## 📁 Структура проекта

```
florabot/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Express + middleware
│       ├── models/db.js          # PostgreSQL + seeder
│       ├── middleware/auth.js    # JWT middleware
│       ├── routes/
│       │   ├── auth.js           # Регистрация / Логин / /me
│       │   ├── trees.js          # CRUD деревья
│       │   ├── recognition.js    # Yandex Vision
│       │   └── history.js        # История
│       └── utils/logger.js       # Кастомный логгер
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Router + lazy imports
        ├── index.css             # Анимации, Tailwind
        ├── context/AuthContext.jsx
        ├── hooks/useLazyReveal.js
        ├── components/
        │   ├── FloraLogo.jsx     # SVG-логотип (нарисован вручную)
        │   ├── Navbar.jsx
        │   └── PetalRain.jsx     # Падающие лепестки
        └── pages/
            ├── HomePage.jsx
            ├── RecognizePage.jsx
            ├── CatalogPages.jsx
            ├── ProfilePage.jsx
            └── AuthPages.jsx
```

---

## 🎨 Дизайн-решения

- **Цветовая палитра**: зелёный (`flora`) — природа и жизнь, розовый (`blossom`) — цветение, коричневый (`earth`) — земля и стволы
- **Типографика**: Playfair Display для заголовков (элегантность), Inter для текста (читаемость)
- **Анимации**: CSS keyframes, blob-анимации фона, падающие лепестки (постоянно), floating icons, scroll-triggered reveal
- **Логотип**: SVG, нарисован вручную — дерево с розовыми цветами на зелёном фоне

---

## 📊 API Endpoints

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Логин → JWT |
| GET | `/api/auth/me` | ✅ | Текущий пользователь |
| GET | `/api/trees` | — | Список деревьев (поиск) |
| GET | `/api/trees/:id` | — | Одно дерево |
| POST | `/api/trees` | ✅ | Создать дерево |
| PUT | `/api/trees/:id` | ✅ | Обновить дерево |
| DELETE | `/api/trees/:id` | ✅ | Удалить дерево |
| POST | `/api/recognition/analyze` | ✅ | Распознать (файл) |
| POST | `/api/recognition/analyze-base64` | ✅ | Распознать (камера) |
| GET | `/api/history` | ✅ | История пользователя |
| PATCH | `/api/history/:id/notes` | ✅ | Добавить заметку |
| DELETE | `/api/history/:id` | ✅ | Удалить запись |
| GET | `/api/health` | — | Health check |
