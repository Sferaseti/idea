# AI Design SaaS - Техническое задание

## 1. Обзор проекта

### 1.1 Описание
AI Design SaaS — платформа для застройщиков, позволяющая встраивать AI-генератор дизайна интерьеров на их сайты. Посетители сайта застройщика могут создавать визуализации дизайна по планировкам квартир и оставлять заявки (лиды).

### 1.2 Ключевые особенности
- Встраиваемый виджет (одна строка кода)
- AI-генерация дизайна интерьера через Gemini API
- Автоматический сбор планировок с сайта
- Интеграция с CRM застройщиков
- Лидогенерация и аналитика

### 1.3 Целевая аудитория
- Застройщики жилой недвижимости
- Агентства недвижимости
- Агрегаторы недвижимости

---

## 2. Технический стек

| Компонент | Технология |
|-----------|------------|
| Frontend/Backend | Next.js 14+ (App Router) |
| База данных | Supabase (PostgreSQL) |
| Аутентификация | Supabase Auth |
| Хранилище файлов | Supabase Storage |
| AI генерация | Google Gemini API |
| UI библиотека | Tailwind CSS + shadcn/ui |
| Хостинг | Vercel |
| Виджет | Vanilla JS / Preact (~12KB) |

---

## 3. Архитектура

### 3.1 Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard App                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Marketing   │ │  Dashboard  │ │        API              ││
│  │ Pages       │ │  Pages      │ │  /api/v1/*              ││
│  │             │ │             │ │  /api/widget/*          ││
│  └─────────────┘ └─────────────┘ │  /api/collector/*       ││
│                                   └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Supabase   │    │  Gemini AI  │    │ CRM APIs    │
   │  Database   │    │             │    │ (Bitrix24)  │
   └─────────────┘    └─────────────┘    └─────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │                  Embed Widget (widget.js)                │
   │  Встраивается на сайты клиентов                         │
   └─────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

**Генерация дизайна:**
1. Посетитель выбирает планировку на сайте застройщика
2. Нажимает кнопку "Создать дизайн"
3. Выбирает стиль и вводит пожелания
4. Backend отправляет запрос в Gemini API
5. Результат сохраняется в Storage
6. Посетитель видит результат в виджете
7. Заполняет форму для получения изображения
8. Лид отправляется в CRM

---

## 4. База данных

### 4.1 Таблицы

| Таблица | Описание |
|---------|----------|
| organizations | Клиенты SaaS (застройщики) |
| organization_members | Связь пользователей с организациями |
| floor_plans | Планировки квартир |
| design_styles | Предустановленные стили дизайна |
| generations | История генераций |
| leads | Захваченные лиды |
| crawled_pages | Страницы, найденные сканером |
| crawled_images | Изображения, найденные на сайтах |
| subscriptions | Подписки и биллинг |
| payments | История платежей |

### 4.2 Ключевые связи

```
organizations (1) ── (N) floor_plans
organizations (1) ── (N) generations
organizations (1) ── (N) leads
floor_plans (1) ── (N) generations
generations (1) ── (0,1) leads
```

---

## 5. API Endpoints

### 5.1 Internal API (/api/v1/*)

Требует Supabase сессию.

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | /organizations | Список организаций пользователя |
| GET | /floor-plans | Список планировок |
| POST | /floor-plans | Создать планировку |
| PUT | /floor-plans/:id | Обновить планировку |
| DELETE | /floor-plans/:id | Удалить планировку |
| GET | /generations | История генераций |
| GET | /leads | Список лидов |
| PUT | /settings | Обновить настройки |

### 5.2 Widget API (/api/widget/*)

Требует API key в заголовке X-API-Key.

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | /config | Конфигурация виджета |
| GET | /floor-plans | Активированные планировки |
| POST | /generate | Запустить генерацию |
| GET | /generation/:id | Статус генерации |
| POST | /lead | Отправить лид |

### 5.3 Collector API (/api/collector/*)

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | /:clientId/page | Данные страницы |
| GET | /:clientId/activated | Активированные изображения |

---

## 6. Виджет

### 6.1 Установка

```html
<script
  src="https://app.aidesign.ru/widget.js"
  data-key="YOUR_API_KEY"
  data-position="bottom-right"
  data-color="#667eea"
></script>
```

### 6.2 Функции

- Плавающая кнопка на сайте
- Открытие виджета в iframe
- Выбор стиля дизайна
- Ввод пожеланий
- Отображение результата генерации
- Форма захвата лида
- Автоопределение планировок на странице
- Сканирование изображений сайта

### 6.3 Коммуникация

Используется postMessage API для связи между embed-скриптом и iframe.

---

## 7. Интеграции

### 7.1 CRM

| Система | Статус |
|---------|--------|
| Bitrix24 | Приоритет 1 |
| AmoCRM | Приоритет 2 |
| Webhook | Универсальный |

### 7.2 Формат лида

```json
{
  "name": "Иван Петров",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "floor_plan": "Двушка угловая",
  "design_style": "Скандинавский",
  "design_url": "https://...",
  "source": "ai_design_widget",
  "utm_source": "google"
}
```

---

## 8. Биллинг

### 8.1 Тарифные планы

| План | Цена | Генераций |
|------|------|-----------|
| Trial | 0 ₽ | 100 |
| Starter | 15 000 ₽/мес | 500 |
| Business | 45 000 ₽/мес | 2000 |
| Enterprise | Договорная | Безлимит |

### 8.2 Логика лимитов

- Счётчик генераций сбрасывается ежемесячно
- При превышении лимита генерация блокируется
- Уведомление при остатке < 20%

---

## 9. Безопасность

### 9.1 Аутентификация

- Dashboard: Supabase Auth (email/password)
- Widget API: API key в заголовке
- Service operations: Service Role key (только на сервере)

### 9.2 Авторизация

- Row Level Security на всех таблицах
- Проверка organization_id в каждом запросе
- Валидация домена для API key

### 9.3 Валидация

- Все входные данные валидируются через Zod
- Санитизация HTML/SQL
- Rate limiting на API endpoints

---

## 10. Развёртывание

### 10.1 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### 10.2 Vercel Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## 11. План реализации

### Sprint 1 (Неделя 1-2): Foundation
- Инициализация проекта
- Supabase setup
- Аутентификация
- Dashboard layout

### Sprint 2 (Неделя 3-4): Core
- Управление планировками
- Gemini API интеграция
- Генерация дизайна
- История генераций

### Sprint 3 (Неделя 5-6): Widget
- Embed скрипт
- Widget UI
- Лидогенерация
- Автосканирование

### Sprint 4 (Неделя 7-8): Polish
- Биллинг
- CRM интеграции
- Аналитика
- Production readiness

---

## 12. Мониторинг

### 12.1 Метрики

- Generation time: < 10 sec (p95)
- API latency: < 200ms (p99)
- Error rate: < 0.1%
- Widget load time: < 500ms

### 12.2 Логирование

- API requests
- Generations (start, complete, fail)
- CRM sends
- Payments

---

## 13. Документация

Дополнительная документация находится в:

- `.cursorrules` - Правила проекта
- `.cursor/context/architecture.md` - Архитектура
- `.cursor/context/database.md` - Схема БД
- `.cursor/context/api.md` - API документация
- `.cursor/rules/supabase.md` - Работа с Supabase
- `.cursor/rules/components.md` - UI компоненты
- `.cursor/prompts/` - Промпты для разработки
