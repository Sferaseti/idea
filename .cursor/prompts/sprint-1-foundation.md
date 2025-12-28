# Sprint 1: Foundation (Неделя 1-2)

## Цель
Создать базовую инфраструктуру: Next.js проект, Supabase подключение, аутентификация, базовый dashboard layout.

---

## Task 1.1: Инициализация проекта

```prompt
Инициализируй Next.js 14 проект с App Router:

1. Создай структуру папок согласно .cursorrules:
   - app/(marketing)/ для публичных страниц
   - app/(dashboard)/ для защищённых страниц
   - app/api/ для API routes
   - app/widget/ для виджета
   - components/ui/ для shadcn компонентов
   - lib/supabase/ для Supabase клиентов
   - lib/utils.ts для утилит

2. Установи и настрой:
   - Tailwind CSS
   - shadcn/ui (init + базовые компоненты: button, card, input, form, dialog)
   - @supabase/ssr
   - zod
   - react-hook-form
   - lucide-react

3. Создай базовые конфиги:
   - tailwind.config.ts с темой для проекта
   - components.json для shadcn
   - .env.local.example

Используй TypeScript strict mode.
```

---

## Task 1.2: Supabase Setup

```prompt
Настрой Supabase для проекта:

1. Создай клиенты в lib/supabase/:
   - server.ts - для Server Components
   - client.ts - для Client Components
   - service.ts - для API Routes (service role)
   - middleware.ts - для обновления сессий

2. Создай файл типов lib/supabase/types.ts с базовой структурой Database

3. Настрой middleware.ts в корне проекта для обновления Supabase сессий

Следуй паттернам из .cursor/rules/supabase.md
```

---

## Task 1.3: Database Schema

```prompt
Создай миграции Supabase для базовых таблиц:

Согласно схеме из .cursor/context/database.md создай:

1. supabase/migrations/001_initial_schema.sql:
   - organizations
   - organization_members
   - Функцию generate_api_key()

2. supabase/migrations/002_floor_plans.sql:
   - floor_plans
   - design_styles с предзаполненными стилями

3. supabase/migrations/003_generations_leads.sql:
   - generations
   - leads

4. supabase/migrations/004_rls_policies.sql:
   - RLS политики для всех таблиц

5. supabase/migrations/005_triggers.sql:
   - Триггеры updated_at
   - Счётчики генераций и лидов
```

---

## Task 1.4: Authentication

```prompt
Реализуй аутентификацию:

1. Создай страницы в app/auth/:
   - login/page.tsx - форма входа (email/password)
   - register/page.tsx - форма регистрации
   - callback/route.ts - обработчик OAuth callback

2. Создай компоненты в components/auth/:
   - LoginForm.tsx
   - RegisterForm.tsx

3. Добавь серверные actions в lib/auth/actions.ts:
   - signIn
   - signUp
   - signOut

4. Настрой редирект после логина на /dashboard

Используй react-hook-form + zod для валидации.
Показывай ошибки inline в форме.
```

---

## Task 1.5: Dashboard Layout

```prompt
Создай layout для dashboard:

1. app/(dashboard)/layout.tsx:
   - Проверка аутентификации (redirect на /auth/login если не авторизован)
   - Sidebar слева
   - Header сверху
   - Main content area

2. components/dashboard/Sidebar.tsx:
   - Логотип
   - Навигация: Дашборд, Планировки, Генерации, Лиды, Настройки
   - Активный пункт подсвечен
   - Внизу: имя пользователя + logout

3. components/dashboard/Header.tsx:
   - Breadcrumbs
   - Название текущей страницы
   - Кнопка уведомлений (заглушка)
   - User menu dropdown

4. Добавь loading.tsx и error.tsx для (dashboard)

Следуй паттернам из .cursor/rules/components.md
```

---

## Task 1.6: Organization Context

```prompt
Реализуй контекст организации:

1. После регистрации автоматически создавать организацию для пользователя

2. Создай lib/hooks/use-organization.ts:
   - Хранит текущую организацию
   - Загружает организации пользователя
   - Позволяет переключаться между организациями

3. Добавь OrganizationProvider в dashboard layout

4. Создай компонент выбора организации в Sidebar (если у пользователя несколько)

5. Все dashboard routes должны использовать organization_id из контекста
```

---

## Task 1.7: Dashboard Home Page

```prompt
Создай главную страницу dashboard:

1. app/(dashboard)/page.tsx:
   - Приветствие с именем пользователя
   - 4 карточки со статистикой:
     * Активных планировок
     * Генераций за месяц
     * Лидов за месяц
     * Осталось генераций
   - График генераций за последние 7 дней (заглушка)
   - Последние 5 генераций
   - Последние 5 лидов

2. Создай компоненты:
   - components/dashboard/StatsCard.tsx
   - components/dashboard/RecentGenerations.tsx
   - components/dashboard/RecentLeads.tsx

3. Используй Server Components для загрузки данных

Данные пока можно захардкодить, потом заменим на реальные запросы.
```

---

## Task 1.8: Settings Page (Basic)

```prompt
Создай базовую страницу настроек:

1. app/(dashboard)/settings/page.tsx:
   - Tabs: Профиль, Организация, Виджет

2. Tab "Профиль":
   - Имя
   - Email (readonly)
   - Кнопка смены пароля

3. Tab "Организация":
   - Название
   - Сайт
   - API Key (показать/скрыть, копировать)
   - Кнопка регенерации API key

4. Tab "Виджет" (пока заглушка):
   - Код для вставки на сайт
   - Предпросмотр настроек

5. Реализуй API routes:
   - PUT /api/v1/settings/profile
   - PUT /api/v1/settings/organization
   - POST /api/v1/settings/regenerate-api-key
```

---

## Чеклист Sprint 1

- [ ] Next.js проект инициализирован
- [ ] Tailwind + shadcn/ui настроены
- [ ] Supabase клиенты созданы
- [ ] Миграции базы данных готовы
- [ ] Аутентификация работает (login/register)
- [ ] Dashboard layout готов (sidebar, header)
- [ ] Organization context работает
- [ ] Dashboard home page с заглушками
- [ ] Базовые настройки работают
- [ ] API key можно скопировать

---

## Команды для проверки

```bash
# Запуск dev сервера
npm run dev

# Применить миграции (локально)
npx supabase db push

# Сгенерировать типы
npx supabase gen types typescript --local > lib/supabase/types.ts

# Проверить типы
npm run type-check
```

---

## Следующий шаг

После завершения Sprint 1 переходи к Sprint 2: Core Features (планировки, генерация, Gemini API).
