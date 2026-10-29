@AGENTS.md

# Avengee Team showcase

Portfolio site for **Avengee Team** (freelance web team, Thailand). The home page is a **portal**; each showcase is a standalone, real-feeling app with its own brand, theme, fonts and navigation.

## Non-negotiables

- **No "demo", "fictional", "sample project" wording inside apps.** Apps must look like real products. The only link back to the portal is the small `ShowcaseReturn` corner button.
- **English + Thai for everything.** Routes are `/en/...` and `/th/...` (`src/app/[lang]`). Thai copy is written for Thai readers, not translated word for word: natural, warm, the way a person would actually type it. Match each brand's voice (spa: polite with ค่ะ/นะคะ; portal: friendly, direct). Never leave English inside Thai UI except brand names and terms Thais really use (PromptPay is "พร้อมเพย์").
- Portal contact is `avengee.team@gmail.com` only (no LINE yet). No prices on the portal.
- Every user-facing string lives in a typed messages file; Thai must cover every English key (enforced by `tests/unit/i18n.test.ts`).

## Layout

```
src/app/[lang]/              root layout (fonts, theme, locale) + portal page
src/app/[lang]/<app>/        one folder per showcase app; its layout sets data-app="<app>"
src/features/portal/         portal messages and components
src/features/<app>/          data/, lib/ (pure logic), store/, hooks/, i18n/, components/
src/i18n/                    locale config, provider, helpers
src/config/site.ts           team info + showcase list shown on the portal
src/app/globals.css          design tokens; each app's theme is scoped with :root:has([data-app="<app>"])
```

Adding a showcase: create `src/app/[lang]/<slug>/layout.tsx` wrapping children in `<div data-app="<slug>">` + `<ShowcaseReturn />`, add its tokens and font roles to `globals.css` (copy an existing app's `:root:has([data-app=…]:not([style*="display: none"], …))` selector: Next keeps the previous route mounted but hidden, and a plain `:has([data-app])` would leak the theme onto the next page), add fonts to the root layout with `preload: false`, put logic in `src/features/<slug>/lib` with unit tests, then set its entry in `src/config/site.ts` to `status: "live"`. Add `icon.svg` + `apple-icon.tsx` in the app folder, a share card in `src/features/og/og-cards.tsx`, and point the app layout's `openGraph.images` at `/og/<slug>-<lang>.png`. With a server running, `pnpm capture:showcase` and `pnpm capture:og` regenerate the portal screenshots and share cards (add `http://localhost:3200 <id>` to redo one app) (restart `pnpm start` afterwards: it only serves public/ files that existed when it started) (do not use next/og for text: it breaks Thai tone marks).

## Conventions

- Next.js 16 with Cache Components: read `node_modules/next/dist/docs/` before using unfamiliar APIs. Client components that read search params go inside `<Suspense>`.
- Anything time- or storage-dependent renders after mount (`useSyncExternalStore` with a `null` server snapshot) to avoid hydration mismatches. Date and currency strings are formatted by hand, not with `Intl`, so server and browser output match.
- Mock data must be realistic and deterministic (seeded PRNG in `src/lib/random.ts`). Use the reserved `.example` domain for any email that isn't the team's own.
- shadcn/ui components live in `src/components/ui`; follow `.claude/skills/shadcn` rules (FieldGroup/Field forms, ToggleGroup for option sets, semantic tokens, no manual `dark:` colours).
- Design: load `.claude/skills/frontend-design` before new UI. Each app gets a distinct, subject-specific look. Avoid the generated-page tells it lists.
- Charts: load the `dataviz` skill first; single-series charts use one hue with 3:1 contrast in both themes.
- Free images only (CC0 / Unsplash licence). Record sources in `public/images/CREDITS.md`.

## Quality gate (run before finishing any change)

```bash
pnpm lint && pnpm typecheck && pnpm test   # unit (node) + integration (jsdom)
pnpm build
pnpm test:e2e   # builds and serves production on 3200 (preferred: what visitors and CI get)
# BASE_URL=http://localhost:3100 pnpm test:e2e runs against the dev server, but under full parallel load
# Next's dev server can fail with "Failed to generate static paths … Unexpected end of JSON input".
# If that appears, rerun against production before treating failures as real.
```

`pnpm dev` builds into `.next-dev` and `pnpm build` into `.next`, so both can run at once. If a page ever serves stale CSS or 500s with a JSON parse error, stop every `next` process, delete both folders and restart.

E2E runs desktop and Pixel 7 projects at a fixed clock (Wed 4 Nov 2026, 09:00 Bangkok) and fails on console errors and serious axe violations. Also screenshot changed pages at 1440px and 390px in both languages and look at them before calling a change done.

## Improvement loop

The 30-minute loop works from `ROADMAP.md`: take the top unchecked item (or the next slice of it), build it, pass the quality gate, then tick it off and note anything discovered. Keep each iteration small enough to finish green.
