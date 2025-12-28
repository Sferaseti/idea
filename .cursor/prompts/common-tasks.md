# Common Tasks & Templates

## Quick Commands

### Создать новую страницу Dashboard

```prompt
Создай страницу [NAME] в dashboard:

1. app/(dashboard)/[name]/page.tsx
2. Использовать общий layout
3. Заголовок + описание
4. Server Component для загрузки данных
5. loading.tsx для skeleton
6. error.tsx для ошибок

Следуй паттернам существующих страниц.
```

### Создать API Route

```prompt
Создай API route [METHOD] /api/v1/[path]:

1. app/api/v1/[path]/route.ts
2. Валидация входных данных через Zod
3. Проверка аутентификации
4. Обработка ошибок
5. Типизированный response

Следуй спецификации из .cursor/context/api.md
```

### Создать компонент формы

```prompt
Создай форму [NAME]:

1. components/forms/[Name]Form.tsx
2. Zod схема валидации
3. react-hook-form
4. Поля: [список полей]
5. Обработка отправки
6. Состояния loading/error/success

Следуй паттернам из .cursor/rules/components.md
```

### Добавить таблицу в БД

```prompt
Добавь таблицу [NAME] в Supabase:

1. supabase/migrations/XXX_add_[name].sql
2. Определение таблицы с типами
3. Индексы
4. RLS политики
5. Обновить lib/supabase/types.ts

Следуй схеме из .cursor/context/database.md
```

---

## Code Templates

### Server Component с данными

```tsx
// app/(dashboard)/[resource]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ResourcePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: items, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to load data');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Title</h1>
        <Button>Action</Button>
      </div>

      <ResourceList items={items} />
    </div>
  );
}
```

### API Route с валидацией

```typescript
// app/api/v1/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const CreateSchema = z.object({
  name: z.string().min(2).max(100),
  // ... other fields
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('table_name')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = CreateSchema.parse(body);

    const { data: created, error } = await supabase
      .from('table_name')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### Form Component

```tsx
// components/forms/ExampleForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
});

type FormData = z.infer<typeof formSchema>;

interface ExampleFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
}

export function ExampleForm({ defaultValues, onSubmit }: ExampleFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      ...defaultValues,
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input placeholder="Введите имя" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </Form>
  );
}
```

### Loading Skeleton

```tsx
// app/(dashboard)/[resource]/loading.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-0">
              <Skeleton className="aspect-square w-full" />
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Error Boundary

```tsx
// app/(dashboard)/[resource]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Что-то пошло не так</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'Произошла ошибка при загрузке данных'}
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
```

### Custom Hook

```typescript
// lib/hooks/use-example.ts
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseExampleOptions {
  organizationId: string;
}

export function useExample({ organizationId }: UseExampleOptions) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('table_name')
          .select('*')
          .eq('organization_id', organizationId);

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [organizationId]);

  return { data, isLoading, error };
}
```

---

## Debugging

### Проверить Supabase подключение

```prompt
Проверь подключение к Supabase:

1. Создай тестовый API route GET /api/test-db
2. Выполни простой SELECT
3. Верни результат или ошибку
4. Проверь RLS политики
```

### Отладить API запрос

```prompt
Добавь отладочную информацию в API route [PATH]:

1. Логировать входящий запрос (headers, body)
2. Логировать user из сессии
3. Логировать запрос к БД
4. Логировать ответ
5. Логировать время выполнения
```

### Проверить виджет

```prompt
Создай тестовую страницу для виджета:

1. public/widget-test.html
2. Подключить widget.js локально
3. Добавить тестовое изображение
4. Console logging для отладки
```

---

## Database Operations

### Добавить колонку

```sql
-- supabase/migrations/XXX_add_column.sql
ALTER TABLE table_name
ADD COLUMN new_column VARCHAR(100);

-- Обновить RLS если нужно
-- Обновить типы: npx supabase gen types typescript
```

### Создать индекс

```sql
-- supabase/migrations/XXX_add_index.sql
CREATE INDEX idx_table_column ON table_name(column_name);

-- Для частых запросов с фильтрацией
CREATE INDEX idx_table_org_status ON table_name(organization_id, status);
```

### Seed данные

```sql
-- supabase/seed.sql
INSERT INTO design_styles (name, name_en, prompt_template, category)
VALUES
  ('Скандинавский', 'Scandinavian', '...', 'minimalist'),
  ('Современный', 'Modern', '...', 'modern');
```

---

## Git Workflow

### Создать feature branch

```bash
git checkout -b feature/[name]
git push -u origin feature/[name]
```

### Commit changes

```bash
git add .
git commit -m "feat: add [feature description]"
git push
```

### Merge to main

```bash
git checkout main
git pull
git merge feature/[name]
git push
```

---

## Quick Fixes

### Ошибка "Missing environment variable"

```prompt
Проверь все environment variables:
1. Вывести список необходимых переменных
2. Проверить .env.local
3. Проверить Vercel environment
4. Добавить недостающие
```

### Ошибка RLS

```prompt
Отладь RLS политику для таблицы [NAME]:
1. Показать текущие политики
2. Проверить auth.uid()
3. Проверить связи с organization_members
4. Исправить политику
```

### Ошибка типов

```prompt
Исправь ошибку TypeScript:
[вставить ошибку]

1. Проанализировать ошибку
2. Найти причину
3. Исправить типы
4. Проверить связанный код
```
