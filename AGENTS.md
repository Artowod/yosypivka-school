# AGENTS.md — School Website Project Specification

## 1. Технічний стек

### 1.1 Core

- **React**
- **Next.js**
  - ціль: SEO
  - оптимізація зображень
  - SSG + ISR як основний підхід для публічної частини сайту
  - SSR використовувати лише там, де він справді технічно необхідний
  - файловий роутинг через **Next.js App Router**
- **TypeScript**

### 1.2 Styling

Використовувати:

- **SCSS**
- **CSS Modules / SCSS Modules**
- SCSS variables, mixins і functions там, де вони реально прибирають дублювання
- CSS custom properties для глобальних design tokens, коли це доречно

Не використовувати без окремої явної потреби:

- Tailwind CSS
- styled-components
- Emotion
- Bootstrap
- Material UI
- inline styles, окрім значень, які справді мають обчислюватися динамічно

### 1.3 Authentication

Approved approach:

- **Auth.js**
- **Google OAuth**
- Only pre-approved school staff accounts may receive protected access.
- Authentication answers **who the user is**.
- Authorization data stored in the application database answers **what the user may change**.
- Do NOT build a custom password authentication system.
- Do NOT grant edit permissions only because a user successfully signed in with Google.
- All authorization checks for mutations must be performed on the server.
- Hiding an edit button in the UI is not an authorization mechanism.

Authorization model must support combined permissions:

- a user may be a `teacher`
- a user may be an `admin`
- a user may be both `teacher` and `admin`

Teacher access must be scoped to assigned class(es).

Admin access may manage schedules and galleries for all classes.

### 1.4 Forms and Validation

Approved:

- **React Hook Form**
- **Zod**

Use React Hook Form for non-trivial editable forms, including:

- weekly schedule editing
- gallery photo create/edit forms
- admin forms

Use Zod for:

- form validation
- API / Server Action payload validation
- external data validation
- environment/config validation where appropriate

Do NOT trust client-side validation alone.

All mutation payloads must also be validated on the server.

### 1.5 State management

#### Local UI state

Використовувати React `useState`, коли стан належить одному компоненту або невеликій локальній частині UI.

Приклади:

- відкритий / закритий accordion
- mobile menu
- вибране фото в gallery/lightbox
- локальні UI-перемикачі

#### Global client state

- Використовувати **Zustand** тільки для справді глобального client-side state, який потрібен різним незалежним компонентам.
- Не використовувати Zustand для server data.
- Не дублювати дані TanStack Query всередині Zustand.

#### Server state

- Використовувати **TanStack Query / React Query** для client-side server state, коли реально потрібні:
  - caching
  - refetching
  - mutations
  - invalidation
  - optimistic updates
  - синхронізація server state між клієнтськими компонентами

- Використовувати React Query для users/accounts data там, де це має сенс.
- Не використовувати React Query просто тому, що існує HTTP-запит.

#### URL state

Для фільтрів, пагінації, сортування та інших станів, які повинні переживати refresh або бути shareable, використовувати URL search params, коли це доречно.

### 1.6 Database

Approved database:

- **Neon Postgres — Free plan**
- Store structured application data only.
- Do NOT store binary image files directly in PostgreSQL.

The database is expected to contain lightweight records such as:

- users
- roles / permissions
- teacher-to-class assignments
- weekly schedules
- gallery photo metadata
- image storage identifiers / URLs
- titles
- descriptions
- dates
- audit fields

Database usage should remain small because image binaries are stored separately.

### 1.7 Database Access

Preferred approach:

- use a single type-safe database access layer
- keep database calls on the server
- do not expose database credentials to the browser
- do not query Neon directly from Client Components
- keep queries small and purpose-specific
- avoid N+1 queries

ORM / query layer:

- **Drizzle ORM** is the approved default for type-safe schema and queries.
- Do NOT add Prisma or another ORM in parallel unless the stack is explicitly changed.

### 1.8 Photos / Image Storage

Approved image storage / delivery:

- **Cloudinary Free plan**

Use Cloudinary for:

- original image upload
- image storage
- CDN delivery
- thumbnails
- responsive variants
- optimized formats
- resized gallery previews

PostgreSQL stores only photo metadata and Cloudinary identifiers.

For every photo record, store only the data needed by the application, for example:

- `id`
- `classId`
- `cloudinaryPublicId`
- `secureUrl` when needed
- `title`
- `description` (nullable)
- `takenAt`
- `createdAt`
- `updatedAt`
- `uploadedBy`
- optional `width`, `height`, `format`, `bytes`

Do NOT duplicate the same image for the class gallery and the Archive page.

The Archive page must read the same photo records and group/filter them by date.

### 1.9 Image privacy and safety

School gallery photos may contain children.

Therefore:

- uploads are allowed only for authorized teachers/admins
- public visitors never receive upload/edit/delete controls
- strip or avoid exposing EXIF/GPS location metadata
- do not expose internal storage credentials
- validate MIME type and file size before accepting uploads
- reject non-image uploads
- avoid serving original oversized files when a smaller optimized version is sufficient


---

## 2. Data Model and Authorization

### 2.1 Classes

The application currently has four classes:

- Class 1
- Class 2
- Class 3
- Class 4

Use stable class identifiers in the database.

Do not derive authorization from display strings such as `"1й клас"`.

### 2.2 Users and roles

Recommended model:

#### `users`

- `id`
- `email`
- `name`
- `createdAt`
- `updatedAt`

#### `userRoles`

- `userId`
- `role`

Allowed role values:

- `teacher`
- `admin`

A single user may have more than one role.

#### `teacherClassAssignments`

- `userId`
- `classId`

This table defines which class(es) a teacher is allowed to edit.

Authorization rules:

- unauthenticated visitor: read public content only
- teacher: edit schedule and gallery only for assigned class(es)
- admin: edit schedule and gallery for any class
- teacher + admin: receives both capabilities; admin permission covers all classes

Every create/update/delete operation must verify authorization **server-side**.

### 2.3 Weekly schedule model

The schedule is stored per class and per calendar week.

Use Monday as the `weekStart`.

Recommended entities:

#### `lessonSlots`

Defines the six lesson time slots displayed in the left column.

Example fields:

- `lessonNumber` — 1..6
- `startTime`
- `endTime`

If lesson times are school-wide and stable, store/reuse one common set instead of duplicating the times for every day.

#### `scheduleEntries`

- `id`
- `classId`
- `weekStart`
- `dayOfWeek`
- `lessonNumber`
- `subject`
- `updatedAt`
- `updatedBy`

Allowed `dayOfWeek` values:

- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

A unique constraint should prevent two subjects from occupying the same:

`classId + weekStart + dayOfWeek + lessonNumber`

### 2.4 Schedule week behavior

Public users see the schedule for the current calendar week.

On Saturday/Sunday, teacher editing should default to the **next week**, so changing the upcoming schedule does not destroy the still-current week's data.

The public page switches to the new week automatically when that week begins.

Do not overwrite previous weeks merely to display the next one.

If the current week has no schedule data, show a friendly empty/fallback state instead of crashing.

### 2.5 Gallery photo model

Recommended `photos` entity:

- `id`
- `classId`
- `cloudinaryPublicId`
- `secureUrl` if required
- `title`
- `description` nullable
- `takenAt`
- `createdAt`
- `updatedAt`
- `uploadedBy`
- optional image metadata

Authorization:

- public visitor: read
- teacher assigned to the photo's class: create/edit/delete
- admin: create/edit/delete for any class

Editing a photo may change:

- image file
- title
- description
- date when needed

Replacing an image must also remove/reconcile the previous Cloudinary asset so orphaned files are not left indefinitely.

Deleting a photo must handle both:

- Cloudinary asset deletion
- database record deletion

The operation must follow the project's error-handling rules and must not silently leave an inconsistent state.

### 2.6 Archive

The Archive is a **view of the existing `photos` data**, not separate storage.

Do NOT copy images into an `archivePhotos` table.

Archive requirements:

- group/filter by year and month
- reuse the same title, description and `takenAt`
- support class filtering when useful
- use pagination / incremental loading or period-based pages so thousands of photos are not rendered at once
- thumbnails must load optimized small variants
- full-size image loads only when the user opens it

---

## 3. Rendering Strategy

### 3.1 Public pages

Для всієї публічної інформаційної частини сайту основний пріоритет:

1. **SSG**
2. **ISR / on-demand revalidation**
3. Client-side interaction там, де вона доречна
4. **SSR тільки тоді, коли request-time rendering справді необхідний**

Не використовувати SSR за замовчуванням.

SSG / ISR використовувати для:

- інформації про школу
- інформації про село / район
- історичних сторінок
- сторінок класів
- викладацького складу
- розкладу
- фотографій та галерей
- випусків
- активностей школи
- іншого публічного контенту, який не залежить від конкретного користувача

### 3.2 Оновлення контенту

Коли авторизований викладач або адміністратор змінює публічний контент:

- записати зміну в базу даних
- виконати revalidation потрібного route/cache
- не переводити сторінку на SSR тільки через те, що її контент можна редагувати

### 3.3 Photo gallery interaction

Натискання користувача на фотографію не повинно викликати server-side rerender сторінки.

Логіка:

`thumbnail -> click/tap -> client-side lightbox/modal -> завантаження великої оптимізованої фотографії`

Відкриття фотографії повинно бути звичайною client-side UI interaction.

---

## 4. Next.js Rules

### 3.1 App Router

- Використовувати **Next.js App Router**.
- Не використовувати Pages Router для нового коду.
- Не використовувати React Router.
- Не створювати паралельну client-side routing систему.

### 3.2 Server and Client Components

- Компоненти за замовчуванням повинні залишатися **Server Components**.
- Додавати `"use client"` тільки тоді, коли компонент реально потребує:
  - React client hooks
  - local client state
  - event handlers
  - browser API
  - client-side interactive behavior

- Client Components мають бути максимально локальними.
- Не переводити цілу сторінку або layout у Client Component тільки через те, що один дочірній елемент потребує інтерактивності.

### 3.3 Images

Використовувати:

- `<Image />` із `next/image`

Не використовувати:

- raw `<img>` без чіткої документованої технічної причини

Правила:

- завжди задавати коректний `alt`
- для remote images явно налаштовувати дозволені image sources
- використовувати відповідний `sizes` для responsive images
- не використовувати `unoptimized`, якщо немає реальної технічної причини
- не використовувати `priority` для всіх зображень підряд

### 3.4 Navigation

- Для внутрішньої навігації використовувати `<Link />` із `next/link`.
- Не використовувати raw `<a>` для звичайної внутрішньої навігації.
- Raw `<a>` допускається для зовнішніх посилань, якщо це доречно.

### 3.5 Fonts

- За можливості використовувати `next/font`.
- Не підключати стороннє рішення для шрифтів без потреби.

### 3.6 Metadata / SEO

- Використовувати Next.js Metadata API / `generateMetadata`.
- Не маніпулювати `<head>` вручну без технічної необхідності.
- Публічні сторінки повинні мати коректні title, description та інші SEO metadata.

---

## 5. Naming Conventions

- React components: `PascalCase`
- Component files: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Utility functions: `camelCase`
- Variables: `camelCase`
- Functions: `camelCase`
- Route folders у `app/`: lowercase
- Constants: `UPPER_SNAKE_CASE` тільки для справжніх constants
- Назви повинні бути зрозумілими і описувати відповідальність сутності.

Приклади:

- `SchoolHeader.tsx`
- `ClassSchedule.tsx`
- `PhotoGallery.tsx`
- `useCurrentUser.ts`
- `formatDate.ts`

---

## 6. Structure and Component Architecture

### 5.1 Folder structure

Структура папок — стандартний офіційний підхід для середнього Next.js / React проекту з урахуванням **Next.js App Router і файлового роутингу**.

Не створювати складну кастомну архітектуру папок без необхідності.

### 5.2 Component separation

Розділяти код на окремі компоненти **за відповідальністю**, а не просто за кількістю рядків.

Виносити окремий компонент, коли він:

- має окрему відповідальність
- повторно використовується
- містить суттєву незалежну логіку
- значно покращує читабельність
- є окремою UI-сутністю

Не робити надмірне дроблення.

Не створювати без потреби:

- wrapper-компоненти на декілька рядків
- компоненти без власної відповідальності
- абстракції "на майбутнє"
- зайві factory/service/interface layers

---

## 7. Design Principles

- Використовувати SOLID там, де він дає практичну користь.
- **Single Responsibility Principle** — основний принцип.
- UI, data access та business logic розділяти там, де це реально покращує код.
- Dependency Inversion використовувати тільки там, де існує реальна abstraction boundary.
- Interface Segregation використовувати там, де він справді потрібен, а не формально.
- Не створювати interfaces, factories, services або abstraction layers лише для формального виконання SOLID.
- Простий, зрозумілий і підтримуваний код важливіший за теоретично "ідеальну" архітектуру.

---

## 8. Animation and Interaction

Всі кнопки - акордеони - перемикачі та інші екшн елементи Мають плавно рухатись ! тобто мати приємну анімацію

### Technical animation rules

- Для простих hover / focus / open / close interaction використовувати CSS transitions та CSS animations.
- Не додавати JavaScript animation library тільки заради простої hover-анімації.
- Animation library використовувати тільки для складних coordinated animations, gestures або layout transitions, якщо CSS уже недостатньо.
- Анімація не повинна блокувати навігацію або interaction.
- Підтримувати `prefers-reduced-motion`.
- Анімації мають бути плавними, приємними та доречними до дитячого дизайну.

---

## 9. Icons and Decorative Illustrations

всі великі іконки мають бути Різнокольоровими ! в інеті є багато прикладів - різнокольоровими в межах Однієї ікноки ! наприклад кнопка "Домашні завдання" має містити іконку зошита з олівцем де зошит наприклад має сині полоски а олівець - зелений - і при наведенні (натисканні в планшеті-мобілці) на іконку олівець наприклад рухається по листку вліво вправо і так далі. Має бути Інтерактивність максимально більшої кількості елементів

### Technical icon rules

- Великі feature icons бажано реалізовувати як custom multi-color SVG components.
- Окремі частини SVG можуть анімуватися незалежно через CSS.
- Звичайні icon libraries дозволені для маленьких utility icons:
  - close
  - chevron
  - search
  - menu
  - visibility
  - інші стандартні service actions

- Не використовувати однотонні library icons як основні великі декоративні іконки, якщо дизайн вимагає custom illustrated icon.

---

## 10. Responsive Design and Browser Support

сайт має бути адаптивним - мобілка - планшет - десктоп (стандартні медіа поінти для цих девайсів)!

створення адаптивності стилей - за принципом mobile-first !

підтримка 3х існуючих браузерів - Chrome . Сафарі (ios) . Firefox

### Technical responsive rules

- Основний підхід: **mobile-first**.
- Перевіряти UI щонайменше для:
  - mobile
  - tablet
  - desktop
- Touch interactions мають працювати без необхідності hover.
- Інтерактивні елементи повинні мати достатню touch area.
- Підтримувати актуальні версії:
  - Chrome
  - Safari / iOS Safari
  - Firefox

---

## 11. Loading UX

Скрізь, де користувач повинен чекати на суттєве завантаження або виконання дії, показувати приємний **дитячий loader**.

### 10.1 Loader behavior

- Loader має відповідати візуальному стилю молодшої школи.
- Може містити невелику дитячу анімацію, героя, шкільний предмет, олівець, книжку, соняшник або інший дружній елемент.
- Поява та зникнення loader повинні бути плавними.
- Для операцій, під час яких користувач не повинен повторно взаємодіяти з UI, loader може блокувати відповідну область або весь екран.
- Не створювати кілька паралельних full-screen loaders.

### 10.2 Loading timeout UX

Якщо суттєве завантаження не завершилось приблизно за **5 секунд**, показати дружній fallback state.

Приклад змісту:

**"Упс... не завантажилось. Спробуйте пізніше."**

Разом із повідомленням показувати дитячий малюнок / SVG:

- здивований герой
- дружній супергерой
- здивований шкільний персонаж
- інша позитивна дитяча ілюстрація

Fallback state не повинен виглядати страшно або технічно.

Не показувати користувачу raw stack trace, server exception або внутрішні технічні деталі.

> Важливо: 5 секунд — це UX-поріг для показу fallback/додаткового повідомлення користувачу, а не автоматичне скасування network request, якщо для цього немає окремої технічної причини.

---

## 12. Error Handling and User Notifications

Усі помилки, які можуть бути корисні користувачу, показувати коротким зрозумілим повідомленням.

### 11.1 Error toast

За замовчуванням показувати error notification:

- у нижній правій частині екрана на desktop
- у безпечному адаптивному положенні на mobile
- приблизно на **5 секунд**
- із плавною появою
- із плавним зникненням

Error toast може містити:

- короткий текст помилки зрозумілою людською мовою
- невелику ілюстрацію / SVG здивованого дитячого героя

### 11.2 Error message rules

Не показувати користувачу:

- stack traces
- raw API response
- database errors
- technical exception names
- секретні або внутрішні system details

Замість цього перетворювати технічну помилку на коротке дружнє повідомлення.

Наприклад:

- "Упс! Не вдалося зберегти зміни."
- "Не вдалося завантажити фотографії."
- "Схоже, щось пішло не так. Спробуйте ще раз."

### 11.3 Critical errors

Для критичних page-level errors використовувати окремий friendly error state / Next.js `error.tsx`, якщо це доречно.

Дизайн error state також повинен відповідати дитячому стилю сайту.

---


## 13. Error Boundaries and Exception Handling

Усі операції, які можуть реально завершитися помилкою, повинні мати явну стратегію обробки помилок.

Обов'язково обробляти помилки для:

- API requests
- database operations
- authentication / authorization operations
- form submissions
- file / image upload
- data mutations
- parsing external data
- third-party API calls
- async server actions
- async client actions, де помилка може вплинути на користувача

### 12.1 `try/catch`

Використовувати `try/catch` там, де exception справді може бути кинутий і де на нього можна коректно відреагувати.

Не додавати `try/catch` механічно навколо кожної функції.

Кожен `catch` повинен:

1. не залишати помилку непоміченою
2. логувати технічну інформацію там, де це доречно
3. переводити технічну помилку у зрозумілий application error
4. показувати користувачу дружнє повідомлення, якщо помилка впливає на його дію

### 12.2 Never swallow errors

Заборонено залишати порожні `catch` blocks.

Не робити так:

```ts
try {
  // operation
} catch (error) {
}
```

або так:

```ts
try {
  // operation
} catch {
  return;
}
```

Помилка не повинна просто "зникати".

### 12.3 User-facing errors

Якщо помилка стосується дії користувача, показати error toast відповідно до правил секції **Error Handling and User Notifications**:

- короткий текст зрозумілою мовою
- дружня дитяча ілюстрація / здивований герой
- плавна поява
- приблизно 5 секунд
- плавне зникнення

Не показувати користувачу:

- raw exception message
- stack trace
- database error
- internal API details
- secret values
- internal system information

### 12.4 Server-side error handling

Для server-side operations:

- ловити технічні помилки на відповідному рівні
- логувати технічні деталі
- не передавати raw server/database exception безпосередньо в UI
- перетворювати exception у контрольований application error
- повертати клієнту тільки безпечну і зрозумілу інформацію

### 12.5 React / Next.js rendering errors

Звичайний `try/catch` не використовувати як заміну React Error Boundary.

Для page-level або route-level rendering failures:

- використовувати Next.js `error.tsx`, коли це доречно
- використовувати Error Boundaries для ізольованих client-side UI sections, якщо це необхідно
- error screen повинен відповідати дружньому дитячому дизайну сайту
- показувати користувачу зрозумілу можливість повторити дію або повернутися до робочої частини сайту

### 12.6 Error handling principle

Не кожен рядок коду потребує `try/catch`.

Потрібна не максимальна кількість `try/catch`, а **надійна і передбачувана error handling strategy** для всіх реальних failure points.

---

## 14. Dependency Policy

Перед встановленням нової бібліотеки перевірити, чи React, Next.js, browser API або вже встановлені dependencies не вирішують задачу достатньо просто.

### Prefer built-in solutions

Приклади:

- не встановлювати React Router — використовувати Next.js routing
- не встановлювати Axios тільки для звичайних HTTP-запитів — використовувати native `fetch`, якщо він достатній
- не встановлювати image optimization library для стандартних задач — використовувати `next/image`
- не використовувати global state manager для простого local component state
- не встановлювати date library для простого форматування, якщо достатньо `Intl`

### Do NOT

- Не додавати dependency без конкретної потреби.
- Не вводити другу бібліотеку, яка дублює функціональність уже затвердженої.
- Не міняти затверджений stack самостійно.
- Не виконувати великий refactor тільки тому, що існує "красивіший" pattern.

---


## 15. Server Actions, Route Handlers and Mutation Architecture

### 15.1 Default mutation approach

For mutations initiated from this Next.js application, prefer **Server Actions** when they provide the simplest and clearest implementation.

Use Server Actions for:
- schedule save/update
- gallery photo metadata edit
- gallery photo create
- gallery photo delete
- admin role/permission updates
- other authenticated forms owned by this application

Every protected Server Action must:
1. verify authentication on the server
2. load current authorization data
3. verify permission for the exact target resource/class
4. validate payload with Zod
5. perform the database/storage mutation
6. create audit/error logs when required
7. revalidate affected cache/tag/path
8. return a normalized result to the UI

Do NOT trust hidden UI controls, client-side roles, client-supplied `classId`, or client-side validation alone.

### 15.2 Route Handlers

Use Route Handlers only when they are a better boundary, for example:
- weather API proxy/cache
- Auth.js/OAuth integration needs
- external callbacks/webhooks
- endpoints that must be callable independently from a React form

Do NOT create a parallel REST API for every internal Server Action without a concrete reason.

### 15.3 Normalized action result

Use a predictable result shape and never send raw exceptions to the browser.

If a user-facing operation fails, show:
**"Щось пішло не за планом. Спробуйте трохи пізніше."**

The toast:
- appears smoothly
- stays about 5 seconds
- disappears smoothly
- bottom-right on desktop
- adaptive safe position on mobile

---

## 16. Logging and Audit Trail

Do NOT rely on a local production server file as the primary persistent log.

Use the existing **Neon Postgres** database for small persistent logs. No separate paid logging platform is required.

### 16.1 `errorLogs`

Recommended fields:
- `id`
- `createdAt`
- `userId` nullable
- `userEmail` nullable
- `location`
- `errorCode` nullable
- `message`
- `context` nullable JSON
- `requestId` nullable

Never log passwords, OAuth/session tokens, secrets, DB credentials, Cloudinary secrets, or full sensitive payloads.

If an error happens outside direct user interaction:
- do not show a global toast
- write it silently to `errorLogs`
- keep the public UI stable where possible

If the user is actively waiting for Save/Delete/Add/Login/permissions update and it fails:
- reset loading/submitting state
- show the standard friendly 5-second toast
- log the technical failure when useful

### 16.2 `auditLogs`

Log only:
- successful login
- data create/update/delete
- photo create/edit/delete
- schedule change
- permission/role change

Recommended fields:
- `id`
- `createdAt`
- `userId` nullable
- `userEmail`
- `action`
- `entityType`
- `entityId` nullable
- `classId` nullable
- `summary`

Do NOT log normal read-only page visits.

---

## 17. Security

This is a normal public school website, but standard web security practices are required.

- Google login identifies the user.
- Database roles/assignments define permissions.
- There is **no fixed email allowlist**.
- A user may log in successfully and still have no edit permissions.
- Every mutation verifies authorization server-side.
- Never trust client-supplied `classId` without checking assignment/admin role.
- Use secure Auth.js session/cookie defaults.
- Keep secrets in server-only environment variables.
- Never expose secrets through `NEXT_PUBLIC_*`.
- Never commit real `.env` secrets.
- Validate mutation payloads with Zod on the server.
- Validate image MIME/type and size.
- Reject unsupported uploads.
- Do not render user text through `dangerouslySetInnerHTML`.
- Use reasonable mutation rate limiting only where abuse is realistically possible.
- Destructive actions require confirmation.
- State-changing operations must not be unauthenticated GET requests.

---

## 18. Accessibility

Follow standard accessibility practices:
- semantic HTML
- keyboard navigation
- visible focus states
- meaningful `alt`
- `alt=""` for decorative images
- sufficient contrast
- labels connected to inputs
- accessible validation/error text
- `aria-*` only where native HTML is insufficient
- sufficiently large touch targets

Photo lightbox/modals must:
- trap focus
- close with `Escape`
- restore focus to the trigger
- expose an accessible close button
- prevent background interaction while open
- support overlay click/tap close where appropriate

Animations must respect `prefers-reduced-motion`.

---

## 19. Testing

Use a minimal but meaningful automated test set.

### Permission tests
Verify:
- guest cannot mutate schedule/gallery
- teacher can edit assigned class
- teacher cannot edit another class
- admin can edit any class
- teacher+admin receives admin-level access
- forged `classId` is rejected server-side

### Schedule tests
Verify:
- authorized save only
- current week selection
- weekend editing defaults to next week
- class/week/day/lesson uniqueness
- invalid payload rejection

### Gallery tests
Verify:
- authorized create
- metadata edit
- delete
- unauthorized rejection
- Cloudinary/database failure handling
- Archive reuses the same photo records

### E2E smoke tests
Use a small Playwright suite where practical:
- visitor sees schedule
- teacher edits own class
- teacher cannot edit another class
- admin edits permissions
- gallery lightbox opens/closes
- archive infinite scroll loads another batch

Do not pursue coverage percentages for their own sake.

---

## 20. Environment Variables

Keep an `.env.example` with variable names only.

Expected groups:
- `DATABASE_URL`
- Auth.js secret
- Google OAuth client ID
- Google OAuth client secret
- Cloudinary cloud name
- Cloudinary API key
- Cloudinary API secret
- canonical production URL if required

Open-Meteo does not require an API key for this non-commercial usage.

Never put fake-but-real-looking secrets into committed source code.

---

## 21. Deployment

Preferred deployment:
- **Vercel Hobby** — Next.js app
- **Neon Free** — PostgreSQL
- **Cloudinary Free** — image storage/delivery

Keep deployment free-tier friendly.

Do not depend on persistent local files on Vercel for logs, uploads, or application data.

---

## 22. SEO

Implement standard Next.js SEO:
- Metadata API
- unique titles
- useful descriptions
- canonical URLs where appropriate
- `sitemap.xml`
- `robots.txt`
- Open Graph metadata
- meaningful heading hierarchy
- descriptive internal links

Use structured data only when it is accurate and genuinely useful.

---

## 23. Weather

Approved weather API:
- **Open-Meteo**

Use fixed verified coordinates for the school/village location.

Do not geolocate every visitor.

### Weather caching
- fetch on the server
- cache/revalidate about once per hour
- do not call Open-Meteo for every visitor
- opening the widget normally uses cached hourly data

### Weather widget
Compact view:
- current weather
- temperature
- short condition summary
- small icon

Expanded on click/tap:
- compact weekly forecast

### Weather failure
If weather fails:
- do not break the page
- show inside the widget:
  **"Не вдалося оновити погоду. Натисни на мене, щоб спробувати ще раз."**
- clicking the failed widget triggers another attempt
- log the technical error silently
- do not show a global toast for a background refresh failure

---

## 24. Admin Cabinet and Permission Management

Only users with `admin` role see an **Admin Cabinet** control in the site header.

Prefer a dedicated admin page instead of a modal because the user/permission list may grow.

Show all users who have successfully logged in at least once.

For each user show:
- email
- name if available
- checkbox `Admin`
- checkbox `1 class`
- checkbox `2 class`
- checkbox `3 class`
- checkbox `4 class`

Class checkboxes mean teacher assignment.

A user may have:
- one class
- multiple classes
- admin only
- admin + class assignment(s)
- no edit permissions

### Save permissions
On Save:
1. verify current admin session server-side
2. verify current user still has admin permission
3. validate submitted permissions
4. update roles and class assignments transactionally
5. write audit log
6. revalidate relevant permission cache
7. show success feedback

On failure:
- roll back transaction
- keep UI recoverable
- show standard error toast
- write `errorLogs`

Protect against accidentally removing the final remaining administrator without explicit confirmation.

---

## 25. Logged-in User Avatar

Authenticated users see an avatar control in the header.

If no profile image is used:
- show the first letter of the user's name
- use a child-friendly decorative background

On desktop hover/focus and mobile/tablet tap show:
- name
- surname if available
- email

If a field is missing, do not render an empty label.

The popover must be keyboard accessible and closable.

---

## 26. Photo Upload and Editing Rules

### Supported formats
Accept:
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF

### Size target
Preferred result: **<= 5 MB** per photo.

If source photo is larger than 5 MB:
1. attempt automatic client-side resize/compression
2. reduce dimensions/quality as needed
3. target <=5 MB
4. show a local loading/progress state

Do not enlarge small images or aggressively destroy quality.

If safe client compression is unavailable for a format, use a controlled fallback within the provider's accepted upload limit or show a friendly request to choose a smaller file.

### Create
Create photo with:
- image
- title
- optional description
- date/time when available
- class association

### Edit
Edit changes metadata only:
- title
- description
- date if allowed

**The image file cannot be replaced through Edit.**

To replace an image:
1. delete old photo
2. create a new one

### Delete
Delete removes:
- Cloudinary asset
- DB photo record and metadata

Require confirmation and write an audit log.

### Cloudinary success + DB failure
If upload succeeds but DB insert fails:
1. attempt best-effort cleanup of the new Cloudinary asset
2. reset upload/loading state
3. show the standard user-facing error toast
4. write technical error to `errorLogs`
5. do not add a fake gallery item locally

If cleanup also fails, log that cleanup failure separately.

---

## 27. Cache and Revalidation Strategy

Editing happens directly on the same public class/gallery pages.

Do not create a separate teacher-only copy of the page.

### Schedule
Guest sees normal text.

Authorized teacher/admin sees Edit.

Edit mode replaces schedule text cells with form inputs in the same visual positions.

After Save:
- revalidate affected class schedule tag
- revalidate affected class page
- keep unrelated classes untouched

Recommended tags:
- `schedule:class:{classId}:week:{weekStart}`
- `class:{classId}`

### Gallery
Guest sees normal gallery.

Authorized teacher/admin gets Create/Edit/Delete controls on the same gallery.

After create/edit/delete:
- update active local/query state appropriately
- revalidate affected gallery data
- revalidate affected class page
- revalidate Archive data

Recommended tags:
- `gallery:class:{classId}`
- `photos:archive`
- `class:{classId}`

Do not revalidate the whole site unnecessarily.

---


## 28. Final Route Map

Required public routes:

- `/`
- `/history`
- `/school-life`
- `/school-life/gallery`
- `/classes/1`
- `/classes/2`
- `/classes/3`
- `/classes/4`
- `/classes/1/gallery`
- `/classes/2/gallery`
- `/classes/3/gallery`
- `/classes/4/gallery`
- `/archive`

Required protected/admin route:

- `/admin`

Optional supporting routes may be added only when technically useful, for example:

- auth callback routes managed by Auth.js
- internal Route Handlers
- not-found/error routes

Do NOT create duplicate public pages for teacher/admin editing.

Teachers/admins edit allowed data directly on the same class/gallery pages used by public visitors.

---

## 29. Final Database Schema Blueprint

Use **Neon Postgres + Drizzle ORM**.

The schema should be normalized and relational.

Do NOT store schedule objects or role arrays as one large JSON object inside `users`.

The user's conceptual model is preserved through relational tables so permissions, validation, indexing and weekly history remain reliable.

### 29.1 `users`

Fields:

- `id` — primary key
- `name` — nullable
- `surname` — nullable
- `email` — unique, required
- `signinDate` — timestamp of first successful sign-in
- `lastSigninDate` — nullable timestamp
- `createdAt`
- `updatedAt`

### 29.2 `userRoles`

Fields:

- `id`
- `userId`
- `role`

Allowed role values:

- `admin`
- `class_1`
- `class_2`
- `class_3`
- `class_4`

A user may have multiple roles.

Unique constraint:

- `userId + role`

Interpretation:

- `admin` = global admin access
- `class_1` = teacher permission for class 1
- `class_2` = teacher permission for class 2
- `class_3` = teacher permission for class 3
- `class_4` = teacher permission for class 4

This replaces a separate teacher assignment table for this small fixed four-class project.

### 29.3 `classes`

Seed exactly four classes:

- `1`
- `2`
- `3`
- `4`

Suggested fields:

- `id`
- `slug`
- `displayName`
- `createdAt`
- `updatedAt`

Example:

- `id: 1`
- `slug: "1"`
- `displayName: "1 клас"`

### 29.4 `lessonSlots`

One shared set of six default lesson slots for all classes.

Fields:

- `lessonNumber` — 1..6
- `startTime`
- `endTime`

The actual initial time values may use reasonable placeholders and must be easy to replace later.

### 29.5 `scheduleEntries`

Do NOT store `curr_week` and `next_week` as nested JSON inside a user.

Schedule belongs to a class and calendar week.

Fields:

- `id`
- `classId`
- `weekStart`
- `dayOfWeek`
- `lessonNumber`
- `subject`
- `updatedAt`
- `updatedBy`

Allowed days:

- `monday`
- `tuesday`
- `wednesday`
- `thursday`
- `friday`
- `saturday`

Unique constraint:

- `classId + weekStart + dayOfWeek + lessonNumber`

Indexes:

- `classId + weekStart`
- `weekStart`

This relational structure still provides the same conceptual result as:

`current week -> days -> 6 lessons`

and:

`next week -> days -> 6 lessons`

but without duplicating week state inside user data.

### 29.6 `photos`

Fields:

- `id`
- `creationDate`
- `fileName`
- `cloudinaryPublicId`
- `secureUrl`
- `title`
- `description` nullable
- `galleryId`
- `classId` nullable
- `uploadedBy` nullable
- `createdAt`
- `updatedAt`
- optional `width`
- optional `height`
- optional `format`
- optional `bytes`

Allowed `galleryId` values:

- `school`
- `class_1`
- `class_2`
- `class_3`
- `class_4`

Rules:

- `school` is used by `/school-life/gallery`
- class gallery IDs map to the matching class gallery
- Archive reads these same photo records
- do not create duplicate archive photo records

Indexes:

- `galleryId + creationDate`
- `classId + creationDate`
- `creationDate`

### 29.7 `errorLogs`

Fields:

- `id`
- `createdAt`
- `userId` nullable
- `userEmail` nullable
- `location`
- `errorCode` nullable
- `message`
- `context` nullable JSON
- `requestId` nullable

### 29.8 `auditLogs`

Fields:

- `id`
- `createdAt`
- `userId` nullable
- `userEmail`
- `action`
- `entityType`
- `entityId` nullable
- `classId` nullable
- `summary`

### 29.9 Relations and delete rules

Use foreign keys where appropriate.

Recommended behavior:

- deleting a user must not silently destroy important historical audit records
- schedule/photo records may preserve `updatedBy/uploadedBy` as nullable if the referenced user disappears
- deleting a class is not a normal runtime operation
- deleting a photo record must be coordinated with Cloudinary asset deletion
- permission updates must be transactional

---

## 30. Seed Data

Seed development data automatically.

### 30.1 Classes

Create:

- `1 клас`
- `2 клас`
- `3 клас`
- `4 клас`

### 30.2 Default lesson names

All four classes start with the same default six lesson rows:

1. `Навчання грамоти (читання)`
2. `Математика`
3. `Навчання грамоти (письмо)`
4. `Мистецтво (музичне)`
5. `Фізична культура`
6. empty string

Apply this same default list across the initial seeded school week.

Saturday may remain empty.

### 30.3 Seed users

Create development seed users:

#### User 1

- email: `myjavaname@gmail.com`
- name: `Сергій`
- surname: `Лукавенко`
- roles:
  - `admin`

#### User 2

- email: `lukavenko.sergii.webdev@gmail.com`
- name: `Сергій`
- surname: `Лукавенко`
- roles:
  - `class_1`

These records exist to make development/testing easier.

Auth.js login must still associate the real Google-authenticated email with the matching database user.

### 30.4 Seed schedule behavior

Seed one initial current-week schedule for every class.

Use the six default lesson names above.

The initial schedule may repeat the same lesson set for Monday-Friday for development purposes.

Saturday may remain empty.

This is demo data only and must be easy to replace later.

### 30.5 Seed placeholder content

For non-history pages:

- use one generated school-themed horizontal image
- use one generated school-themed vertical image
- source/original size should be reasonably large and representative of phone photography
- base horizontal reference size: about `4080 x 2296`
- use the same two images repeatedly in arbitrary order
- render them as optimized thumbnails where appropriate
- open the large/original-quality version in the lightbox behavior already defined

Use placeholder text such as:

- `Фото 1`
- `Фото 2`
- `Фото 3`
- varied `Lorem ipsum` blocks

Text lengths should vary significantly to stress-test layout.

---

## 31. Initial Build Execution Rule

Codex should build the project as one cohesive implementation, including tests.

Do not artificially split the project into multiple separate user-confirmation phases.

The expected workflow is:

1. read this entire `AGENTS.md`
2. inspect existing repository state
3. establish project foundation
4. create database schema and migrations
5. add seed data
6. configure Auth.js + Google OAuth
7. implement permissions
8. implement public routes/pages
9. implement schedule editing
10. implement school/class galleries
11. implement Archive infinite scroll + virtualization
12. implement Admin Cabinet
13. implement weather widget
14. implement loading/error/audit behavior
15. implement accessibility and SEO basics
16. implement tests
17. run validation/build checks
18. fix discovered issues
19. leave the repository in a working state

Do not stop merely because a small design detail is unspecified.

When a non-critical detail is ambiguous:

- choose a reasonable best-practice solution
- keep it consistent with this specification
- continue implementation

Only treat missing external credentials/secrets as expected setup blockers.

---

## 32. Definition of Done

The first complete implementation is considered done when all of the following are true.

### 32.1 Project foundation

- Next.js App Router project runs
- TypeScript configured
- SCSS Modules working
- Drizzle + Neon schema prepared
- Auth.js integrated
- Cloudinary integration prepared
- Open-Meteo integration implemented
- `.env.example` present

### 32.2 Public pages

All required routes exist:

- `/`
- `/history`
- `/school-life`
- `/school-life/gallery`
- `/classes/1`
- `/classes/2`
- `/classes/3`
- `/classes/4`
- `/classes/1/gallery`
- `/classes/2/gallery`
- `/classes/3/gallery`
- `/classes/4/gallery`
- `/archive`

### 32.3 Shared layout

Implemented:

- sticky header
- school emblem area
- navigation
- social icons area
- weather widget
- authenticated avatar
- footer

### 32.4 Visual system

Implemented consistently:

- pastel visual language
- Ukrainian symbols/motifs
- school-themed illustrations
- yellow/blue accents
- pink/blue child-friendly accents
- page-specific mood differences
- interaction-driven animations
- strong themed page-title blocks

### 32.5 Schedule

Working:

- public view
- teacher own-class edit
- admin all-class edit
- Save
- current-week display
- weekend next-week editing behavior
- server authorization
- Zod validation
- revalidation
- audit/error handling

### 32.6 Gallery

Working:

- class galleries
- school-life gallery
- thumbnail view
- lightbox
- create
- metadata edit
- delete
- teacher own-class permission
- admin all-gallery permission
- photo size/compression handling
- Cloudinary integration flow
- audit/error handling

### 32.7 Archive

Working:

- uses same `photos` data
- grouping/filtering by time
- infinite scroll
- virtualization
- optimized thumbnail loading
- large image only on open

### 32.8 Admin Cabinet

Working:

- user list
- role/class checkboxes
- Save
- transactional update
- server-side admin authorization
- audit log
- safeguard against accidental loss of the final admin

### 32.9 History page

- uses real public information where available
- does not fabricate unsupported facts
- remains easy to supplement manually later

### 32.10 Error/loading behavior

- waiting-user failures show the standard friendly toast
- background failures log silently
- critical route errors use proper error UI
- loaders behave according to this document
- no raw stack traces are shown to end users

### 32.11 Testing and quality checks

Before declaring completion, run and fix:

- lint
- TypeScript typecheck
- production build
- automated tests
- Playwright smoke tests where configured

The browser console should not contain avoidable runtime errors/warnings during the main user flows.

### 32.12 No unfinished shortcuts

Do not leave avoidable:

- `TODO`
- fake API implementations
- dead code
- duplicate state
- hardcoded authorization bypasses
- temporary debug logging
- placeholder secrets

Placeholder page text/images are intentionally allowed where this document explicitly requests demo content.

---

## 33. Final Codex Instruction

Before writing code:

- read this `AGENTS.md` completely
- treat it as the primary project specification
- preserve all non-negotiable rules
- prefer simple and maintainable solutions
- do not substitute a different stack without explicit instruction
- do not pause for minor aesthetic ambiguities
- make reasonable decisions and continue
- complete the implementation and tests in the same workstream

## 34. Core Engineering Principle

**Use the simplest solution that fully satisfies the requirement.**

- Не вводити abstraction, dependency, state management, client-side JavaScript або architectural layer без конкретної потреби.
- Спочатку використовувати built-in можливості React і Next.js.
- Не ускладнювати простий код.
- Не створювати код "про запас".
- Не переписувати робочий код без причини.
- Зміни повинні бути мінімальними та сфокусованими на поставленій задачі.

---

# 35. NON-NEGOTIABLE RULES

1. Використовувати **Next.js App Router**.
2. Public pages за замовчуванням будувати через **SSG / ISR**, а не SSR.
3. SSR використовувати тільки при реальній request-time необхідності.
4. Server Components — за замовчуванням.
5. `"use client"` додавати тільки за необхідності.
6. Для application images використовувати `next/image`, а не raw `<img>`.
7. Для internal navigation використовувати `next/link`.
8. Styling: **SCSS Modules**, не додавати іншу styling system без окремої вимоги.
9. Не зберігати server state у Zustand.
10. Не дублювати TanStack Query data в Zustand.
11. Не використовувати React Query там, де достатньо Server Component / server-side data access.
12. Не додавати бібліотеки без конкретної потреби.
13. Не робити over-engineering і формальні abstraction layers.
14. Компоненти розділяти за відповідальністю, а не механічно.
15. Усі суттєві interaction повинні мати приємний loading/error UX.
16. Не показувати користувачу технічні деталі помилок.
17. Великі декоративні іконки — multi-color SVG / custom illustrations.
18. Mobile-first responsive design.
19. Touch UI не повинен залежати від hover.
20. Після зміни editable public content використовувати revalidation, а не автоматично переводити сторінку на SSR.
21. Усі зовнішні, async, database, authentication, upload та mutation operations повинні мати явну error handling strategy.
22. Не залишати порожні `catch` blocks і не приховувати помилки.
23. User-facing errors завжди показувати дружнім UI, а не raw technical message.
24. React rendering errors обробляти через Next.js `error.tsx` / Error Boundaries, а не намагатися вирішувати їх звичайним `try/catch`.
25. Не додавати `try/catch` механічно навколо кожної функції — використовувати його тільки там, де є реальний failure point і можливість коректної реакції.
26. Store image binaries in Cloudinary, not in PostgreSQL.
27. Use Neon Postgres for structured data and keep database access server-side.
28. Use Auth.js + Google OAuth for authentication; authorization comes from application roles/assignments.
29. Never trust client-side role checks for mutations; verify permissions on the server.
30. A teacher may edit only assigned class schedules and galleries; an admin may edit all classes.
31. The Archive must reuse the same `photos` records; never duplicate photo assets for archive display.
32. Gallery/archive thumbnails must use optimized small image variants; do not download originals for thumbnail grids.
33. Strip/avoid exposing EXIF GPS metadata from school photos.
34. Use React Hook Form + Zod for non-trivial editable forms and validate mutations again on the server.
35. Photo archive and large galleries must use automatic infinite scroll instead of visible numbered pagination.
36. Large photo lists must be virtualized; do not keep hundreds/thousands of photo cards mounted in the DOM.
37. Mobile photo loading should use small batches around 10 items; tablet/desktop may use larger batches around 50 items, with prefetch before the user reaches the end.
38. Loading the next gallery batch must use a local bottom loader/skeleton and must not block the entire screen.
39. Full-size gallery images load only when opened; grid/list views use optimized thumbnail variants.
40. Use Server Actions as the default internal mutation boundary; Route Handlers only where technically appropriate.
41. Every protected mutation authenticates, authorizes exact resource/class, validates with Zod, mutates, logs/audits as needed, and revalidates.
42. Persistent production logs use Neon tables, not local server files.
43. Log only errors, successful logins, important create/update/delete actions, and permission changes.
44. Google login alone never grants edit permissions; admin-managed database permissions do.
45. Admin permission updates must be transactional and server-authorized.
46. Photo Edit changes metadata only; replacing the image file is not allowed. Replace via delete + create.
47. Target photo size is <=5 MB; oversized images should be resized/compressed where technically possible.
48. If Cloudinary upload succeeds but DB creation fails, attempt cleanup of the orphaned Cloudinary asset and log failures.
49. Revalidate only affected schedule/gallery/archive/class caches.
50. Use Open-Meteo with approximately hourly server-side caching and graceful widget-local failure handling.
51. Follow the accessibility, SEO, environment-secret and minimal testing rules in this document.
52. The AI may propose page composition/layout solutions freely, but must not invent real factual school/village/history content as if it were true.
53. The site-wide visual language must repeatedly use Ukrainian symbols, school items, and soft child-friendly decorative motifs across all pages.
54. Visual motifs must be abundant and recurring across the site, not sparse one-off decorations.
55. Core colors across the site must noticeably include light pastel tones, yellow/blue Ukrainian-flag accents, and pink/blue child-friendly accents.
56. Idle pages should not animate continuously without user interaction; animation is primarily interaction-driven.
57. For all non-history content pages, temporary development content may use the same placeholder image set plus placeholder text until real materials are provided.
58. Development placeholder images may reuse one horizontal and one vertical demo photo in arbitrary order across the site.
59. Placeholder text may be standard lorem ipsum / neutral filler text with varied lengths to test the layout.
60. The History page is the main exception: it should use as much real verified public information as can be found about Йосипівка / Брусилівська громада / the local school.
61. If verified public history information is incomplete, do not fabricate missing facts; leave the page partial and easy to replace later.
62. Required routes must include `/school-life/gallery` in addition to all class gallery routes and `/archive`.
63. Use normalized relational schedule tables; do not store weekly schedules as nested JSON inside the user record.
64. User permissions are represented by `admin` and/or `class_1`...`class_4` roles and may be combined.
65. Seed exactly four classes and the specified six default lesson rows for development.
66. Seed the two specified development users and their initial permissions.
67. Build the initial implementation as one cohesive workstream including tests; do not stop for minor design ambiguity.
68. The project is not done until lint, typecheck, production build and configured tests pass or all remaining blockers are explicitly external credentials only.

---

# 36. Ідея

сайт сількської молодшої школи. в шкоолі 4 класи ( 1й,2й,3й,4й ). використання сайту 1 - для всіх охочих як інформативний сайт

2 - для викладачів щоб оновлювати сторінку домашнього завдання / процесу навчання / інших активностей - вхід за логіном

3 - для шкільного адміна щоб вносити нові фотографії і підписи до них - вхід за логіном

---

## 36.1 Основний лендінг

-> основний лендінг - інформація загального виду про школу вцілому + про село Йосипівка + про Брусилівський район Житомирської обл.

шапка стандартного наповнення -

місце під назву школи-района

місце під кнопки соц мереж.

місце під вхід для авторизованих користувачів

місце під стислу інформацію щодо погоди в селі Йосипівка Брусилівського району Житомирської обл. на зараз. При наведенні (натисканні на планшеті- телефоні) зявляється невелика полоска по погоді на тиждень з максимально стислою інфою

на ньому є система переходу на наступні сторінки

1 - сторінка Історії Району-Села-Школи

2 - сторінка загальної активності школи вцілому - фото школи - фото активностей з підписами - викладацький штат - фото загальне і фотографії вчителів окремо кожного з інформвцією хто це звідки що роблять їх діяльність їх здобутки. фото попередніх випусків з підписами

3 - сторінки Кожного з класів Окремо!

---

## 36.2 Сторінка кожного класу

-> на сторінці кожного класу : - назва класу ( принаймі ннапис 1й клас 2й клас і тд . 1й 2й 3й 4й ці написи мають бути у вигляді svg різнокольоровими з мякими формами - не забуваємо що все це - школа початкових класів - діточок!) - фото учнів з класним керівником

розклад занять на тиждень ( поточний день має підсвічуватись окремо Яскраво! - тобто можливо якоюсь іконкою навпроти з посмішкою соняшником -що завгодно щоб привернути увагу - Не просто кольором! все має бути Живе і привабливе!) - фотографії активностей - клас - на полі під час фізкультури - в столовці - тощо ( фотографії мають бути відокремлені часом - наприклад під мініатюрами фото - напис коли була створена фото і що це таке було коротко 1ю фразою . при натисканні на фото - фото розкривається на 80 відсотків екрану з максимальною якістю і тут також можливо присутня більш розширена інформація по фото коли створена що це було і так далі. при наведенні на мініатюру - зявляється лагідна анімаційна іконка яка підкаже що треба натиснути на мене щоб відкрити фотку )

---


## 36.3 Розклад занять — логіка і вигляд

Розклад має бути у вигляді аналога сторінки щоденника учня.

Візуально це **6 окремих прямокутних частин**:

- понеділок
- вівторок
- середа
- четвер
- п'ятниця
- субота

На desktop бажаний вигляд: **по три блоки у два стовпчики**.

Над кожним прямокутним блоком знаходиться окрема строка з назвою дня.

Кожен день складається з **6 рядків уроків**.

Зліва від назв уроків має бути чітко видимий стовпчик часу, наприклад:

- `09:00–09:30`
- наступний часовий слот
- і так далі для всіх шести уроків

Мета — щоб дитина або батьки одразу бачили **який урок і о котрій годині починається**.

Субота зазвичай буде порожньою, але вона все одно присутня в структурі розкладу.

Розклад валідний для конкретного поточного тижня.

У суботу або неділю викладач зазвичай готує розклад на наступний тиждень. Щоб не знищувати ще чинний розклад, режим редагування у вихідні має за замовчуванням відкривати наступний тиждень. Для звичайного відвідувача поточний тиждень залишається видимим до моменту початку нового.

### Доступ до розкладу

Якщо користувач — гість:

- він не логіниться
- бачить готовий розклад
- не бачить кнопок редагування

Якщо користувач — викладач даного класу:

- на цій самій сторінці з'являється кнопка **«Змінити»**
- після натискання місця з назвами уроків переходять у режим редагування
- замість звичайного тексту можуть з'являтися input-поля
- викладач заповнює / змінює назви предметів
- натискає **«Зберегти»**
- після успішного збереження сторінка повертається у звичайний режим перегляду

Викладач має право змінювати **тільки розклад свого класу**.

Якщо користувач — адміністратор:

- він може змінювати розклад будь-якого класу

Якщо викладач одночасно має роль адміністратора:

- він має права адміністратора для всіх класів
- і водночас може залишатися прив'язаним до свого класу як викладач

---

## 36.4 Основна частина класу і галерея

У кожного класу є:

1. **основна частина сторінки класу**
2. **галерея класу**

Основна частина сторінки класу для викладача **не редагується**.

Якщо основну інформацію класу треба змінити, це робить власник/розробник сайту або окремо визначений у майбутньому користувач, але не звичайний класний керівник.

Класний керівник працює тільки з:

- розкладом свого класу
- галереєю свого класу

Адміністратор може працювати з галереями всіх класів.

---

## 36.5 Галерея класу — вигляд

У галереї всі фотографії показуються у вигляді оптимізованих мініатюр.

Можливий основний варіант interaction:

- у звичайному стані видно мініатюру
- при наведенні мишки фотографія трохи затемнюється
- поверх фотографії плавно з'являється органічний напівпрозорий фон
- на ньому показується назва фотографії та дата/час, коли вона була зроблена

На touch-пристроях не покладатися тільки на hover. Інформація повинна бути доступною через tap/інший зрозумілий touch interaction.

### Відкриття фотографії

При звичайному натисканні на мініатюру фотографія **анімаційно** розгортається у lightbox/modal приблизно на **80–90% доступного екрана**.

У розгорнутому стані показуються:

- велике оптимізоване фото
- назва
- текст-опис, якщо він існує
- дата фотографії

Закриття також повинно бути анімаційним.

Натискання поза фотографією / по overlay закриває її та плавно повертає користувача до галереї.

На desktop додатково може бути зрозуміла кнопка закриття.

---

## 36.6 Галерея класу — редагування

Якщо користувач не авторизований:

- він тільки переглядає галерею

Якщо авторизований викладач відкрив галерею **свого класу**:

- біля кожної мініатюри з'являється кнопка **«Редагувати»**
- біля кожної мініатюри з'являється кнопка **«Видалити»**
- доступна кнопка додавання нової фотографії

Для галерей інших класів викладач цих controls не бачить і не має права виконувати відповідні mutations навіть через прямий запит.

Адміністратор бачить controls для галереї будь-якого класу.

### Редагування фотографії

Після натискання **«Редагувати»** відкривається форма / modal з можливістю:

- завантажити нову фотографію замість існуючої
- змінити назву
- змінити текст-опис
- за необхідності змінити дату
- натиснути **«Зберегти»**

Заміна самої фотографії не є обов'язковою — можна змінити тільки текстові поля.

### Видалення

Перед фактичним видаленням фотографії показати зрозуміле підтвердження, щоб випадковий tap/click не видалив фото.

Після успішного create/edit/delete:

- показати дружнє коротке success-повідомлення
- оновити відповідну gallery data
- виконати revalidation потрібної публічної сторінки / cache

При помилці працюють загальні правила loader/error notification з цього документа.

---

## 36.7 Архів фотографій

Можлива окрема сторінка **«Архів»**.

Архів використовує ті самі фотографії, які вже існують у галереях класів. Ніяких окремих копій фотографій створювати не потрібно.

Фотографії в Архіві показуються як загальний історичний список/галерея та можуть бути розділені:

- по роках
- всередині року по місяцях
- за потреби по класах

Для кожної фотографії використовуються вже існуючі:

- назва
- опис
- дата
- клас
- саме фото

Архів з часом може містити багато фотографій, тому не треба намагатися завантажити всі фотографії за всі роки одразу.

### Infinite scroll

Класичну видиму пагінацію типу:

`1 2 3 4 5`

**не використовувати** для фотоархіву та великих галерей.

Замість цього використовувати **automatic infinite scroll**:

- користувач просто прокручує список вниз
- коли він наближається до кінця вже завантаженого набору фотографій, автоматично запускається наступний запит
- нові фотографії плавно з'являються нижче
- не вимагати натискання кнопки `Next page`

Рекомендований розмір batch:

#### Mobile

- приблизно 2–3 фотографії в ряд, залежно від ширини екрана
- наступний batch завантажувати приблизно після 10 вже показаних фотографій
- точний threshold може бути трохи раніше, щоб користувач не побачив порожню паузу

#### Tablet / Desktop

- приблизно 5–10 фотографій в ряд, залежно від реальної ширини контейнера
- наступний batch — орієнтовно 50 фотографій
- prefetch / next fetch запускати трохи до фактичного кінця списку

Batch size та threshold не повинні бути жорстко прив'язані тільки до CSS breakpoint, якщо реальна ширина контейнера відрізняється.

### Virtualization

Великі списки фотографій повинні бути **віртуалізовані**.

Не тримати в DOM сотні або тисячі повноцінних photo-card elements одночасно.

Мета virtualization:

- рендерити тільки фотографії, які видимі користувачу або знаходяться близько до viewport
- зменшити DOM size
- знизити memory usage
- зберегти плавний scroll навіть при тисячах фотографій

Virtualization повинна працювати разом із infinite scroll.

### Gallery / Archive loading behavior

- використовувати оптимізовані thumbnails
- full-size image не завантажувати до відкриття lightbox/modal
- наступний batch завантажувати до того, як користувач фізично дійшов до останнього елемента
- при завантаженні нового batch не блокувати весь екран full-screen loader
- замість цього показувати локальний animated loader / skeleton унизу галереї
- нові елементи повинні з'являтися плавно
- не скидати scroll position після fetch
- не дублювати вже завантажені photo records
- зберігати стабільний порядок сортування

### Fetching strategy

Для infinite scroll використовувати cursor-based pagination / continuation cursor, якщо це зручно для обраної query architecture.

Не використовувати offset pagination як єдиний механізм, якщо при великому архіві cursor-based підхід дає стабільніший результат.

Потрібна логіка:

- групування за роком/місяцем
- фільтрація за класом, якщо вона ввімкнена
- infinite scroll
- virtualization
- optimized thumbnails
- велике фото завантажується тільки після відкриття

---


## 36.8 Адмін-кабінет і розподіл прав

У адміністратора в шапці сайту має бути окрема зрозуміла кнопка **Адмін-кабінет**.

По натисканню відкривається окрема сторінка керування користувачами.

Показуються всі користувачі, які хоча б один раз успішно логінились через Google.

Для кожного користувача:
- email
- ім'я, якщо є
- checkbox **Admin**
- checkbox **1 class**
- checkbox **2 class**
- checkbox **3 class**
- checkbox **4 class**

Адміністратор виставляє права і натискає **Save**.

Сам факт входу через Google прав на редагування не дає. Права розподіляє адміністратор.

---

## 36.9 Аватар залогіненого користувача

Залогінений користувач бачить у шапці красиву аватарку.

Якщо окрему фотографію профілю не використовуємо:
- показуємо першу літеру імені
- фон/малюнок відповідає дитячому стилю сайту

При hover/focus, а на mobile/tablet по tap, показуємо:
- ім'я
- прізвище, якщо є
- email

Якщо поля немає — його не показуємо.

---

## 36.10 Помилки під час взаємодії

Якщо людина виконує Save/Delete/Add/Login або іншу дію і чекає завершення, при помилці показати:

**«Щось пішло не за планом. Спробуйте трохи пізніше.»**

Повідомлення:
- плавно з'являється
- справа знизу на desktop
- адаптивно на mobile
- приблизно 5 секунд
- плавно зникає
- може мати здивованого дитячого героя

Якщо помилка сталася у фоновому процесі:
- глобальне повідомлення не показувати
- тихо записати помилку в технічний лог

---

## 36.11 Додавання, редагування та видалення фото

Бажана ціль — **до 5 MB на фотографію**.

Якщо фото більше:
- сайт автоматично пробує зменшити розмір/вагу
- показує локальний loader
- після підготовки продовжує завантаження

Підтримати стандартні формати Android/iPhone.

### Додати
- фото
- назва
- опис, якщо є

### Редагувати
Редагуються тільки:
- назва
- опис
- за необхідності дата

**Саму фотографію через Edit замінити не можна.**

Якщо треба замінити фото:
1. видалити старе
2. створити нове

### Видалити
Видаляється:
- файл
- назва
- опис
- службовий запис

Перед видаленням потрібне підтвердження.

---

## 36.12 Редагування без окремої teacher-сторінки

Викладач відкриває **ту саму сторінку класу**, яку бачить звичайний відвідувач.

### Розклад
Гість бачить тексти уроків.

Викладач свого класу / адмін бачить **Змінити**.

Після натискання на тих самих місцях з'являються inputs.

Після Save нові дані одразу відображаються на цій самій сторінці.

### Галерея
Гість бачить фото.

Дозволений викладач / адмін додатково бачить:
- **Редагувати**
- **Видалити**
- **Додати**

Після успішної операції оновлюється ця галерея і пов'язаний Архів.

---

## 36.13 Погода

Є компактний віджет погоди для потрібного населеного пункту.

Дані оновлювати **раз на одну годину**.

По натисканню показується стислий прогноз на тиждень.

Якщо API тимчасово не відповідає:
- сайт продовжує працювати
- у самому віджеті:
  **«Не вдалося оновити погоду. Натисни на мене, щоб спробувати ще раз.»**
- по натисканню робимо новий запит
- технічну помилку записуємо в лог

---



## 36.14 Наповнення сторінок на етапі розробки

Поки реальні матеріали для більшості сторінок ще не зібрані, сайт на етапі розробки заповнюється **тимчасовим демо-контентом**.

Це правило стосується:

- Landing
- Загальної активності школи
- Основної частини сторінок класів
- Галерей класів як прикладу структури
- Архіву як прикладу структури
- інших статичних контентних сторінок, **окрім сторінки Історія**

### Тимчасові фотографії

Для заповнення демонстраційного контенту використовувати **одну й ту саму тимчасову фотографію**.

Допускаються два варіанти цієї фотографії:

- **горизонтальний**
- **вертикальний**

Їх можна вставляти у довільному порядку по всьому сайту.

Джерело тимчасової фотографії:

- або будь-яке дозволене тестове зображення
- або згенероване зображення
- або нейтральне демо-зображення

### Розмір тимчасових зображень

Базовий орієнтир для тимчасового вихідного зображення:

- **4080 × 2296**

Це близько до типової фотографії з телефона.

Водночас система повинна нормально працювати й з:

- більшими зображеннями
- меншими зображеннями

Тобто тимчасове наповнення повинно допомагати тестувати реальну поведінку адаптивних блоків.

### Тимчасові тексти

Біля таких тимчасових фото використовувати звичайний текст-рибу:

- `Lorem ipsum`
- інший нейтральний placeholder text

Обсяг тексту може бути різним:

- приблизно по висоті фотографії
- значно більший за фотографію
- короткий
- середній
- довгий

Тобто шаблон сторінок має витримувати різну довжину тексту.

### Тимчасові назви

Назви тимчасових фото та блоків можуть бути простими, наприклад:

- `Фото 1`
- `Фото 2`
- `Фото 3`

У майбутньому ці матеріали будуть вручну замінені на реальні.

---

## 36.15 Сторінка Історія — окремий виняток

Сторінка **Історія** не повинна заповнюватися лише `Lorem ipsum`.

Для неї потрібно використати **реальні дані з інтернету**, наскільки це можливо.

Тема сторінки:

- село **Йосипівка**
- Брусилівський район / Брусилівська громада
- Житомирська область
- школа в селі

### Правило наповнення для сторінки Історія

ШІ повинен:

- шукати реальні публічні джерела
- збирати стільки перевіреної інформації, скільки реально знайде
- використовувати реальні тексти / факти в адаптованому вигляді
- використовувати реальні фотографії, якщо вони доступні для розуміння змісту сторінки
- не вигадувати історичні факти, якщо їх не знайдено

### Якщо інформації мало

Якщо по селу або по школі доступно мало перевірених публічних даних:

- використати все, що вдалося надійно знайти
- не заповнювати прогалини вигаданими подробицями
- залишити можливість для подальшого ручного доповнення
- останні кілька років історії можуть бути додані власником сайту пізніше вручну

### Джерела

Перевагу віддавати:

- офіційним сайтам громади / органів місцевого самоврядування
- довідковим публічним джерелам
- відкритим джерелам із явною прив'язкою до потрібного села / громади / школи

Якщо джерело не вдається підтвердити або воно суперечливе, краще не використовувати сумнівний факт як нібито достовірний.

---

## 36.16 Свобода композиції та layout-рішень для ШІ

Точне розташування всіх текстів, фотографій і контентних блоків **не потрібно жорстко фіксувати до пікселя**.

ШІ / Codex може сам запропонувати візуальне рішення сторінок, якщо воно:

- логічне
- охайне
- сучасне
- приємне для перегляду
- відповідає типу сторінки
- не суперечить технічним правилам цього документа

### Що ШІ може вирішувати самостійно

- порядок окремих контентних секцій, якщо він явно не заданий
- спосіб чергування текстових та фото-блоків
- шаховий порядок блоків або симетричний порядок
- де краще поставити фото, а де текст
- вигляд title / hero section кожної сторінки
- декоративні вставки, фонові елементи та композицію секцій
- варіант подачі навігації, якщо вона зручна і лаконічна

### Базова логіка звичайних контентних сторінок

Для звичайних сторінок типу:

- Landing
- Історія
- Загальна активність школи
- Основна частина сторінки класу

можна використовувати стандартний підхід:

- фото з одного боку, текст з іншого
- текст і фото можуть чергуватися
- можливий шаховий порядок
- можливе комбінування кількох різних типів секцій
- при великій кількості контенту сторінка просто природно скролиться вниз

Ширина контентної області на всіх сторінках має бути узгодженою та приблизно однаковою.

### Правило про анімацію

Якщо користувач **нічого не чіпає**, сайт не повинен без причини весь час щось анімувати.

Анімація з'являється тоді, коли користувач:

- наводить мишку
- натискає
- відкриває
- закриває
- взаємодіє з елементом переходу або action-елементом

Тобто повинні оживати **саме інтерактивні елементи**, а не весь сайт безперервно.

### Важливе обмеження

ШІ може вигадувати **layout і спосіб подачі**, але **не повинен вигадувати реальні факти** про школу, село, район, випуски, вчителів чи події, якщо ці факти ще не надані.

Якщо реальний контент відсутній, використовувати:

- placeholder content
- нейтральний демо-контент
- або явно тимчасові блоки, які легко замінити пізніше

---

# 37. Забарвлення

Сайт має бути приємним для перегляду в стилі молодших шкіл — усе округле, доброзичливе, м'яке, емоційно тепле й таке, що викликає відчуття безпеки, дитячості, навчання, сімейності та любові до Батьківщини.

### Обов'язковий візуальний стек елементів по всьому сайту

На всьому сайті у великій кількості мають бути присутні й регулярно повторюватися такі групи елементів:

#### 1. Символіка України

- герб України
- прапор України
- соняшники
- калина
- мотиви українських полів
- жовто-блакитні декоративні вставки
- інші лаконічні елементи, які викликають асоціацію з Україною

#### 2. Шкільні елементи

- зошити
- олівці
- пензлі
- фарби
- лінійки
- циркулі
- книжки
- ноти
- шкільне приладдя
- фізкультурні елементи
- інші доброзичливі й зрозумілі дитині навчальні мотиви

### Принцип кількості й насиченості

Цих елементів на сайті має бути **багато**.

Тобто не так, що на всьому сайті є:

- один герб
- одна гілка калини
- одна маленька лінійка
- один олівець

а так, щоб по всьому сайту постійно відчувалася присутність:

- України
- школи
- дитячого навчання
- тепла
- радості
- сімейності

### Як саме це застосовувати

По всьому сайту використовувати поєднання:

- великих напівпрозорих тематичних об'єктів у фоні
- середніх декоративних вставок
- невеликих непрозорих акцентних ілюстрацій
- невеликих кольорових SVG-елементів
- м'яких патернів і тематичних міні-ілюстрацій

Це повинно бути зроблено **лаконічно**, але **не скупо**.

Тобто сайт не має виглядати порожнім або занадто стриманим. Він повинен бути візуально багатим, але не перевантаженим хаосом.

### Кольорова палітра

Базові кольори:

- світлі
- пастельні
- приємні
- м'які
- теплі або нейтрально-спокійні

Обов'язкові колірні напрями:

#### 1. Кольори прапора України

- жовті
- блакитні
- сині
- жовто-блакитні поєднання

#### 2. Дитячі кольори

- рожеві тони
- голубі тони

Ці кольори повинні бути помітно присутні по всьому сайту:

- у декоративних блоках
- у фонах
- у заголовках
- у кнопках
- у підсвітках
- у іконках
- у дрібних графічних акцентах

### Настрій різних сторінок

#### Landing та загальна активність школи

- більш строгі
- більш офіційні
- дитячі елементи або мінімальні, або дуже стримані
- але українська символіка та шкільна атмосфера присутні чітко

#### Історія

- візуально історична сторінка
- фото можуть бути в історичних рамках
- можливий легкий нахил фотографій
- фон може бути злегка вицвілим, зістареним, архівним, сіруватим або паперовим
- загальна атмосфера повинна відчуватися історичною

#### Сторінки класів і галереї

- найяскравіші
- найбільш дитячі
- найбільш кольорові
- округлі форми
- більше веселих шкільних і сімейних акцентів
- більше рожевих, голубих, жовтих і блакитних відтінків
- найбільше дитячих шкільних ілюстративних елементів

#### Архів

- спокійніший
- ближчий до стилю landing
- без надмірної дитячості
- але все одно в тій самій загальній візуальній системі

#### Адмін-кабінет

- головне функціональність
- краса другорядна
- допускається значно простіший і стриманіший вигляд

### Заголовки сторінок

Назва кожної сторінки повинна бути окремим сильним візуальним блоком.

Бажаний підхід:

- напівпрозорий прямокутник або інша м'яка форма
- тематичний малюнок по сенсу сторінки
- назва сторінки всередині або поруч
- title block повинен відразу емоційно відкривати зміст сторінки

Приклади по сенсу:

- **«Історія нашої школи»** — історична мініатюра, контури села, архівні мотиви
- **«1 клас»** — яскравий дитячий шкільний мотив
- **«Шкільна активність»** — більш стриманий шкільний сюжет
- **«Архів»** — спокійний тематичний графічний блок

### Загальне правило

Уся візуальна система сайту повинна створювати відчуття:

- початкової школи
- тепла
- любові до дітей
- любові до України
- радості навчання
- живого, але доброзичливого і не хаотичного простору

ШІ повинен не боятися використовувати **багато** тематичних елементів, якщо вони поєднані охайно, системно й красиво.
