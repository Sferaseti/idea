# AI Design SaaS - System Architecture

## Overview

Платформа состоит из 4 основных компонентов:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              АРХИТЕКТУРА                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      1. DASHBOARD APP                            │   │
│  │                         (Next.js)                                │   │
│  │  • Лендинг / Маркетинг                                          │   │
│  │  • Личный кабинет клиента                                       │   │
│  │  • Управление планировками                                       │   │
│  │  • Биллинг и аналитика                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      2. BACKEND API                              │   │
│  │                   (Next.js API Routes)                           │   │
│  │  • /api/v1/* - Внутренний API                                   │   │
│  │  • /api/widget/* - Публичный API виджета                        │   │
│  │  • /api/collector/* - Сбор данных с сайтов                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                    ┌───────────────┴───────────────┐                   │
│                    ▼                               ▼                    │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐   │
│  │   3. EMBED WIDGET       │    │      4. DATA LAYER              │   │
│  │   (Vanilla JS ~12KB)    │    │                                 │   │
│  │                         │    │  ┌───────────────────────────┐  │   │
│  │  • widget.js (embed)    │    │  │      Supabase             │  │   │
│  │  • Widget UI (iframe)   │    │  │  • PostgreSQL (данные)    │  │   │
│  │  • Форма лидов          │    │  │  • Auth (аутентификация)  │  │   │
│  │  • Генерация дизайна    │    │  │  • Storage (изображения)  │  │   │
│  └─────────────────────────┘    │  │  • Realtime (статусы)     │  │   │
│                                  │  └───────────────────────────┘  │   │
│                                  │                                 │   │
│                                  │  ┌───────────────────────────┐  │   │
│                                  │  │      Gemini API           │  │   │
│                                  │  │  • Генерация дизайна      │  │   │
│                                  │  │  • Анализ планировок      │  │   │
│                                  │  └───────────────────────────┘  │   │
│                                  └─────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Dashboard App (Next.js)

```
app/
├── (marketing)/              # Публичные страницы
│   ├── page.tsx              # Лендинг
│   ├── pricing/page.tsx      # Тарифы
│   ├── features/page.tsx     # Возможности
│   └── layout.tsx            # Marketing layout
│
├── (dashboard)/              # Защищённые страницы
│   ├── layout.tsx            # Dashboard layout с sidebar
│   ├── page.tsx              # Redirect to org
│   └── [orgId]/              # Организация
│       ├── page.tsx          # Dashboard home
│       ├── floor-plans/      # Планировки
│       │   ├── page.tsx      # Список
│       │   └── [id]/page.tsx # Детали
│       ├── generations/      # История генераций
│       ├── leads/            # Лиды
│       ├── widget/           # Настройки виджета
│       ├── integrations/     # CRM интеграции
│       ├── billing/          # Биллинг
│       └── settings/         # Настройки
│
├── widget/                   # Widget UI (iframe)
│   ├── page.tsx              # Генератор дизайна
│   └── layout.tsx            # Minimal layout
│
└── auth/                     # Auth pages
    ├── login/page.tsx
    ├── register/page.tsx
    └── callback/route.ts
```

### 2. Backend API

```
app/api/
├── v1/                           # Internal API (auth required)
│   ├── organizations/
│   │   ├── route.ts              # GET, POST
│   │   └── [id]/route.ts         # GET, PUT, DELETE
│   │
│   ├── floor-plans/
│   │   ├── route.ts              # GET (list), POST (create)
│   │   ├── [id]/route.ts         # GET, PUT, DELETE
│   │   └── [id]/activate/route.ts
│   │
│   ├── generations/
│   │   ├── route.ts              # GET (history)
│   │   └── [id]/route.ts         # GET (single)
│   │
│   ├── leads/
│   │   ├── route.ts              # GET (list)
│   │   └── [id]/route.ts         # GET, PUT
│   │
│   └── settings/
│       └── route.ts              # GET, PUT
│
├── widget/                       # Public Widget API (API key)
│   ├── config/route.ts           # GET - widget config
│   ├── floor-plans/route.ts      # GET - activated plans
│   ├── generate/route.ts         # POST - generate design
│   ├── lead/route.ts             # POST - submit lead
│   └── identify/route.ts         # GET - identify image
│
├── collector/                    # Site Crawler API
│   └── [clientId]/
│       ├── page/route.ts         # POST - page data
│       └── activated/route.ts    # GET - activated images
│
└── integrations/                 # Webhooks
    ├── bitrix24/route.ts
    └── amocrm/route.ts
```

### 3. Embed Widget

```
widget/
├── embed/                        # Embed script
│   ├── widget.ts                 # Main entry
│   ├── collector.ts              # Site scanner
│   ├── ui.ts                     # UI elements
│   └── api.ts                    # API client
│
├── iframe/                       # Widget UI (React)
│   ├── App.tsx
│   ├── components/
│   │   ├── StyleSelector.tsx
│   │   ├── PromptInput.tsx
│   │   ├── GenerationView.tsx
│   │   └── LeadForm.tsx
│   └── hooks/
│       ├── use-generation.ts
│       └── use-parent-comm.ts
│
└── build/
    └── widget.js                 # Final bundle (~12KB)
```

## Data Flow

### Generation Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visitor   │ ──► │   Widget    │ ──► │  Backend    │ ──► │  Gemini AI  │
│  clicks btn │     │  captures   │     │  validates  │     │  generates  │
│             │     │  prompt     │     │  & queues   │     │  design     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │                    │
                                               ▼                    │
                                        ┌─────────────┐            │
                                        │  Supabase   │ ◄──────────┘
                                        │  Storage    │
                                        └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visitor   │ ◄── │   Widget    │ ◄── │  Realtime   │
│  sees result│     │  displays   │     │  update     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Lead Capture Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visitor   │ ──► │   Widget    │ ──► │  Backend    │ ──► │  Database   │
│  fills form │     │  submits    │     │  validates  │     │  stores     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  CRM API    │
                                        │  (Bitrix24) │
                                        └─────────────┘
```

### Site Scanning Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Site page  │ ──► │  widget.js  │ ──► │  Collector  │ ──► │  Database   │
│  loads      │     │  scans DOM  │     │  API        │     │  stores     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │  AI scores  │
                                                            │  images     │
                                                            └─────────────┘
```

## Security Layers

### 1. Authentication
- **Dashboard**: Supabase Auth (email/password, magic link)
- **Widget API**: API key in `X-API-Key` header
- **Collector API**: Client ID in URL path

### 2. Authorization
- **RLS Policies**: All database access through RLS
- **Organization Scope**: Users can only access their org data
- **API Key Validation**: Each request validates key + domain

### 3. Rate Limiting
```typescript
// Rate limits per endpoint
const LIMITS = {
  '/api/widget/generate': '10/minute per API key',
  '/api/collector/*/page': '60/minute per client',
  '/api/v1/*': '100/minute per user',
};
```

### 4. Input Validation
```typescript
// All inputs validated with Zod
const GenerateSchema = z.object({
  floorPlanId: z.string().uuid(),
  style: z.string().min(1).max(100),
  prompt: z.string().max(500).optional(),
});
```

## Environment Configuration

### Development
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
NEXT_PUBLIC_APP_URL=https://app.aidesign.ru
```

## Deployment

### Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["fra1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Database Migrations
```bash
# Push migrations to production
npx supabase db push --db-url $SUPABASE_DB_URL

# Generate TypeScript types
npx supabase gen types typescript --project-id $PROJECT_ID > lib/supabase/types.ts
```

## Monitoring

### Key Metrics
- **Generation time**: < 10 seconds (95th percentile)
- **API latency**: < 200ms (p99)
- **Error rate**: < 0.1%
- **Widget load time**: < 500ms

### Logging
- Vercel Logs for API requests
- Supabase Logs for database queries
- Custom events for business metrics
