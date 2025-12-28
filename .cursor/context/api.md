# AI Design SaaS - API Documentation

## Overview

API разделено на 3 группы:

| Group | Base Path | Auth | Description |
|-------|-----------|------|-------------|
| Internal API | `/api/v1/*` | Supabase Session | Dashboard operations |
| Widget API | `/api/widget/*` | API Key Header | Widget operations |
| Collector API | `/api/collector/*` | Client ID in URL | Site scanning |

## Authentication

### Internal API (Dashboard)

Uses Supabase session cookie.

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
}
```

### Widget API

Uses API key in header.

```typescript
// Validation
async function validateApiKey(req: Request) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    throw new Error('API key required');
  }

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (!org) {
    throw new Error('Invalid API key');
  }

  // Validate domain
  const origin = req.headers.get('Origin');
  if (origin && org.allowed_domains.length > 0) {
    const domain = new URL(origin).hostname;
    if (!org.allowed_domains.includes(domain)) {
      throw new Error('Domain not allowed');
    }
  }

  return org;
}
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": "rooms",
      "reason": "Must be between 1 and 10"
    }
  }
}
```

## Rate Limiting

```typescript
// Rate limits per endpoint
const RATE_LIMITS = {
  'POST /api/widget/generate': { limit: 10, window: '1m', by: 'api_key' },
  'POST /api/collector/*/page': { limit: 60, window: '1m', by: 'client_id' },
  'POST /api/v1/*': { limit: 100, window: '1m', by: 'user_id' },
};
```

---

## Internal API (`/api/v1/*`)

### Organizations

#### GET `/api/v1/organizations`

Get current user's organizations.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ЖК Солнечный",
      "slug": "jk-solnechny",
      "role": "owner",
      "plan": "starter",
      "generations_remaining": 450
    }
  ]
}
```

#### GET `/api/v1/organizations/:id`

Get organization details.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "ЖК Солнечный",
    "slug": "jk-solnechny",
    "website_url": "https://solnechny.ru",
    "api_key": "adk_xxxx...xxxx",
    "allowed_domains": ["solnechny.ru", "www.solnechny.ru"],
    "widget_settings": { ... },
    "plan": "starter",
    "generations_limit": 500,
    "generations_used": 50,
    "total_generations": 234,
    "total_leads": 45
  }
}
```

#### PUT `/api/v1/organizations/:id`

Update organization.

**Request:**
```json
{
  "name": "ЖК Солнечный",
  "website_url": "https://solnechny.ru",
  "allowed_domains": ["solnechny.ru", "www.solnechny.ru"]
}
```

---

### Floor Plans

#### GET `/api/v1/floor-plans`

Get organization's floor plans.

**Query params:**
- `orgId` (required): Organization ID
- `status`: Filter by status (active, sold, hidden)
- `aiEnabled`: Filter by AI enabled (true/false)
- `search`: Search by name or code
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "external_id": "A-02-015",
      "name": "Двушка угловая",
      "rooms": 2,
      "area": 54.2,
      "price": 8500000,
      "original_image_url": "https://...",
      "cached_image_url": "https://...",
      "ai_enabled": true,
      "status": "active",
      "generations_count": 15,
      "leads_count": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 52
  }
}
```

#### POST `/api/v1/floor-plans`

Create floor plan.

**Request:**
```json
{
  "organization_id": "uuid",
  "external_id": "A-02-016",
  "name": "Трёшка стандарт",
  "rooms": 3,
  "area": 78.5,
  "price": 12500000,
  "original_image_url": "https://site.ru/plans/a-02-016.png",
  "building": "Корпус А",
  "floor": 15,
  "complex_name": "ЖК Солнечный"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    ...
  }
}
```

#### PUT `/api/v1/floor-plans/:id`

Update floor plan.

**Request:**
```json
{
  "name": "Трёшка стандарт (обновлено)",
  "price": 12800000,
  "ai_enabled": true,
  "status": "active"
}
```

#### DELETE `/api/v1/floor-plans/:id`

Delete floor plan.

#### POST `/api/v1/floor-plans/:id/activate`

Activate floor plan for AI design.

#### POST `/api/v1/floor-plans/:id/deactivate`

Deactivate floor plan.

---

### Generations

#### GET `/api/v1/generations`

Get generation history.

**Query params:**
- `orgId` (required): Organization ID
- `floorPlanId`: Filter by floor plan
- `status`: Filter by status
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`, `limit`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "floor_plan_id": "uuid",
      "floor_plan_name": "Двушка угловая",
      "style_name": "Скандинавский",
      "input_image_url": "https://...",
      "result_image_url": "https://...",
      "status": "completed",
      "generation_time_ms": 4500,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET `/api/v1/generations/:id`

Get single generation details.

---

### Leads

#### GET `/api/v1/leads`

Get captured leads.

**Query params:**
- `orgId` (required)
- `crmStatus`: Filter by CRM status
- `startDate`, `endDate`
- `page`, `limit`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Иван Петров",
      "phone": "+7 999 123-45-67",
      "email": "ivan@example.com",
      "floor_plan_name": "Двушка угловая",
      "design_style": "Скандинавский",
      "design_url": "https://...",
      "crm_status": "sent",
      "crm_lead_id": "12345",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ],
  "meta": { ... }
}
```

#### PUT `/api/v1/leads/:id`

Update lead (e.g., resend to CRM).

**Request:**
```json
{
  "crm_status": "pending"
}
```

---

### Settings

#### GET `/api/v1/settings/:orgId`

Get organization settings.

**Response:**
```json
{
  "data": {
    "widget": {
      "position": "bottom-right",
      "primaryColor": "#667eea",
      "theme": "light",
      "buttonText": "Создать дизайн"
    },
    "crm": {
      "type": "bitrix24",
      "webhook_url": "https://xxx.bitrix24.ru/rest/xxx/xxx/"
    },
    "notifications": {
      "email": true,
      "telegram": false
    }
  }
}
```

#### PUT `/api/v1/settings/:orgId`

Update settings.

---

## Widget API (`/api/widget/*`)

All endpoints require `X-API-Key` header.

### GET `/api/widget/config`

Get widget configuration.

**Response:**
```json
{
  "data": {
    "organization_name": "ЖК Солнечный",
    "widget_settings": {
      "position": "bottom-right",
      "primaryColor": "#667eea",
      "theme": "light",
      "buttonText": "Создать дизайн"
    },
    "styles": [
      {
        "id": "uuid",
        "name": "Скандинавский",
        "preview_image_url": "https://..."
      }
    ],
    "generations_remaining": 450
  }
}
```

### GET `/api/widget/floor-plans`

Get activated floor plans.

**Query params:**
- `pageUrl`: Filter by page URL

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "image_url": "https://...",
      "name": "Двушка угловая",
      "rooms": 2,
      "area": 54.2
    }
  ]
}
```

### GET `/api/widget/identify`

Identify floor plan by image URL.

**Query params:**
- `imageUrl`: Image URL to identify
- `pageUrl`: Page URL for context

**Response:**
```json
{
  "data": {
    "found": true,
    "floor_plan": {
      "id": "uuid",
      "name": "Двушка угловая",
      "rooms": 2,
      "area": 54.2
    }
  }
}
```

### POST `/api/widget/generate`

Generate design.

**Request:**
```json
{
  "floor_plan_id": "uuid",
  "style_id": "uuid",
  "custom_prompt": "Для семьи с ребёнком",
  "visitor_id": "anon_xxx"
}
```

**Response:**
```json
{
  "data": {
    "generation_id": "uuid",
    "status": "processing",
    "estimated_time_ms": 5000
  }
}
```

### GET `/api/widget/generation/:id`

Get generation status.

**Response (processing):**
```json
{
  "data": {
    "status": "processing",
    "progress": 60
  }
}
```

**Response (completed):**
```json
{
  "data": {
    "status": "completed",
    "result_image_url": "https://...",
    "generation_time_ms": 4500
  }
}
```

### POST `/api/widget/lead`

Submit lead.

**Request:**
```json
{
  "name": "Иван Петров",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "generation_id": "uuid",
  "floor_plan_id": "uuid",
  "utm_source": "google",
  "utm_medium": "cpc"
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "lead_id": "uuid"
  }
}
```

---

## Collector API (`/api/collector/*`)

### POST `/api/collector/:clientId/page`

Submit page data from site scanner.

**Request:**
```json
{
  "url": "https://site.ru/apartments/2-room",
  "title": "2-комнатные квартиры | ЖК Солнечный",
  "images": [
    {
      "src": "https://site.ru/plans/a-02-015.png",
      "alt": "Планировка 2-комнатной квартиры",
      "width": 800,
      "height": 750,
      "context": {
        "rooms": "2",
        "area": "54.2",
        "price": "8500000"
      }
    }
  ],
  "timestamp": 1705312200000
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "images_processed": 3
  }
}
```

### GET `/api/collector/:clientId/activated`

Get list of activated image URLs for this client.

**Response:**
```json
{
  "data": {
    "images": [
      "https://site.ru/plans/a-02-015.png",
      "https://site.ru/plans/a-02-016.png"
    ]
  }
}
```

---

## Integrations API (`/api/integrations/*`)

### POST `/api/integrations/bitrix24/webhook`

Bitrix24 webhook handler.

### POST `/api/integrations/amocrm/webhook`

AmoCRM webhook handler.

---

## Code Examples

### Generate Design (Full Flow)

```typescript
// app/api/widget/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { generateDesign } from '@/lib/gemini/generate';

const GenerateSchema = z.object({
  floor_plan_id: z.string().uuid(),
  style_id: z.string().uuid().optional(),
  custom_prompt: z.string().max(500).optional(),
  visitor_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Validate API key
    const org = await validateApiKey(req);

    // 2. Check limits
    if (org.generations_used >= org.generations_limit) {
      return NextResponse.json({
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Generation limit exceeded',
        }
      }, { status: 402 });
    }

    // 3. Parse and validate body
    const body = await req.json();
    const data = GenerateSchema.parse(body);

    // 4. Get floor plan
    const supabase = createServiceClient();
    const { data: floorPlan } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('id', data.floor_plan_id)
      .eq('organization_id', org.id)
      .eq('ai_enabled', true)
      .single();

    if (!floorPlan) {
      return NextResponse.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Floor plan not found',
        }
      }, { status: 404 });
    }

    // 5. Get style
    let stylePrompt = '';
    let styleName = '';
    if (data.style_id) {
      const { data: style } = await supabase
        .from('design_styles')
        .select('*')
        .eq('id', data.style_id)
        .single();

      if (style) {
        stylePrompt = style.prompt_template;
        styleName = style.name;
      }
    }

    // 6. Create generation record
    const { data: generation } = await supabase
      .from('generations')
      .insert({
        organization_id: org.id,
        floor_plan_id: floorPlan.id,
        input_image_url: floorPlan.cached_image_url || floorPlan.original_image_url,
        style_id: data.style_id,
        style_name: styleName,
        custom_prompt: data.custom_prompt,
        full_prompt: `${stylePrompt} ${data.custom_prompt || ''}`.trim(),
        status: 'processing',
        visitor_id: data.visitor_id,
        page_url: req.headers.get('Referer'),
      })
      .select()
      .single();

    // 7. Start generation (async)
    generateDesign(generation.id).catch(console.error);

    return NextResponse.json({
      data: {
        generation_id: generation.id,
        status: 'processing',
        estimated_time_ms: 5000,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        }
      }, { status: 400 });
    }

    console.error('Generate error:', error);
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }
    }, { status: 500 });
  }
}
```

### Submit Lead

```typescript
// app/api/widget/lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendToCRM } from '@/lib/crm/send';

const LeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  generation_id: z.string().uuid().optional(),
  floor_plan_id: z.string().uuid().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const org = await validateApiKey(req);
    const body = await req.json();
    const data = LeadSchema.parse(body);

    const supabase = createServiceClient();

    // Get floor plan details if provided
    let floorPlan = null;
    if (data.floor_plan_id) {
      const { data: fp } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('id', data.floor_plan_id)
        .single();
      floorPlan = fp;
    }

    // Get generation details if provided
    let generation = null;
    if (data.generation_id) {
      const { data: gen } = await supabase
        .from('generations')
        .select('*')
        .eq('id', data.generation_id)
        .single();
      generation = gen;
    }

    // Create lead
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        organization_id: org.id,
        generation_id: data.generation_id,
        floor_plan_id: data.floor_plan_id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        design_style: generation?.style_name,
        design_url: generation?.result_image_url,
        flat_id: floorPlan?.external_id,
        complex_name: floorPlan?.complex_name,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        page_url: req.headers.get('Referer'),
        crm_status: 'pending',
      })
      .select()
      .single();

    // Send to CRM asynchronously
    if (org.crm_type && org.crm_config) {
      sendToCRM(org, lead).catch(console.error);
    }

    return NextResponse.json({
      data: {
        success: true,
        lead_id: lead.id,
      }
    });

  } catch (error) {
    // Error handling...
  }
}
```
