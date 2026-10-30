# Roadmap

Work top to bottom. Each item should finish with the quality gate green (see CLAUDE.md). Tick items off and add new findings at the bottom of the relevant section.

## Now

- [x] Portal section motion in every browser: headings rise line by line from a mask (GSAP SplitText, free since 2025), text blocks, rules, screenshots and phone mock-ups reveal on entering view (IntersectionObserver + CSS transitions, so frozen-clock tests and screenshots still settle), and the hero stack tilts in 3D toward the pointer with each screen at its own depth. three.js was considered and left out: too heavy for a landing page that currently loads fast
- [x] Portal "wow" pass (asked for on 2026-10-30): hero grid lights up around the cursor, live showcase cards tilt toward the pointer with a moving glare, coming-soon cards glow where pointed, and a slow marquee of the business types we build for (pauses on hover). Mouse and pen only, no React re-renders (CSS variables), reduced motion turns them off and the marquee into a still list
- [x] "How we work" runs in every browser: once in view the line fills 1 → 2 → 3 → a live server icon, each step lighting up as it's reached (IntersectionObserver + transitions, not scroll timelines that older Safari and Firefox lack)

- [x] Portal motion: hero intro (phrases rise in turn), scroll-linked reveals with CSS view timelines (screenshot wipe, phone mock-up settles, services rules and the process line draw, cards and text rise), header scroll-progress bar; no JS, nothing hidden without support or with reduced motion; e2e checks reveals finish and reduced motion
- [x] Portal cards: live apps full width and listed first, coming-soon cards in one row; Open App and Staff Dashboard buttons equal width (side by side when the column allows, stacked otherwise); Thai uses "ระบบหลังบ้าน"
- [x] Portal: each live card steps through real screens (home, booking or product page, staff dashboard) while hovered or focused; dots with a label pick a screen by mouse, touch or keyboard; no autoplay with reduced motion. Screens come from `pnpm capture:showcase` (`images.tour` in `src/config/site.ts`)
- [x] Portal "How we work" is a real stepper: numbered circles joined by short connectors that fill in brand blue as you scroll (horizontal on desktop, vertical on phones), instead of a faint hairline running through the numbers and past the last step
- [x] A card screen that fails to load drops out with its dot, so the portal never shows a broken image
- [x] Filter chips on the portal lost their gap: a `style` prop on ToggleGroup replaced its internal `--gap`. Reveal styles now go on a wrapper; e2e checks the chips stay apart
- [x] Portal hero: a fanned stack of the live apps' real screens (two desktop, one phone) beside the text; each opens its app, the pointed-at card comes to the front, the stack spreads on hover and fans in on load (off for reduced motion); built from `showcases`, so new live apps join automatically

- [x] Regenerate portal screenshots from the production build, per language, with a phone view on the card (`pnpm capture:showcase`, needs `pnpm start --port 3200`)
- [x] Portal and app metadata: `sitemap.ts`, `robots.ts`, share images per language (browser-rendered via `/[lang]/og/[app]` + `pnpm capture:og`, because next/og drops stacked Thai tone marks), SVG + Apple icons for the portal and Baan Lamai
- [x] `public/images/CREDITS.md` listing every photo source (rawpixel CC0 via Openverse); a unit test fails if a new photo is not credited
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`): lint, typecheck, unit + integration, then build + Playwright desktop/mobile with the report uploaded on failure. Runs once the project is pushed to GitHub
- [x] README in Thai and English: what the project is, how to run, scripts, how to add a showcase, how to deploy to Vercel

## Showcase 5: Sorn Studio (single-page site, `/[lang]/studio`)

- [x] Brand (Manrope + Bai Jamjuree, concrete paper and drafting ink, roof-and-ground mark), hero with a self-drawing elevation on a titled sheet, gallery of 8 projects with type filter, lightbox with elevation / plan / section drawn as SVG from each project's numbers, URL-synced (?project=&view=), arrow keys, Thai with Buddhist-era years
- [x] Services (new houses, renovations, cafés/stays, interiors; each with how fees work) and a process section drawn as a week-by-week design schedule (bars draw in on entering view; durations as text on phones and for screen readers); header links to both
- [x] Contact form: project type, location, floor area, budget band, start time, brief with counter, name/email/phone and preferred reply (email / LINE with ID / phone); field errors in both languages; sending shows an enquiry number (SS-MMDD-XXXX), the reply-by date two working days out, and a summary. Not stored or sent anywhere yet
- [x] Portal card live: screenshots with tour screens (drawings, design schedule), share card, icon + apple icon, sitemap entry; summary and features rewritten to match the app; a lone Open App button no longer sits in half a row
- [x] Drawings in dark mode: checked hero, gallery, plan, section and schedule; e2e runs axe on Sorn Studio in dark mode
- [x] `next start` only sees public/ files present at startup: restart it after `pnpm capture:showcase` (noted in CLAUDE.md)

## Showcase 3: Krua Yai (QR table ordering, `/[lang]/restaurant`)

- [x] Krua Yai at `/[lang]/restaurant`: theme (banana-leaf green, turmeric, chilli for heat; Mitr + Sarabun), landing that takes a table number, QR menu at `?table=N` with 14 photographed dishes (CC0, Wikimedia Commons) in sticky sections, dish sheet with spice level, extras and a kitchen note, basket per table (sessionStorage) with a running bar and an order list to change quantities
- [x] Send to the kitchen in rounds; each dish moves from received to cooking to served on realistic prep times (salads 7, rice 10, curries 14, sweets 5 min, staggered down the ticket); status sheet with ETAs and the running total; a bar that follows the latest round; call staff for water, cutlery, a problem or the bill, once per reason every two minutes
- [x] Split the bill from the order status: evenly in whole baht (leftover baht to the first people), or plate by plate with shared plates divided; each person gets a PromptPay QR for their amount once every plate has someone paying for it
- [x] Kitchen screen at `/[lang]/restaurant/kitchen` (noindex): New / Cooking / Served columns of seeded tickets (a new one most minutes, waiting three minutes for a cook), spice, extras and notes on each ticket, a flag after 15 minutes, Start Cooking / Mark Served kept per session; rounds sent from this browser's table appear as "This device". Sales tab (`?view=sales`): the last seven full days of takings, guests, spend per head, and the week's best sellers
- [x] Portal card live: menu screenshots, an order status tour screen (a round nine minutes in) and the kitchen screen, share card with four dishes, steaming-bowl icon + apple icon, sitemap entry; the card's staff link opens the kitchen screen. `capture:showcase` and `capture:og` now take an optional app id to refresh just one app
- [x] The guest's status bar and sheet follow the kitchen screen: Start Cooking or Mark Served on this device's round moves it on at once. The kitchen can only move dishes forward, so a mark is a floor on the prep-time status (the board uses the same rule, so a ticket started by hand still goes out on time). Device tickets are keyed by table and send time, so a fresh basket on the same table never inherits old marks
- [x] A table and the kitchen open in two tabs stay in step: both stores moved to localStorage and re-read on the `storage` event (shared `useStorageSync` hook), so new rounds print on the kitchen screen and its marks reach the table without a reload. A table's visit ends after three quiet hours, and kitchen marks older than three hours are pruned. Seeded tickets no longer put cooking notes on sweets and drinks

## Showcase 4: Talad (multi-vendor marketplace, `/[lang]/marketplace`)

- [x] Talad at `/[lang]/marketplace` as an antiques and vintage market (not on the portal yet): four dealers (Sangkhalok stoneware in Phitsanulok, jars/Bencharong/lacquer in Talat Noi, old Tai Lue textiles in Nan, Karen and Lahu baskets in Mae Sariang), 30 one-of-a-kind pieces photographed by the Rijksmuseum and the Ethnological Museum Berlin (CC0). Gilt-lacquer theme (Chonburi + Noto Sans Thai), price tags as punched dealer tags. Search across dealers from the header in Thai or English with synonyms (pottery, จักสาน), type filter, sold pieces on request, price sort, all in the URL; dealer shops; piece pages with era, size, condition, delivery and the Fine Arts export rule. Ban Chiang pottery, Buddha images and ivory were left out on purpose
- [ ] Multi-dealer cart: add pieces (one of each, so a piece in someone's cart shows as reserved), cart grouped by dealer with each dealer's delivery fee, one checkout that splits into an order per dealer
- [ ] Portal card for Talad: screenshots, share card, icons, sitemap, status live
- [ ] Seller dashboard: listings, orders, payouts

## Sorn Studio follow-ups

- [ ] Drawings: plans for upper floors; a site plan with sun path for each project
- [ ] Sorn Studio enquiries could land in a small studio inbox page (like the shops' staff dashboards) so the form has somewhere to go

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
- [x] Admin inventory at `/[lang]/shop/admin/inventory`: every size with stock level, restock or stocktake count per size (with undo), seeded Tuesday restock log plus this device's changes; overview stock alerts and reset include them
- [x] Admin customers at `/[lang]/shop/admin/customers`: customer count, returning share, average spend; search by name, email or phone; sort by spend, recency or orders; regulars marked; customer sheet with contact, address, favourite coffee and order history linking to each order; order sheet links back. Seeded orders now come from a pool of 300 customers (regulars, occasional, one-off; many Thai names in Thai script) with fixed addresses
- [x] Live stock per device: orders placed here draw stock down (cancelling puts it back) and admin restocks/counts reach the product page, catalogue and cart (`useLiveProducts`); e2e buys the last bags, cancels, restocks
- [x] Home page and "pairs well with" product cards follow live stock (`LiveProductCard`); checkout checks the cart against live stock, blocks payment and offers "Update My Cart" when a size ran low or sold out
- [x] Daily revenue charts (Kaffa and Baan Lamai) draw today as a dashed segment labelled "Today", with a "so far" tooltip, so the partial day no longer reads as a crash (`src/lib/chart.ts`)

## Kaffa Roasters follow-ups

- [ ] Admin status overrides are per device (`kaffa:admin:v1`); a staff change is not reflected on the customer's tracking page (the `useStorageSync` hook from Krua Yai fits here)

## Baan Lamai improvements

- [ ] Guest "manage booking" page (reference + email): reschedule or cancel within policy
- [ ] Admin week schedule view per therapist with drag-free reassign via dialog
- [ ] Admin customers page: visit history, total spend, notes
- [ ] Mobile date strip: scroll the selected date into view; show "next free day" shortcut
- [ ] Gift vouchers purchase flow
- [ ] Therapist avatars show Latin initials (KS, PC) on the Thai site; use the Thai nickname's first letter there
- [x] The portal corner button now hides while scrolling down and returns on scroll up

## Quality backlog

- [x] CI flakes from clicking before hydration (filters, cards): the root layout marks <html data-hydrated> and the e2e page fixture waits for it after every navigation

- [ ] Next dev server races under full parallel e2e load ("Failed to generate static paths … Unexpected end of JSON input"); the gate now prefers e2e against production

- [ ] Turbopack dev HMR sometimes keeps an old copy of an edited messages module (`t.catalog` undefined until restart); investigate or document a restart step

- [ ] Share cards must be re-captured (`pnpm capture:og`) whenever a hero title changes; add a check that fails when the copy and card drift

- [x] Recharts entry animations never finish under Playwright's fixed clock, so screenshots show empty charts; both apps' charts now render without the entry animation

- [x] Admin sidebar nav items (both apps) lost their styles because `NavLink` dropped the props from `SidebarMenuButton asChild`; it now forwards them. The floating "all showcases" button covered the sidebar footer, so admin screens show it in the top bar instead

- [x] Portal kept the last app's colours after leaving it: Next keeps the previous route mounted with `display: none`, and `:root:has([data-app])` still matched. Theme selectors now ignore hidden wrappers; e2e covers link and history navigation

- [ ] GitHub Actions warns that `actions/checkout@v4`, `actions/setup-node@v4` and `pnpm/action-setup@v4` target Node 20 (deprecated); move to releases that run on Node 24

- [ ] Portal wow pass 2 ideas: numbers that tick up when seen, gentle parallax between sections (GSAP tweens stall under Playwright's fixed clock, so prefer CSS transitions/scroll timelines)

- [ ] Lighthouse pass on every page (performance ≥ 90 mobile, accessibility 100)
- [ ] Review all Thai copy once more by reading it aloud; fix anything that sounds translated
- [ ] Dark mode visual check for every page
