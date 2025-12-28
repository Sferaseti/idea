# Sprint 2: Core Features (Неделя 3-4)

## Цель
Реализовать основной функционал: управление планировками, интеграция с Gemini API, генерация дизайна.

---

## Task 2.1: Floor Plans List Page

```prompt
Создай страницу списка планировок:

1. app/(dashboard)/floor-plans/page.tsx:
   - Заголовок "Планировки" + кнопка "Добавить"
   - Фильтры: статус (все/активные/проданные), AI (все/включён/выключен), поиск
   - Grid планировок (3 колонки на десктопе)
   - Пагинация

2. components/dashboard/FloorPlanCard.tsx:
   - Изображение планировки
   - Badge "AI" если ai_enabled
   - Название, комнаты, площадь
   - Счётчик генераций
   - Меню действий: редактировать, удалить, вкл/выкл AI

3. API routes:
   - GET /api/v1/floor-plans (с фильтрами и пагинацией)
   - DELETE /api/v1/floor-plans/[id]
   - POST /api/v1/floor-plans/[id]/toggle-ai

4. Пустое состояние с призывом добавить первую планировку

Загружай данные на сервере (Server Component).
```

---

## Task 2.2: Add/Edit Floor Plan

```prompt
Создай форму добавления/редактирования планировки:

1. app/(dashboard)/floor-plans/new/page.tsx:
   - Форма создания планировки
   - Загрузка изображения (drag & drop)
   - Поля: название, внешний ID, комнаты, площадь, цена, корпус, этаж
   - Switch "Активировать AI"

2. app/(dashboard)/floor-plans/[id]/edit/page.tsx:
   - Та же форма, но с предзаполненными данными
   - Возможность заменить изображение

3. components/forms/FloorPlanForm.tsx:
   - Валидация через zod
   - Preview загруженного изображения
   - Прогресс загрузки

4. components/ui/image-upload.tsx:
   - Drag & drop зона
   - Preview
   - Кнопка удаления

5. API routes:
   - POST /api/v1/floor-plans
   - PUT /api/v1/floor-plans/[id]

6. Загрузка изображений:
   - lib/supabase/storage.ts - функции upload/delete
   - Сохранять в bucket 'floor-plans'

После успешного сохранения редирект на список.
```

---

## Task 2.3: Floor Plan Details

```prompt
Создай страницу деталей планировки:

1. app/(dashboard)/floor-plans/[id]/page.tsx:
   - Изображение планировки (большое)
   - Информация: название, комнаты, площадь, цена, статус
   - Статистика: генераций, лидов, просмотров
   - Кнопки: редактировать, удалить, вкл/выкл AI
   - Список последних генераций по этой планировке

2. components/dashboard/FloorPlanDetails.tsx:
   - Основная информация
   - Превью последних дизайнов

3. Кнопка "Протестировать генерацию":
   - Открывает модальное окно
   - Выбор стиля
   - Генерация дизайна
   - Показ результата

4. API:
   - GET /api/v1/floor-plans/[id]
   - GET /api/v1/floor-plans/[id]/generations
```

---

## Task 2.4: Gemini API Integration

```prompt
Интегрируй Gemini API для генерации дизайна:

1. lib/gemini/client.ts:
   - Инициализация Gemini клиента
   - Настройка модели gemini-2.0-flash-exp (или gemini-1.5-pro)

2. lib/gemini/generate.ts:
   - Функция generateDesign(generationId: string)
   - Загрузка изображения планировки
   - Формирование промта из стиля + custom prompt
   - Вызов Gemini API
   - Сохранение результата в Supabase Storage
   - Обновление записи generation

3. Промт шаблон:
   ```
   Создай фотореалистичный дизайн интерьера для этой планировки квартиры.
   Стиль: {style_prompt}
   Дополнительные пожелания: {custom_prompt}

   Требования:
   - Сохрани пропорции и расположение комнат с планировки
   - Покажи вид сверху под углом (перспектива)
   - Добавь мебель, освещение, декор
   - Фотореалистичное качество, как журнальная съёмка
   ```

4. Обработка ошибок:
   - Retry при 429 (rate limit)
   - Сохранение error_message в generation
   - Установка status = 'failed'

5. После генерации:
   - Обновить status = 'completed'
   - Сохранить result_image_url
   - Создать thumbnail
   - Записать generation_time_ms
```

---

## Task 2.5: Design Styles Management

```prompt
Создай управление стилями дизайна:

1. Заполни таблицу design_styles 8-10 стилями:
   - Скандинавский
   - Современный / Modern
   - Лофт
   - Классический
   - Минимализм
   - Японский
   - Эко
   - Хай-тек
   - Прованс
   - Неоклассика

2. Для каждого стиля:
   - Название (RU)
   - Название (EN)
   - Prompt template (подробное описание для AI)
   - Категория
   - Preview image (можно заглушки)

3. API:
   - GET /api/v1/styles (для dashboard)
   - GET /api/widget/styles (для виджета, публичный)

4. Опционально: страница управления стилями для админа
```

---

## Task 2.6: Generations List & History

```prompt
Создай страницу истории генераций:

1. app/(dashboard)/generations/page.tsx:
   - Таблица с генерациями
   - Колонки: дата, планировка, стиль, статус, время генерации
   - Фильтры: период, статус, планировка
   - Сортировка по дате

2. Клик на строку → модальное окно с деталями:
   - Входное изображение
   - Результат (если есть)
   - Промт
   - Метаданные (время, токены)

3. Статусы с иконками:
   - pending → часы (жёлтый)
   - processing → спиннер
   - completed → галочка (зелёный)
   - failed → крестик (красный)

4. API:
   - GET /api/v1/generations (с фильтрами)
   - GET /api/v1/generations/[id]
```

---

## Task 2.7: Generation API Endpoint

```prompt
Реализуй API генерации дизайна:

1. POST /api/widget/generate:
   - Валидация API key
   - Проверка лимитов
   - Создание записи generation (status: processing)
   - Запуск генерации в background
   - Возврат generation_id

2. GET /api/widget/generation/[id]:
   - Проверка API key
   - Возврат статуса и результата

3. Логика проверки лимитов:
   - Получить org по api_key
   - Проверить generations_used < generations_limit
   - Если превышен → 402 Payment Required

4. Background processing:
   - Использовать Vercel Background Functions
   - Или Edge Runtime с ожиданием ответа

Следуй спецификации API из .cursor/context/api.md
```

---

## Task 2.8: Realtime Status Updates

```prompt
Добавь realtime обновления статуса генерации:

1. Настрой Supabase Realtime для таблицы generations

2. components/widget/GenerationView.tsx:
   - Подписка на изменения generation по id
   - Показ прогресса (спиннер)
   - При status=completed → показать результат
   - При status=failed → показать ошибку

3. Анимация появления результата:
   - Fade in
   - Возможность увеличить (zoom)

4. Кнопки после генерации:
   - Скачать изображение
   - Сгенерировать ещё
   - Оставить заявку (лид)
```

---

## Чеклист Sprint 2

- [ ] Список планировок с фильтрами
- [ ] Добавление/редактирование планировки
- [ ] Загрузка изображений в Supabase Storage
- [ ] Детальная страница планировки
- [ ] Gemini API интегрирован
- [ ] 8+ стилей дизайна добавлены
- [ ] История генераций работает
- [ ] API генерации готов
- [ ] Realtime обновления работают
- [ ] Тестовая генерация успешна

---

## Тестирование генерации

```bash
# Тест API генерации
curl -X POST http://localhost:3000/api/widget/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "floor_plan_id": "uuid",
    "style_id": "uuid",
    "custom_prompt": "для молодой семьи"
  }'

# Проверить статус
curl http://localhost:3000/api/widget/generation/GENERATION_ID \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Следующий шаг

После завершения Sprint 2 переходи к Sprint 3: Widget (embed скрипт, iframe UI, лидогенерация).
