# AI Design SaaS - Database Schema

## Overview

База данных на Supabase (PostgreSQL) с 11 основными таблицами.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    │
│  │organizations │ ──────► │ floor_plans  │ ──────► │ generations  │    │
│  └──────────────┘         └──────────────┘         └──────────────┘    │
│         │                        │                        │             │
│         │                        │                        │             │
│         ▼                        ▼                        ▼             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    │
│  │org_members   │         │crawled_images│         │    leads     │    │
│  └──────────────┘         └──────────────┘         └──────────────┘    │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    │
│  │    users     │         │design_styles │         │subscriptions │    │
│  └──────────────┘         └──────────────┘         └──────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tables

### 1. organizations

Клиенты SaaS (застройщики).

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Основная информация
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,

  -- API доступ
  api_key VARCHAR(64) UNIQUE NOT NULL DEFAULT generate_api_key(),
  api_secret VARCHAR(64) DEFAULT generate_api_secret(),
  allowed_domains TEXT[] DEFAULT '{}',

  -- Виджет
  widget_settings JSONB DEFAULT '{
    "position": "bottom-right",
    "primaryColor": "#667eea",
    "theme": "light",
    "showBadge": true,
    "buttonText": "Создать дизайн"
  }'::jsonb,

  -- Лимиты и биллинг
  plan VARCHAR(50) DEFAULT 'trial',
  generations_limit INTEGER DEFAULT 100,
  generations_used INTEGER DEFAULT 0,
  billing_cycle_start TIMESTAMP WITH TIME ZONE,

  -- CRM интеграция
  crm_type VARCHAR(50),  -- bitrix24, amocrm, webhook
  crm_config JSONB DEFAULT '{}'::jsonb,

  -- Статистика
  total_generations INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_organizations_api_key ON organizations(api_key);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Функция генерации API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN 'adk_' || encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;
```

### 2. organization_members

Связь пользователей с организациями.

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
```

### 3. floor_plans

Планировки квартир.

```sql
CREATE TABLE floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Идентификация
  external_id VARCHAR(255),
  internal_code VARCHAR(100),

  -- Изображение
  original_image_url TEXT NOT NULL,
  cached_image_url TEXT,
  image_hash VARCHAR(64),
  image_width INTEGER,
  image_height INTEGER,

  -- Метаданные квартиры
  name VARCHAR(255),
  rooms SMALLINT,
  area DECIMAL(10, 2),
  living_area DECIMAL(10, 2),
  floor SMALLINT,
  building VARCHAR(100),
  section VARCHAR(100),
  complex_name VARCHAR(255),
  price DECIMAL(15, 2),
  price_per_meter DECIMAL(15, 2),

  -- Связь с сайтом
  page_url TEXT,

  -- Статусы
  status VARCHAR(50) DEFAULT 'active',  -- active, sold, reserved, hidden
  ai_enabled BOOLEAN DEFAULT TRUE,

  -- Источник данных
  source VARCHAR(50) DEFAULT 'manual',  -- manual, crawler, api, data_attribute

  -- Статистика
  views_count INTEGER DEFAULT 0,
  generations_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,

  -- AI скоринг
  floor_plan_score DECIMAL(3, 2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  UNIQUE(organization_id, external_id),
  UNIQUE(organization_id, image_hash)
);

CREATE INDEX idx_floor_plans_org ON floor_plans(organization_id);
CREATE INDEX idx_floor_plans_status ON floor_plans(organization_id, status, ai_enabled);
CREATE INDEX idx_floor_plans_hash ON floor_plans(image_hash);
```

### 4. design_styles

Предустановленные стили дизайна.

```sql
CREATE TABLE design_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Информация
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,

  -- Промт для AI
  prompt_template TEXT NOT NULL,

  -- Визуализация
  preview_image_url TEXT,
  color_palette TEXT[],

  -- Категоризация
  category VARCHAR(50),  -- modern, classic, ethnic, minimalist
  tags TEXT[] DEFAULT '{}',

  -- Доступность
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,

  -- Сортировка
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Предзаполненные стили
INSERT INTO design_styles (name, name_en, prompt_template, category) VALUES
('Скандинавский', 'Scandinavian', 'скандинавский минимализм, светлые тона, натуральное дерево, простые формы, много света', 'minimalist'),
('Современный', 'Modern', 'современный интерьер, чистые линии, нейтральные цвета, функциональная мебель', 'modern'),
('Лофт', 'Loft', 'стиль лофт, кирпичные стены, индустриальные элементы, открытое пространство, металл и дерево', 'modern'),
('Классический', 'Classic', 'классический интерьер, элегантная мебель, лепнина, тёплые тона, паркет', 'classic'),
('Минимализм', 'Minimalism', 'строгий минимализм, белый цвет, минимум декора, встроенная мебель, скрытые системы хранения', 'minimalist'),
('Японский', 'Japanese', 'японский стиль, низкая мебель, натуральные материалы, бамбук, раздвижные перегородки', 'ethnic'),
('Эко', 'Eco', 'эко-стиль, живые растения, натуральные материалы, дерево, камень, зелёные акценты', 'modern'),
('Хай-тек', 'Hi-Tech', 'хай-тек, футуристичный дизайн, глянцевые поверхности, скрытая подсветка, технологичность', 'modern');
```

### 5. generations

История генераций дизайна.

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,

  -- Входные данные
  input_image_url TEXT NOT NULL,
  style_id UUID REFERENCES design_styles(id),
  style_name VARCHAR(100),
  custom_prompt TEXT,
  full_prompt TEXT,

  -- Результат
  result_image_url TEXT,
  thumbnail_url TEXT,

  -- Статус
  status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,

  -- Метаданные
  model_used VARCHAR(100),
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Контекст запроса
  visitor_id VARCHAR(100),
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_generations_org ON generations(organization_id);
CREATE INDEX idx_generations_floor_plan ON generations(floor_plan_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
```

### 6. leads

Захваченные лиды.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,

  -- Контактные данные
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),

  -- Контекст
  design_style VARCHAR(100),
  design_url TEXT,
  flat_id VARCHAR(100),
  complex_name VARCHAR(255),

  -- UTM метки
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),

  -- Источник
  page_url TEXT,
  referrer TEXT,

  -- CRM интеграция
  crm_status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
  crm_lead_id VARCHAR(100),
  crm_response JSONB,
  crm_sent_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_crm_status ON leads(crm_status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

### 7. crawled_pages

Страницы, обнаруженные краулером.

```sql
CREATE TABLE crawled_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  title VARCHAR(500),

  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,

  UNIQUE(organization_id, url)
);

CREATE INDEX idx_crawled_pages_org ON crawled_pages(organization_id);
```

### 8. crawled_images

Изображения, найденные на сайте клиента.

```sql
CREATE TABLE crawled_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- URL и метаданные
  src TEXT NOT NULL,
  alt TEXT,
  width INTEGER,
  height INTEGER,

  -- Автоматически извлечённый контекст
  context_rooms VARCHAR(10),
  context_area VARCHAR(20),
  context_price VARCHAR(50),
  context_text TEXT,

  -- AI-скоринг
  floor_plan_score DECIMAL(3, 2),

  -- Статус
  is_activated BOOLEAN DEFAULT FALSE,
  linked_floor_plan_id UUID REFERENCES floor_plans(id),

  -- Tracking
  seen_count INTEGER DEFAULT 1,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, src)
);

CREATE INDEX idx_crawled_images_org ON crawled_images(organization_id);
CREATE INDEX idx_crawled_images_activated ON crawled_images(organization_id, is_activated);
CREATE INDEX idx_crawled_images_score ON crawled_images(organization_id, floor_plan_score DESC);
```

### 9. crawled_image_pages

Связь изображений со страницами.

```sql
CREATE TABLE crawled_image_pages (
  image_id UUID REFERENCES crawled_images(id) ON DELETE CASCADE,
  page_id UUID REFERENCES crawled_pages(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, page_id)
);
```

### 10. subscriptions

Подписки и биллинг.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- План
  plan VARCHAR(50) NOT NULL,  -- trial, starter, business, enterprise

  -- Период
  status VARCHAR(50) DEFAULT 'active',  -- active, cancelled, past_due, expired
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Платёжная система
  provider VARCHAR(50),  -- stripe, yookassa
  provider_subscription_id VARCHAR(255),
  provider_customer_id VARCHAR(255),

  -- Лимиты
  generations_limit INTEGER,
  generations_used INTEGER DEFAULT 0,

  -- Цена
  price_monthly DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'RUB',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 11. payments

История платежей.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),

  -- Сумма
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',

  -- Статус
  status VARCHAR(50) DEFAULT 'pending',  -- pending, completed, failed, refunded

  -- Платёжная система
  provider VARCHAR(50),
  provider_payment_id VARCHAR(255),
  provider_response JSONB,

  -- Описание
  description TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_status ON payments(status);
```

## Row Level Security (RLS)

### Organizations

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои организации
CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Только owner может обновлять
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

### Floor Plans

```sql
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;

-- Просмотр планировок своей организации
CREATE POLICY "Members can view org floor plans"
  ON floor_plans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Создание планировок
CREATE POLICY "Members can create floor plans"
  ON floor_plans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Обновление планировок
CREATE POLICY "Members can update floor plans"
  ON floor_plans FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Generations

```sql
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org generations"
  ON generations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Leads

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org leads"
  ON leads FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update org leads"
  ON leads FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

## Triggers

### Updated At

```sql
-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER floor_plans_updated_at
  BEFORE UPDATE ON floor_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Generation Counter

```sql
-- Увеличение счётчика генераций
CREATE OR REPLACE FUNCTION increment_generation_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE organizations
    SET generations_used = generations_used + 1,
        total_generations = total_generations + 1
    WHERE id = NEW.organization_id;

    IF NEW.floor_plan_id IS NOT NULL THEN
      UPDATE floor_plans
      SET generations_count = generations_count + 1
      WHERE id = NEW.floor_plan_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generations_counter
  AFTER UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION increment_generation_counter();
```

### Lead Counter

```sql
-- Увеличение счётчика лидов
CREATE OR REPLACE FUNCTION increment_lead_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations
  SET total_leads = total_leads + 1
  WHERE id = NEW.organization_id;

  IF NEW.floor_plan_id IS NOT NULL THEN
    UPDATE floor_plans
    SET leads_count = leads_count + 1
    WHERE id = NEW.floor_plan_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_counter
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION increment_lead_counter();
```

## Common Queries

### Get Floor Plans with Stats

```sql
SELECT
  fp.*,
  COUNT(DISTINCT g.id) as generations_count,
  COUNT(DISTINCT l.id) as leads_count
FROM floor_plans fp
LEFT JOIN generations g ON g.floor_plan_id = fp.id
LEFT JOIN leads l ON l.floor_plan_id = fp.id
WHERE fp.organization_id = $1
  AND fp.ai_enabled = true
  AND fp.status = 'active'
GROUP BY fp.id
ORDER BY fp.created_at DESC;
```

### Get Dashboard Stats

```sql
SELECT
  (SELECT COUNT(*) FROM floor_plans WHERE organization_id = $1 AND ai_enabled = true) as active_plans,
  (SELECT COUNT(*) FROM generations WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '30 days') as monthly_generations,
  (SELECT COUNT(*) FROM leads WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '30 days') as monthly_leads,
  (SELECT generations_limit - generations_used FROM organizations WHERE id = $1) as generations_remaining;
```

### Get Recent Generations

```sql
SELECT
  g.*,
  fp.name as floor_plan_name,
  fp.rooms,
  fp.area
FROM generations g
LEFT JOIN floor_plans fp ON fp.id = g.floor_plan_id
WHERE g.organization_id = $1
ORDER BY g.created_at DESC
LIMIT 50;
```
