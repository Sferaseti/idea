# AI Design SaaS

AI-генератор дизайна интерьеров для сайтов застройщиков.

## Описание

Платформа позволяет застройщикам встраивать AI-виджет на свои сайты. Посетители могут создавать визуализации дизайна интерьера по планировкам квартир и оставлять заявки.

## Возможности

- **Встраиваемый виджет** — одна строка кода для установки
- **AI-генерация дизайна** — через Google Gemini API
- **Автосканирование** — автоматический сбор планировок с сайта
- **CRM интеграции** — Bitrix24, AmoCRM, Webhook
- **Аналитика** — статистика генераций и лидов

## Технологии

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Google Gemini API
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/ai-design-saas.git
cd ai-design-saas
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

```bash
cp .env.example .env.local
# Заполните переменные в .env.local
```

### 4. Запуск Supabase (локально)

```bash
npx supabase start
npx supabase db push
```

### 5. Запуск dev-сервера

```bash
npm run dev
```

Открыть http://localhost:3000

## Структура проекта

```
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Публичные страницы
│   ├── (dashboard)/        # Защищённые страницы
│   ├── api/                # API Routes
│   └── widget/             # Widget UI
├── components/             # React компоненты
│   ├── ui/                 # shadcn/ui
│   ├── dashboard/          # Dashboard компоненты
│   └── widget/             # Widget компоненты
├── lib/                    # Утилиты и хелперы
│   ├── supabase/           # Supabase клиенты
│   ├── gemini/             # Gemini API
│   └── crm/                # CRM интеграции
├── supabase/               # Supabase миграции
├── public/                 # Статика
│   └── widget.js           # Embed скрипт
└── docs/                   # Документация
```

## Документация

- [Техническое задание](docs/TECHNICAL_SPECIFICATION.md)
- [Архитектура](.cursor/context/architecture.md)
- [Схема базы данных](.cursor/context/database.md)
- [API документация](.cursor/context/api.md)

## Разработка

### Команды

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Supabase migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > lib/supabase/types.ts

# Build widget
npm run build:widget
```

### Спринты разработки

1. **Sprint 1**: Foundation (Auth, Layout, DB)
2. **Sprint 2**: Core (Floor Plans, Gemini, Generations)
3. **Sprint 3**: Widget (Embed, UI, Leads)
4. **Sprint 4**: Polish (Billing, CRM, Analytics)

Подробные инструкции в `.cursor/prompts/`

## Установка виджета

```html
<script
  src="https://app.aidesign.ru/widget.js"
  data-key="YOUR_API_KEY"
  data-position="bottom-right"
  data-color="#667eea"
></script>
```

## Деплой

### Vercel

```bash
vercel --prod
```

### Environment Variables

Добавьте в Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Лицензия

Proprietary. All rights reserved.

## Контакты

- Email: support@aidesign.ru
- Telegram: @aidesign_support
