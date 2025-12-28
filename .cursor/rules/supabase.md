# Supabase Development Rules

## Client Setup

### Server Components (App Router)

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookies in Server Components
          }
        },
      },
    }
  );
}
```

### Client Components

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Service Role (API Routes only)

```typescript
// lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

**IMPORTANT:** Never expose service role client to browser!

## Query Patterns

### Typed Queries

```typescript
// Always use typed queries
const supabase = createClient();

// Good - typed response
const { data: floorPlans, error } = await supabase
  .from('floor_plans')
  .select('*')
  .eq('organization_id', orgId);

// Type is: Database['public']['Tables']['floor_plans']['Row'][]
```

### Select with Relations

```typescript
// Join related data
const { data: generations } = await supabase
  .from('generations')
  .select(`
    *,
    floor_plan:floor_plans(id, name, rooms, area),
    style:design_styles(id, name)
  `)
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false });
```

### Insert

```typescript
// Single insert
const { data, error } = await supabase
  .from('floor_plans')
  .insert({
    organization_id: orgId,
    name: 'Двушка угловая',
    rooms: 2,
    area: 54.2,
    original_image_url: 'https://...',
  })
  .select()
  .single();

// Bulk insert
const { data, error } = await supabase
  .from('floor_plans')
  .insert([
    { organization_id: orgId, name: 'Plan 1', ... },
    { organization_id: orgId, name: 'Plan 2', ... },
  ])
  .select();
```

### Update

```typescript
const { data, error } = await supabase
  .from('floor_plans')
  .update({
    ai_enabled: true,
    status: 'active',
  })
  .eq('id', planId)
  .eq('organization_id', orgId) // Always include org check!
  .select()
  .single();
```

### Delete

```typescript
const { error } = await supabase
  .from('floor_plans')
  .delete()
  .eq('id', planId)
  .eq('organization_id', orgId); // Always include org check!
```

### Upsert

```typescript
// Upsert by unique constraint
const { data, error } = await supabase
  .from('crawled_images')
  .upsert(
    {
      organization_id: orgId,
      src: imageUrl,
      width: 800,
      height: 600,
      last_seen: new Date().toISOString(),
    },
    {
      onConflict: 'organization_id,src',
    }
  )
  .select()
  .single();
```

## RLS Policies

### Organization-Scoped Access

```sql
-- Standard pattern for org-scoped tables
CREATE POLICY "Users can access own org data"
  ON floor_plans
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Role-Based Access

```sql
-- Owner-only operations
CREATE POLICY "Only owners can delete"
  ON organizations
  FOR DELETE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

### Public Access for Widget

```sql
-- Allow public read for active floor plans (widget API validates key)
CREATE POLICY "Public can read active plans"
  ON floor_plans
  FOR SELECT
  USING (
    ai_enabled = true
    AND status = 'active'
  );
```

## Storage

### Bucket Setup

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('floor-plans', 'floor-plans', true),
  ('generations', 'generations', true);

-- Policies
CREATE POLICY "Anyone can view floor plan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'floor-plans');

CREATE POLICY "Org members can upload floor plans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'floor-plans'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

### Upload Pattern

```typescript
// lib/supabase/storage.ts
export async function uploadFloorPlan(
  orgId: string,
  file: File
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split('.').pop();
  const filename = `${orgId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('floor-plans')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from('floor-plans')
    .getPublicUrl(filename);

  return publicUrl.publicUrl;
}
```

### Image Transforms

```typescript
// Generate thumbnail
const thumbnailUrl = supabase.storage
  .from('generations')
  .getPublicUrl(filename, {
    transform: {
      width: 300,
      height: 300,
      resize: 'cover',
    },
  });
```

## Realtime

### Subscribe to Generation Status

```typescript
// components/widget/GenerationView.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GenerationView({ generationId }: { generationId: string }) {
  const [status, setStatus] = useState<string>('processing');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generations',
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          const generation = payload.new;
          setStatus(generation.status);
          if (generation.result_image_url) {
            setResultUrl(generation.result_image_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [generationId]);

  // Render based on status...
}
```

## Auth

### Sign Up / Sign In

```typescript
// Auth actions
export async function signUp(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}
```

### Auth Callback

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
```

### Protected Routes

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## Type Generation

```bash
# Generate types from database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts

# Or from local database
npx supabase gen types typescript --local > lib/supabase/types.ts
```

### Using Types

```typescript
// lib/supabase/types.ts (generated)
export type Database = {
  public: {
    Tables: {
      floor_plans: {
        Row: { ... }
        Insert: { ... }
        Update: { ... }
      }
      // ...
    }
  }
}

// Usage
import { Database } from '@/lib/supabase/types';

type FloorPlan = Database['public']['Tables']['floor_plans']['Row'];
type FloorPlanInsert = Database['public']['Tables']['floor_plans']['Insert'];
```

## Error Handling

```typescript
// Always handle errors
const { data, error } = await supabase
  .from('floor_plans')
  .select('*')
  .eq('id', id)
  .single();

if (error) {
  if (error.code === 'PGRST116') {
    // Not found
    return notFound();
  }
  console.error('Database error:', error);
  throw new Error('Failed to fetch floor plan');
}

// data is typed and non-null here
return data;
```

## Common Patterns

### Get User's Organizations

```typescript
async function getUserOrganizations(userId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations(*)
    `)
    .eq('user_id', userId);

  return data?.map(m => ({
    ...m.organization,
    role: m.role,
  })) ?? [];
}
```

### Pagination

```typescript
async function getFloorPlans(orgId: string, page = 1, limit = 20) {
  const supabase = createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('floor_plans')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}
```

### Full-Text Search

```typescript
// Search floor plans
const { data } = await supabase
  .from('floor_plans')
  .select('*')
  .eq('organization_id', orgId)
  .or(`name.ilike.%${query}%,external_id.ilike.%${query}%`);
```
