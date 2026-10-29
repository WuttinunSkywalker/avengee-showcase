# Avengee Team Showcase

[ภาษาไทย](#ภาษาไทย) · [English](#english)

---

## ภาษาไทย

เว็บรวมผลงานของ **Avengee Team** หน้าแรกเป็น Portal ให้เลือกดูผลงาน แต่ละผลงานเป็นแอปที่ใช้ได้จริงแยกกัน มีแบรนด์ ธีม และฟีเจอร์ครบตามประเภทของมัน รองรับทั้งภาษาไทยและอังกฤษ

| ผลงาน | ประเภท | ลิงก์ |
| --- | --- | --- |
| Baan Lamai (บ้านละไม) | ระบบจองคิวสปา + หลังร้าน | `/th/spa`, `/th/spa/admin` |
| Kaffa Roasters, Krua Yai, Talad, Sorn Studio | กำลังทำ | ดู `ROADMAP.md` |

### เริ่มใช้งาน

ต้องมี Node.js 22 ขึ้นไป และ pnpm

```bash
pnpm install
pnpm dev            # เปิด http://localhost:3000 (ระบบจะพาไป /th หรือ /en ตามภาษาเบราว์เซอร์)
```

### คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| --- | --- |
| `pnpm lint` / `pnpm typecheck` | ตรวจโค้ดและ type |
| `pnpm test` | unit test (logic) + integration test (คอมโพเนนต์) |
| `pnpm test:e2e` | ทดสอบในเบราว์เซอร์จริงทั้งเดสก์ท็อปและมือถือ (build แล้วรันที่พอร์ต 3200 ให้เอง) |
| `pnpm build` | build สำหรับ production |
| `pnpm capture:showcase` | ถ่ายภาพหน้าจอใหม่สำหรับการ์ดบน Portal (ต้องเปิด `pnpm start --port 3200` ไว้) |
| `pnpm capture:og` | สร้างรูปแชร์ลิงก์ใหม่ (ต้องเปิดเซิร์ฟเวอร์ไว้เหมือนกัน) |

### เพิ่มผลงานใหม่

1. สร้างโฟลเดอร์ `src/app/[lang]/<ชื่อแอป>/` ใน `layout.tsx` ครอบด้วย `<div data-app="<ชื่อแอป>">` และใส่ `<ShowcaseReturn />`
2. ใส่ธีมสีและฟอนต์ของแอปใน `src/app/globals.css` (ใช้ selector `:root:has([data-app="<ชื่อแอป>"])`)
3. เขียน logic ใน `src/features/<ชื่อแอป>/lib` พร้อม unit test และข้อความทั้งสองภาษาใน `i18n/messages.ts`
4. เปลี่ยนสถานะใน `src/config/site.ts` เป็น `live` แล้วรัน `pnpm capture:showcase` กับ `pnpm capture:og`

กติกาทั้งหมดอยู่ใน `CLAUDE.md` เช่น ห้ามมีคำว่า demo ในแอป และภาษาไทยต้องเขียนให้เป็นธรรมชาติ ไม่ใช่แปลตรงตัว

### ขึ้นระบบบน Vercel

1. เอาโปรเจกต์ขึ้น GitHub
2. ที่ [vercel.com/new](https://vercel.com/new) เลือก repo นี้ ไม่ต้องตั้งค่าอะไรเพิ่ม Vercel รู้เองว่าเป็น Next.js
3. ถ้ามีโดเมนของตัวเอง ตั้ง environment variable `NEXT_PUBLIC_SITE_URL` (เช่น `https://your-domain.com`) เพื่อให้ sitemap และรูปแชร์ใช้โดเมนนั้น

หรือใช้ CLI: `npx vercel` (preview) และ `npx vercel --prod` (production)

---

## English

Portfolio site for **Avengee Team**. The home page is a portal for choosing a showcase; each showcase is a standalone, working app with its own brand, theme and complete feature set. Everything is available in Thai and English.

| Showcase | Type | Paths |
| --- | --- | --- |
| Baan Lamai | Spa booking + staff dashboard | `/en/spa`, `/en/spa/admin` |
| Kaffa Roasters, Krua Yai, Talad, Sorn Studio | In progress | see `ROADMAP.md` |

### Getting started

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000, redirects to /en or /th from the browser language
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm lint` / `pnpm typecheck` | Lint and type-check |
| `pnpm test` | Unit tests (logic) and integration tests (components) |
| `pnpm test:e2e` | Browser tests on desktop and mobile (builds and serves on port 3200 automatically) |
| `pnpm build` | Production build |
| `pnpm capture:showcase` | Re-capture portal card screenshots (needs `pnpm start --port 3200` running) |
| `pnpm capture:og` | Re-capture share images (needs a running server) |

### Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn/ui on Radix, Motion, Recharts, TanStack Table, React Hook Form + Zod, Zustand. Tests use Vitest, Testing Library, Playwright and axe-core.

### Adding a showcase

1. Create `src/app/[lang]/<slug>/`; its `layout.tsx` wraps children in `<div data-app="<slug>">` and renders `<ShowcaseReturn />`.
2. Add the app's colour tokens and font roles to `src/app/globals.css` under `:root:has([data-app="<slug>"])`.
3. Put logic in `src/features/<slug>/lib` with unit tests, and copy for both languages in `i18n/messages.ts`.
4. Set the entry in `src/config/site.ts` to `live`, then run `pnpm capture:showcase` and `pnpm capture:og`.

Project rules live in `CLAUDE.md` (no "demo" wording inside apps, natural Thai copy, quality gate).

### Deploying to Vercel

1. Push the project to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new). No configuration is needed; Next.js is detected automatically.
3. With a custom domain, set `NEXT_PUBLIC_SITE_URL` (for example `https://your-domain.com`) so the sitemap and share images use it.

Or with the CLI: `npx vercel` for a preview and `npx vercel --prod` for production.
