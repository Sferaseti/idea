# Sprint 4: Polish (Неделя 7-8)

## Цель
Добавить биллинг, CRM интеграции, аналитику и подготовить к продакшену.

---

## Task 4.1: Leads Management

```prompt
Создай полноценную страницу управления лидами:

1. app/(dashboard)/leads/page.tsx:
   - Таблица лидов с пагинацией
   - Колонки: дата, имя, телефон, email, планировка, стиль, CRM статус
   - Фильтры: период, CRM статус, планировка
   - Поиск по имени/телефону

2. Действия с лидами:
   - Просмотр деталей (модальное окно)
   - Повторная отправка в CRM
   - Экспорт в CSV

3. Детали лида:
   - Контактные данные
   - Изображение дизайна
   - UTM метки
   - История отправок в CRM
   - Дата создания

4. Статусы CRM с цветами:
   - pending → жёлтый
   - sent → зелёный
   - failed → красный (+ кнопка "Повторить")

5. API:
   - GET /api/v1/leads
   - GET /api/v1/leads/[id]
   - POST /api/v1/leads/[id]/resend
   - GET /api/v1/leads/export
```

---

## Task 4.2: CRM Integrations

```prompt
Реализуй интеграции с CRM:

1. lib/crm/bitrix24.ts:
   ```typescript
   export async function sendToBitrix24(config: BitrixConfig, lead: Lead) {
     const response = await fetch(`${config.webhook_url}crm.lead.add`, {
       method: 'POST',
       body: JSON.stringify({
         fields: {
           TITLE: `AI Design: ${lead.floor_plan_name}`,
           NAME: lead.name,
           PHONE: [{ VALUE: lead.phone, VALUE_TYPE: 'WORK' }],
           EMAIL: lead.email ? [{ VALUE: lead.email }] : [],
           SOURCE_ID: 'WEB',
           COMMENTS: `Стиль: ${lead.design_style}\nДизайн: ${lead.design_url}`,
           UF_CRM_XXX: lead.design_url, // custom field
         }
       })
     });
     return response.json();
   }
   ```

2. lib/crm/amocrm.ts:
   - OAuth авторизация
   - Создание лида
   - Обновление токенов

3. lib/crm/webhook.ts:
   - Универсальный webhook
   - POST с JSON body

4. lib/crm/send.ts:
   - Роутер по crm_type
   - Retry логика (3 попытки)
   - Сохранение результата в leads.crm_response

5. Страница настройки CRM:
   - app/(dashboard)/integrations/page.tsx
   - Выбор типа CRM
   - Форма настройки для каждого типа
   - Тестовая отправка
```

---

## Task 4.3: Billing & Subscriptions

```prompt
Реализуй систему биллинга:

1. Страница биллинга app/(dashboard)/billing/page.tsx:
   - Текущий план
   - Использование (генераций использовано/лимит)
   - Прогресс-бар
   - Кнопка "Улучшить план"

2. Тарифные планы:
   - Trial: 100 генераций бесплатно
   - Starter: 500/мес, 15000₽
   - Business: 2000/мес, 45000₽
   - Enterprise: безлимит, договорная

3. components/billing/PricingCards.tsx:
   - Карточки тарифов
   - Выделение текущего плана
   - Кнопки выбора

4. Интеграция с ЮKassa (для РФ):
   - lib/payments/yookassa.ts
   - Создание платежа
   - Webhook для подтверждения
   - POST /api/integrations/yookassa/webhook

5. Логика лимитов:
   - Проверка перед генерацией
   - Уведомление когда осталось < 20%
   - Блокировка при превышении

6. API:
   - GET /api/v1/billing
   - POST /api/v1/billing/checkout
   - POST /api/v1/billing/cancel
```

---

## Task 4.4: Analytics Dashboard

```prompt
Добавь аналитику на dashboard:

1. Обнови app/(dashboard)/page.tsx:
   - Реальные данные вместо заглушек
   - График генераций за 30 дней
   - График лидов за 30 дней
   - Конверсия (лиды / генерации)

2. components/dashboard/charts/:
   - GenerationsChart.tsx (Recharts Line)
   - LeadsChart.tsx (Recharts Bar)
   - ConversionChart.tsx (Recharts Area)

3. Метрики:
   - Всего генераций
   - Генераций сегодня/неделя/месяц
   - Всего лидов
   - Лидов сегодня/неделя/месяц
   - Конверсия %
   - Средняя стоимость лида

4. API:
   - GET /api/v1/analytics/overview
   - GET /api/v1/analytics/generations?period=30d
   - GET /api/v1/analytics/leads?period=30d

5. Фильтр периода:
   - 7 дней / 30 дней / 90 дней / Всё время
```

---

## Task 4.5: Notifications

```prompt
Добавь систему уведомлений:

1. Email уведомления (Resend или Postmark):
   - Новый лид
   - Лимит генераций < 20%
   - Лимит исчерпан
   - Оплата успешна/неуспешна

2. lib/notifications/email.ts:
   - Шаблоны писем
   - Функции отправки
   - Rate limiting

3. components/email-templates/:
   - NewLeadEmail.tsx (React Email)
   - LimitWarningEmail.tsx
   - PaymentEmail.tsx

4. Настройки уведомлений:
   - app/(dashboard)/settings → tab Уведомления
   - Email вкл/выкл для каждого типа
   - Дополнительные email адреса

5. In-app уведомления (опционально):
   - Bell icon в header
   - Dropdown со списком
   - Пометка прочитанных
```

---

## Task 4.6: Error Handling & Logging

```prompt
Улучши обработку ошибок и логирование:

1. lib/errors.ts:
   - Кастомные классы ошибок
   - AppError, ValidationError, AuthError
   - Коды ошибок

2. Глобальный error handler:
   - app/error.tsx
   - app/(dashboard)/error.tsx
   - Красивый UI ошибки
   - Кнопка "Попробовать снова"

3. API error handling:
   - lib/api/error-handler.ts
   - Единый формат ошибок
   - Логирование в консоль/Vercel

4. Логирование:
   - Все API запросы
   - Генерации (start, complete, fail)
   - Отправки в CRM
   - Платежи

5. Sentry интеграция (опционально):
   - Error tracking
   - Performance monitoring
```

---

## Task 4.7: SEO & Marketing Pages

```prompt
Создай маркетинговые страницы:

1. app/(marketing)/page.tsx - Landing:
   - Hero секция с CTA
   - Как это работает (3 шага)
   - Демо виджета
   - Преимущества
   - Тарифы
   - FAQ
   - Footer с контактами

2. app/(marketing)/pricing/page.tsx:
   - Детальные тарифы
   - Сравнительная таблица
   - FAQ по оплате

3. app/(marketing)/features/page.tsx:
   - Все возможности
   - Скриншоты интерфейса
   - Интеграции

4. components/marketing/:
   - Hero.tsx
   - Features.tsx
   - Pricing.tsx
   - FAQ.tsx
   - Footer.tsx

5. SEO:
   - Метатеги для каждой страницы
   - OpenGraph изображения
   - JSON-LD разметка
```

---

## Task 4.8: Production Readiness

```prompt
Подготовь проект к продакшену:

1. Environment variables:
   - Проверить все переменные
   - Создать .env.production
   - Документировать в README

2. Security checklist:
   - [ ] RLS включён на всех таблицах
   - [ ] API keys не в клиентском коде
   - [ ] Input validation на всех эндпоинтах
   - [ ] Rate limiting настроен
   - [ ] CORS настроен
   - [ ] CSP headers

3. Performance:
   - [ ] Изображения оптимизированы
   - [ ] Lazy loading
   - [ ] Bundle size < 200KB
   - [ ] Widget < 15KB

4. Monitoring:
   - Vercel Analytics
   - Error tracking (Sentry)
   - Uptime monitoring

5. Документация:
   - README.md обновлён
   - API документация
   - Инструкция по развёртыванию

6. Тесты (минимум):
   - API endpoints
   - Критические user flows
```

---

## Чеклист Sprint 4

- [ ] Управление лидами работает
- [ ] CRM интеграция (минимум 1)
- [ ] Биллинг настроен
- [ ] Аналитика на dashboard
- [ ] Email уведомления работают
- [ ] Обработка ошибок улучшена
- [ ] Landing page готов
- [ ] SEO настроен
- [ ] Security checklist пройден
- [ ] Документация готова

---

## Деплой на продакшен

```bash
# 1. Проверить типы
npm run type-check

# 2. Собрать проект
npm run build

# 3. Деплой на Vercel
vercel --prod

# 4. Применить миграции
npx supabase db push --db-url $PROD_DATABASE_URL

# 5. Проверить всё работает
curl https://app.aidesign.ru/api/health
```

---

## После запуска

1. Мониторинг первые 24 часа
2. Отслеживание ошибок в Sentry
3. Анализ производительности
4. Сбор обратной связи от пилотных клиентов
5. Итерации по UI/UX
