# Sprint 3: Widget (Неделя 5-6)

## Цель
Создать встраиваемый виджет: embed скрипт, iframe UI, форму захвата лидов, автосканирование сайта.

---

## Task 3.1: Embed Script (widget.js)

```prompt
Создай embed скрипт для встраивания на сайты клиентов:

1. widget/embed/widget.ts - основной файл:
   - Самовызывающаяся функция (IIFE)
   - Парсинг data-атрибутов из тега script
   - Создание кнопки и iframe
   - postMessage коммуникация

2. Функционал:
   - Плавающая кнопка "Создать дизайн"
   - При клике → открывает iframe с виджетом
   - Позиция кнопки настраивается (bottom-right, bottom-left, etc)
   - Кастомизация цвета через data-color

3. Конфигурация через data-атрибуты:
   ```html
   <script
     src="https://app.aidesign.ru/widget.js"
     data-key="API_KEY"
     data-position="bottom-right"
     data-color="#667eea"
     data-text="Создать дизайн"
   ></script>
   ```

4. Стили:
   - Инлайновые (не конфликтуют с сайтом)
   - Анимация появления
   - Респонсив для мобильных

5. Build:
   - Используй esbuild или Vite library mode
   - Минификация
   - Целевой размер: < 15KB

Создай npm script: `npm run build:widget`
```

---

## Task 3.2: Site Scanner (Collector)

```prompt
Добавь в embed скрипт функцию автосканирования сайта:

1. widget/embed/collector.ts:
   - Сканирует все img на странице
   - Фильтрует мелкие (< 200px)
   - Извлекает контекст (текст рядом с картинкой)
   - Отправляет на /api/collector/{clientId}/page

2. Извлечение контекста:
   - Ищет в родительском контейнере
   - Парсит: комнаты, площадь, цену
   - Regex паттерны для русского текста

3. API routes:
   - POST /api/collector/[clientId]/page - приём данных
   - GET /api/collector/[clientId]/activated - список активированных URL

4. Отправка данных:
   ```json
   {
     "url": "https://site.ru/apartments/2-room",
     "title": "2-комнатные квартиры",
     "images": [
       {
         "src": "https://...",
         "alt": "...",
         "width": 800,
         "height": 600,
         "context": {
           "rooms": "2",
           "area": "54.2",
           "price": "8500000"
         }
       }
     ]
   }
   ```

5. Дедупликация:
   - По URL изображения
   - Обновлять last_seen при повторном обнаружении
```

---

## Task 3.3: Widget UI (Iframe)

```prompt
Создай UI виджета внутри iframe:

1. app/widget/page.tsx:
   - Парсит query params (apiKey, floorPlanId, imageUrl)
   - Показывает интерфейс генерации

2. Экраны виджета:
   - Выбор стиля (карточки с preview)
   - Ввод пожеланий (textarea)
   - Процесс генерации (спиннер + текст)
   - Результат (изображение)
   - Форма лида

3. components/widget/:
   - StyleSelector.tsx - сетка стилей
   - PromptInput.tsx - поле ввода
   - GenerationView.tsx - результат
   - LeadForm.tsx - форма захвата

4. Минимальный layout:
   - Без header/footer
   - Максимально компактный
   - Кнопка закрытия (отправляет postMessage родителю)

5. Стили:
   - Использовать CSS переменные для кастомизации
   - Принимать primaryColor через query param
```

---

## Task 3.4: Widget Communication

```prompt
Реализуй коммуникацию между embed скриптом и iframe:

1. Протокол сообщений (postMessage):

   Parent → Iframe:
   - INIT: { config, floorPlan }
   - LOAD_FLOOR_PLAN: { id, imageUrl }

   Iframe → Parent:
   - READY
   - CLOSE_WIDGET
   - LEAD_CAPTURED: { name, phone, email }
   - RESIZE: { height }
   - GENERATION_COMPLETE: { imageUrl }

2. widget/embed/communication.ts:
   - Функции отправки сообщений
   - Обработчики входящих сообщений
   - Валидация origin

3. lib/widget/use-parent-comm.ts (в iframe):
   - Hook для коммуникации с родителем
   - sendToParent(type, data)
   - useEffect для слушания сообщений

4. Безопасность:
   - Проверять event.origin
   - Валидировать структуру сообщений
```

---

## Task 3.5: Lead Capture Form

```prompt
Создай форму захвата лида:

1. components/widget/LeadForm.tsx:
   - Поля: имя, телефон, email (опционально)
   - Checkbox согласия на обработку данных
   - Кнопка отправки

2. Валидация:
   - Имя: минимум 2 символа
   - Телефон: валидный формат (RU)
   - Email: если заполнен, проверить формат

3. Маска телефона:
   - +7 (___) ___-__-__
   - Автоподстановка +7

4. После отправки:
   - Показать благодарность
   - Кнопка скачать изображение
   - Кнопка сгенерировать ещё

5. API:
   - POST /api/widget/lead
   - Валидация API key
   - Сохранение в БД
   - Отправка в CRM (async)

6. Передать родителю:
   - postMessage LEAD_CAPTURED с данными
   - Для интеграции с GTM/аналитикой сайта
```

---

## Task 3.6: Widget Configuration Page

```prompt
Создай страницу настройки виджета в dashboard:

1. app/(dashboard)/widget/page.tsx:
   - Код для вставки на сайт
   - Визуальный конфигуратор
   - Live preview

2. Настройки:
   - Позиция кнопки (4 угла)
   - Основной цвет
   - Текст кнопки
   - Показывать badge "AI"
   - Тема (light/dark)

3. Код для копирования:
   ```html
   <script
     src="https://app.aidesign.ru/widget.js"
     data-key="YOUR_API_KEY"
     data-position="bottom-right"
     data-color="#667eea"
   ></script>
   ```

4. Preview:
   - Показать как будет выглядеть кнопка
   - Показать как будет выглядеть виджет

5. Сохранение настроек:
   - PUT /api/v1/settings/widget
   - Обновить widget_settings в organizations
```

---

## Task 3.7: Image Selection in Dashboard

```prompt
Создай страницу выбора изображений из автосканера:

1. app/(dashboard)/floor-plans/discover/page.tsx:
   - Показать найденные изображения с сайта
   - Группировка по страницам
   - AI-скоринг (вероятность что это планировка)

2. UI:
   - Grid изображений с чекбоксами
   - Фильтр: все / вероятные планировки (score > 0.7)
   - Сортировка по score / дате

3. Действия:
   - Выбрать изображения
   - Кнопка "Добавить как планировки"
   - Создаёт floor_plans из выбранных crawled_images

4. API:
   - GET /api/v1/crawled-images
   - POST /api/v1/crawled-images/import

5. Показывать:
   - Превью изображения
   - Score в процентах
   - Извлечённые данные (комнаты, площадь)
   - На каких страницах найдено
```

---

## Task 3.8: Auto-Attach Widget to Images

```prompt
Добавь автоматическое прикрепление кнопки к активированным изображениям:

1. widget/embed/auto-attach.ts:
   - Загрузить список активированных URL
   - Найти img с этими src на странице
   - Добавить кнопку "Создать дизайн" поверх каждого

2. Логика:
   ```javascript
   async function attachToActivatedImages() {
     const activated = await fetch(`/api/collector/${clientId}/activated`);
     const { images } = await activated.json();

     document.querySelectorAll('img').forEach(img => {
       if (images.includes(img.src)) {
         attachTriggerButton(img);
       }
     });
   }
   ```

3. UI кнопки:
   - Появляется при hover на изображение
   - Позиционирование: внизу справа
   - Стиль: градиент, тень, анимация

4. При клике:
   - Передать imageUrl в виджет
   - Открыть виджет с этой планировкой

5. MutationObserver:
   - Следить за динамически добавленными img
   - Для SPA сайтов
```

---

## Чеклист Sprint 3

- [ ] Embed скрипт работает (widget.js)
- [ ] Кнопка появляется на сайте
- [ ] Виджет открывается в iframe
- [ ] Выбор стиля работает
- [ ] Генерация из виджета работает
- [ ] Форма лида работает
- [ ] postMessage коммуникация работает
- [ ] Автосканирование страниц работает
- [ ] Страница discover показывает найденные изображения
- [ ] Кнопки на активированных изображениях
- [ ] Страница настройки виджета готова

---

## Тестирование виджета

```html
<!-- test.html для локального тестирования -->
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>
  <img src="/test-plan.png" width="400">

  <script
    src="http://localhost:3000/widget.js"
    data-key="test_api_key"
    data-position="bottom-right"
  ></script>
</body>
</html>
```

---

## Следующий шаг

После завершения Sprint 3 переходи к Sprint 4: Polish (биллинг, CRM интеграции, аналитика).
