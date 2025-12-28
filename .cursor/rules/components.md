# UI Components Development Rules

## Stack

- **UI Library**: shadcn/ui (copy-paste components)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: react-hook-form + zod
- **Tables**: @tanstack/react-table
- **Charts**: Recharts

## shadcn/ui Setup

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card dialog form input label select table tabs toast
```

## Component Patterns

### Basic Component Structure

```tsx
// components/dashboard/FloorPlanCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Trash } from 'lucide-react';
import Image from 'next/image';

interface FloorPlanCardProps {
  plan: {
    id: string;
    name: string;
    rooms: number;
    area: number;
    original_image_url: string;
    ai_enabled: boolean;
    generations_count: number;
  };
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FloorPlanCard({ plan, onView, onDelete }: FloorPlanCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <Image
            src={plan.original_image_url}
            alt={plan.name}
            fill
            className="object-cover"
          />
          {plan.ai_enabled && (
            <Badge className="absolute top-2 right-2">AI</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {plan.rooms} комн. · {plan.area} м²
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {plan.generations_count} генераций
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onView?.(plan.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Просмотр
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(plan.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Form Components

```tsx
// components/forms/FloorPlanForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100),
  external_id: z.string().optional(),
  rooms: z.coerce.number().min(1).max(10),
  area: z.coerce.number().min(10).max(500),
  price: z.coerce.number().optional(),
  ai_enabled: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface FloorPlanFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function FloorPlanForm({
  defaultValues,
  onSubmit,
  isLoading,
}: FloorPlanFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rooms: 1,
      area: 0,
      ai_enabled: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="Двушка угловая" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Комнат</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Площадь, м²</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена, ₽</FormLabel>
              <FormControl>
                <Input type="number" placeholder="8500000" {...field} />
              </FormControl>
              <FormDescription>
                Опционально, для отображения в виджете
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ai_enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">AI-дизайн</FormLabel>
                <FormDescription>
                  Разрешить генерацию дизайна для этой планировки
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </Form>
  );
}
```

### Data Table

```tsx
// components/dashboard/LeadsTable.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatPhone } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  floor_plan_name: string;
  design_style: string;
  crm_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'name',
    header: 'Имя',
  },
  {
    accessorKey: 'phone',
    header: 'Телефон',
    cell: ({ row }) => formatPhone(row.getValue('phone')),
  },
  {
    accessorKey: 'floor_plan_name',
    header: 'Планировка',
  },
  {
    accessorKey: 'design_style',
    header: 'Стиль',
  },
  {
    accessorKey: 'crm_status',
    header: 'CRM',
    cell: ({ row }) => {
      const status = row.getValue('crm_status') as string;
      const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
        pending: 'secondary',
        sent: 'default',
        failed: 'destructive',
      };
      return <Badge variant={variants[status]}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Дата',
    cell: ({ row }) => formatDate(row.getValue('created_at')),
  },
];

interface LeadsTableProps {
  data: Lead[];
}

export function LeadsTable({ data }: LeadsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
```

### Dialog / Modal

```tsx
// components/dashboard/DeleteDialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Удалить?',
  description = 'Это действие нельзя отменить.',
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Loading States

```tsx
// components/ui/skeleton-card.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}

// Usage
export function FloorPlansGrid({ plans, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <FloorPlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
```

### Empty State

```tsx
// components/ui/empty-state.tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

// Usage
import { ImageIcon } from 'lucide-react';

<EmptyState
  icon={ImageIcon}
  title="Нет планировок"
  description="Добавьте первую планировку, чтобы начать генерировать дизайны"
  action={{
    label: 'Добавить планировку',
    onClick: () => router.push('/floor-plans/new'),
  }}
/>
```

## Layout Components

### Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
```

### Sidebar

```tsx
// components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Image,
  Sparkles,
  Users,
  Settings,
  CreditCard,
} from 'lucide-react';

const navigation = [
  { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Планировки', href: '/floor-plans', icon: Image },
  { name: 'Генерации', href: '/generations', icon: Sparkles },
  { name: 'Лиды', href: '/leads', icon: Users },
  { name: 'Биллинг', href: '/billing', icon: CreditCard },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-6">
        <h1 className="text-xl font-bold">AI Design</h1>
      </div>
      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

## Toast Notifications

```tsx
// lib/toast.ts
import { toast } from 'sonner';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};

// Usage
import { showToast } from '@/lib/toast';

async function handleDelete(id: string) {
  showToast.promise(
    deletePlan(id),
    {
      loading: 'Удаление...',
      success: 'Планировка удалена',
      error: 'Ошибка удаления',
    }
  );
}
```

## Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

export function formatArea(area: number) {
  return `${area} м²`;
}
```
