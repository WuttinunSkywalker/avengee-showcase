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
- [x] Multi-dealer basket and checkout: adding a piece holds it for 30 minutes (shown as "held until 09:30", dropped when it runs out); basket sheet grouped by dealer with each dealer's delivery fee; one checkout (contact, Thai address with the province/postcode check) and one PromptPay payment that Talad holds until parcels arrive; the payment splits into an order per dealer (TL-261104-XXXXXX-1, -2…) with ship-by and arrival dates; bought pieces show as sold across the market. Provinces and the searchable province picker moved to `src/lib/thailand.ts` and `src/components/province-picker.tsx` so Kaffa and Talad share them
- [x] Each parcel on the order page moves through being packed, on its way (with a tracking number) and delivered on the dealer's own handling time; once it has shipped the buyer can confirm it arrived (behind a confirm dialog), which releases that dealer's payment; a week after delivery with no word, Talad pays the dealer itself. "Your orders" (package icon in the header) lists every purchase with how many parcels have arrived
- [x] Portal card live: home and phone screenshots, tour screens of the basket split by dealer and of parcels on their way (captured by paying through checkout and moving the clock a day and a half), share card with the Sangkhalok covered jar and its tag, gilt-tag icon + apple icon, sitemap entries for every dealer and piece
- [x] Seller Centre at `/[lang]/marketplace/seller` (the portal card's staff link): switch between the four shops; overview with 30-day sales, parcels to pack, money Talad is holding and the next Monday payout, a 12-week payouts chart and the latest orders; orders table with stage filters and paging (a stacked list on phones); payouts with the 8% commission explained and every Monday transfer. 90 days of seeded sales per dealer (busier at weekends, buyers' names in Thai or English as they'd type them) plus anything bought in this browser
- [x] Seller Centre listings tab: every piece with price and status; change a price (dialog, whole baht ฿100–฿2,000,000, typed with or without commas) or take a piece down and put it back. The market, piece pages and baskets follow at once (a taken-down piece leaves baskets; a held piece takes the new price). "Mark Shipped" on orders being packed moves the parcel on for the buyer straight away; ship marks only ever bring a parcel forward, seeded or bought in this browser
- [x] Seller Centre "List a Piece": a sheet with one photo (resized in the browser to about 900px WebP, JPEG/PNG/WebP/HEIC up to 15 MB), name, type, description, age and origin, size, condition and price; errors for every field at once. The piece goes straight onto the market (search, piece page at `/marketplace/piece?id=new-…`, basket, checkout, orders and the Seller Centre all find it through the same item lookup, which new pieces register into). Dealers write once in their own language and it reads the same in both
- [x] Dealer stock counts on dealer pages, cards and piece pages, and "27 pieces for sale" on the home page, now follow pieces listed, taken down and bought in this browser (server and first paint show the catalogue numbers, so hydration matches). Taken-down pieces count as neither for sale nor sold. Dealer intros in Thai read without English commas and full stops

## Sorn Studio follow-ups

- [x] "Site and sun" drawing for every project: the plot and footprint turned to the house's real bearing, its frontage named (soi, road, beach, view), under the sun's path at its latitude on 21 June, the equinoxes and 21 December, with hours marked and the low afternoon sun shaded. In Thailand the June noon sun is to the north, and the drawing shows it. Projects gained site data (latitude, facing, plot, frontage); the floor plan's north arrow now turns with the house too. Sun maths in `src/features/studio/lib/sun.ts`, tested against the equinox and solstice noon positions
- [x] Upper-floor plans for the six multi-storey projects, with a floor switcher on the Plan view (`?floor=2…4`, resets when the project or drawing changes, falls back to the ground floor if out of range). Upper floors have no front door; "open to below" is drawn with a dashed X over Ari House's courtyard and Hua Hin's pool. The stair stays in the same bay on every floor (unit-tested); Hua Hin's ground floor gained the stair it was missing
- [x] Talat Noi Shophouse's light well is drawn on all four floor plans: a 2.4 m void at the back of the shop bay with its own wall, open-to-sky X and label (projects take an optional `lightWell`). On phones the drawing buttons leave room for the dialog's close button
- [x] Studio inbox at `/[lang]/studio/inbox` (the portal card's staff link): enquiries sent from the contact form land there (localStorage, synced across tabs) alongside six weeks of seeded ones in the client's own language; filter by status (new, replied, site visit, closed) with counts, overdue flag past the promised reply date, detail with the brief as written, project facts and contact links, and actions to mark replied, book a site visit on a weekday (validated), close and reopen. Open enquiry and filter live in the URL; on phones the list and detail take turns

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

- [x] The customer's tracking page and order list follow the roastery desk, live across tabs: staff statuses act as a floor on the timeline (steps they cover are done, stamped with when staff changed them), an unpaid order moved on counts as paid, "Packed, waiting for the courier" when marked packed, and a cancelled order shows a notice with refund timing instead of tracking. The admin store records when each change was made. The roasting step's text no longer reads as future once it's done

## Baan Lamai improvements

- [x] Guest "manage booking" page at `/[lang]/spa/book/manage` (linked from the confirmation page with reference and email filled in): find a booking by reference and the email it was made with; more than 24 hours ahead, move it to another free time with the same therapist (their working days, from tomorrow, never inside 24 hours) or cancel with the deposit refunded; inside 24 hours, cancelling keeps the deposit and changes are by phone. Seeded bookings can be moved too (a `moved` map in the bookings store); staff see guest cancellations in the admin
- [x] Found while testing: two bookings made in the same instant got the same reference (the code was seeded only by the time). References are now seeded by the booking's date, time, therapist and guest too, and redrawn on a clash
- [x] Week schedule in the spa admin (`/[lang]/spa/admin/schedule`): pick a therapist and a week (both in the URL), see bookings to scale across a Monday-to-Sunday grid with days off and off-shift hours hatched, and the week's load against shift time; on phones it's a day-by-day list. Any upcoming booking opens a dialog to hand it to another therapist; everyone is listed, with those who can't take it disabled and the reason given (doesn't do the treatment, day off, outside their shift, busy with the clashing time). Past or settled bookings stay put
- [x] Customers page in the spa admin (`/[lang]/spa/admin/customers`): every guest from the booking history with visits, total spend, last and next visit; search by name, email or phone digits, sort by spend, visits, last visit or name (all in the URL); a profile sheet with contact links, spend, usual treatment and therapist, a notes field for the team (seeded for a few regulars in the language staff wrote them in) and the full visit history
- [x] Found while building it: the seed spread every booking over 60 known customers, so regulars showed 75 visits in 90 days. Bookings now mostly go to one-off guests (tourists and first-timers, generated per booking without disturbing anything else in the seed), and regulars come about weekly
- [x] Portal: the "Live" dot on the process stepper's server icon is green (a new `--online` token) instead of the yellow accent
- [x] Mobile date strip: the chosen day is centred in the strip (only the strip scrolls, never the page), and a "next free day" button under the times jumps past full days
- [x] Found while building it: e2e locators like `{ name: "ถัดไป" }` match any button containing that word ("ดูวันว่างถัดไป"); Thai wizard buttons are now matched with `exact: true`
- [x] Gift vouchers purchase flow (`/spa/gift`): amount with "enough for" hint, three card designs (teak, indigo, jasmine) with a live preview, message, send to me or straight to them, PromptPay for the full amount, then a printable voucher with a `BLG-XXXX-XXXX` code valid 12 months
- [x] Gift vouchers, next slice: redeem a code at the booking payment step. The voucher pays first; if it covers the deposit there's no PromptPay step, otherwise PromptPay tops up the rest of the deposit. Unused balance stays on the voucher, and the booking, confirmation and admin sheet show what came off it
- [ ] Gift vouchers: a guest who cancels a booking paid by voucher should get the voucher amount back on the card (manage booking only refunds PromptPay deposits today)
- [ ] Gift vouchers, next slice: an admin vouchers page (issued, balance, expiry) next to customers
- [ ] Gift vouchers on phones: the preview sits above the form, so it scrolls away while the buyer types the message; consider a small sticky preview or showing it again above the payment
- [x] Found while building it: a Radix `RadioGroupItem` inside a `<form>`, wrapped in `FieldLabel htmlFor`, has no accessible name for axe (button-name); the gift form names each item with `aria-labelledby`/`aria-describedby`. The booking payment step uses the same pattern outside a form and passes
- [x] Found while building it: a submit button disabled until a store hydrates fails axe colour contrast while it fades in from 50% opacity; the gift form waits for hydration inside submit instead
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
