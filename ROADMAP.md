# Roadmap

Work top to bottom. Each item should finish with the quality gate green (see CLAUDE.md). Tick items off and add new findings at the bottom of the relevant section.

## Now

- [x] Portal motion: hero intro (phrases rise in turn), scroll-linked reveals with CSS view timelines (screenshot wipe, phone mock-up settles, services rules and the process line draw, cards and text rise), header scroll-progress bar; no JS, nothing hidden without support or with reduced motion; e2e checks reveals finish and reduced motion
- [x] Portal cards: live apps full width and listed first, coming-soon cards in one row; Open App and Staff Dashboard buttons equal width (side by side when the column allows, stacked otherwise); Thai uses "ระบบหลังบ้าน"
- [x] Portal: each live card steps through real screens (home, booking or product page, staff dashboard) while hovered or focused; dots with a label pick a screen by mouse, touch or keyboard; no autoplay with reduced motion. Screens come from `pnpm capture:showcase` (`images.tour` in `src/config/site.ts`)
- [x] Filter chips on the portal lost their gap: a `style` prop on ToggleGroup replaced its internal `--gap`. Reveal styles now go on a wrapper; e2e checks the chips stay apart
- [x] Portal hero: a fanned stack of the live apps' real screens (two desktop, one phone) beside the text; each opens its app, the pointed-at card comes to the front, the stack spreads on hover and fans in on load (off for reduced motion); built from `showcases`, so new live apps join automatically

- [x] Regenerate portal screenshots from the production build, per language, with a phone view on the card (`pnpm capture:showcase`, needs `pnpm start --port 3200`)
- [x] Portal and app metadata: `sitemap.ts`, `robots.ts`, share images per language (browser-rendered via `/[lang]/og/[app]` + `pnpm capture:og`, because next/og drops stacked Thai tone marks), SVG + Apple icons for the portal and Baan Lamai
- [x] `public/images/CREDITS.md` listing every photo source (rawpixel CC0 via Openverse); a unit test fails if a new photo is not credited
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`): lint, typecheck, unit + integration, then build + Playwright desktop/mobile with the report uploaded on failure. Runs once the project is pushed to GitHub
- [x] README in Thai and English: what the project is, how to run, scripts, how to add a showcase, how to deploy to Vercel

## Showcase 2: Kaffa Roasters (online shop, `/[lang]/shop`)

- [x] Brand, theme tokens and fonts (espresso ink on white, coffee-cherry red, roast spectrum; Archivo expanded + Instrument Sans, Kanit + IBM Plex Sans Thai), CSS coffee-bag artwork, home page with catalogue grid, farm altitude chart and café at `/[lang]/shop`
- [x] Catalogue at `/[lang]/shop/coffee`: roast, process, province, type and in-stock filters with live counts, Thai/English search across names, farms and tasting notes, five sorts, removable chips, URL-synced state, server-rendered fallback, mobile filter sheet
- [x] Product page `/[lang]/shop/coffee/[id]`: gallery (bag, brew guide, farm), size with sold-out state, grind for beans, quantity capped by stock, reviews in the language they were written, "pairs well with", 404 for unknown ids; product cards link to it; sitemap lists every product
- [x] Cart drawer in the header: persisted cart, quantity edits within stock, remove, ฿60 shipping under ฿1,000 with free-shipping progress
- [x] Promo codes (FIRSTCUP 10% up to ฿200, KAFFA100 over ฿800, FREESHIP) in the cart and at checkout, re-checked whenever the cart changes
- [x] Checkout `/[lang]/shop/checkout`: contact, address with searchable 77-province picker and postcode-prefix check, Kerry/Flash/Thailand Post, PromptPay QR or test-mode card (Luhn, brand, expiry, CVC; only test numbers accepted, only brand + last 4 stored), basic order page `/[lang]/shop/order?ref=`
- [x] Order tracking on `/[lang]/shop/order?ref=`: six-step timeline (placed, paid, roasting, shipped, out for delivery, delivered) driven by payment time and the Tuesday roast, carrier delivery window and tracking number, PromptPay "I've paid" confirmation; `/[lang]/shop/orders` lists orders on this device
- [x] Roastery desk at `/[lang]/shop/admin`: overview (30-day revenue, orders, average order, waiting to ship, daily revenue chart, roast plan in kg for the next Tuesday, stock alerts, latest orders) and `/orders` (search, status filter, paging, URL-synced order sheet, forward-only status changes with undo, reset); ~520 seeded orders over 60 days plus orders placed on this device; portal card and shop footer link to it
- [x] Portal card set to live (screenshots with per-showcase focal point, share card, apple-icon)
- [x] Unit, integration and e2e coverage in both languages for each shop feature: `tests/integration/shop.test.tsx` covers the purchase panel (size, grind, stock cap, sold out, drip bags), promo field (empty, unknown, min spend, apply/remove, re-check), tracking timeline (current step, PromptPay wait) and the admin orders table (URL filters, order sheet status change), EN and TH
- [x] Cart footer has a real Checkout button
- [x] `Stars`, `isValidPhone` and the date labels moved to `src/components/stars.tsx`, `src/lib/phone.ts` and `src/lib/dates.ts` (spa re-exports them); `tests/unit/boundaries.test.ts` fails if one app imports another, or shared code imports an app
- [x] Unknown product ids are answered with 404 in `src/proxy.ts`, built from the product data; `tests/unit/proxy.test.ts` checks every listed coffee passes, unknown ids and extra segments 404, and bare URLs redirect by language. If products ever come from an API, the proxy needs a cached id list
- [x] Orders saved under `kaffa:orders:v1` are upgraded on first load (card orders paid at checkout, PromptPay left to confirm, line `kind` from product data), saved under v2 and the old key removed; unit, integration and e2e cover it
- [x] Integration tests for the checkout form (every field error, province picker and postcode check, carrier fee, card formatting, real-card refusal, card order saved with brand + last 4 only, Thai) and cart drawer (lines, free-shipping progress, quantities, remove, Thai) in `tests/integration/shop-checkout.test.tsx`
- [ ] Admin: inventory page (adjust stock per size, restock log) and a customers view; stock alerts currently read static product data
- [ ] Daily revenue chart ends on today, which is only partly over, so the last point always dips; mark it "today so far" or end at yesterday
- [ ] Admin status overrides are per device (`kaffa:admin:v1`); a staff change is not reflected on the customer's tracking page

## Showcase 3: Krua Yai (QR table ordering, `/[lang]/restaurant`)

- [ ] Table landing from QR (`?table=7`), photo menu by category, spice level and add-ons
- [ ] Order basket, send to kitchen, order status, call staff, split bill
- [ ] Kitchen board (live columns: new, cooking, served) and simple sales summary

## Showcase 4: Talad (multi-vendor marketplace, `/[lang]/marketplace`)

- [ ] Seller storefronts, product search across sellers, multi-seller cart split at checkout
- [ ] Seller dashboard: listings, orders, payouts

## Showcase 5: Sorn Studio (single-page site, `/[lang]/studio`)

- [ ] One-page architect portfolio: hero, project gallery with lightbox, services, process, contact form with validation and success state

## Baan Lamai improvements

- [ ] Guest "manage booking" page (reference + email): reschedule or cancel within policy
- [ ] Admin week schedule view per therapist with drag-free reassign via dialog
- [ ] Admin customers page: visit history, total spend, notes
- [ ] Mobile date strip: scroll the selected date into view; show "next free day" shortcut
- [ ] Gift vouchers purchase flow
- [ ] Therapist avatars show Latin initials (KS, PC) on the Thai site; use the Thai nickname's first letter there
- [x] The portal corner button now hides while scrolling down and returns on scroll up

## Quality backlog

- [ ] Next dev server races under full parallel e2e load ("Failed to generate static paths … Unexpected end of JSON input"); the gate now prefers e2e against production

- [ ] Turbopack dev HMR sometimes keeps an old copy of an edited messages module (`t.catalog` undefined until restart); investigate or document a restart step

- [ ] Share cards must be re-captured (`pnpm capture:og`) whenever a hero title changes; add a check that fails when the copy and card drift

- [x] Recharts entry animations never finish under Playwright's fixed clock, so screenshots show empty charts; both apps' charts now render without the entry animation

- [x] Admin sidebar nav items (both apps) lost their styles because `NavLink` dropped the props from `SidebarMenuButton asChild`; it now forwards them. The floating "all showcases" button covered the sidebar footer, so admin screens show it in the top bar instead

- [x] Portal kept the last app's colours after leaving it: Next keeps the previous route mounted with `display: none`, and `:root:has([data-app])` still matched. Theme selectors now ignore hidden wrappers; e2e covers link and history navigation

- [ ] GitHub Actions warns that `actions/checkout@v4`, `actions/setup-node@v4` and `pnpm/action-setup@v4` target Node 20 (deprecated); move to releases that run on Node 24

- [ ] Lighthouse pass on every page (performance ≥ 90 mobile, accessibility 100)
- [ ] Review all Thai copy once more by reading it aloud; fix anything that sounds translated
- [ ] Dark mode visual check for every page
