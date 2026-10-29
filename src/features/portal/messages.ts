import type { Locale } from "@/i18n/config"

const en = {
  skip: "Skip to content",
  nav: { work: "Showcases", services: "What we build", contact: "Contact us", theme: "Toggle dark mode" },
  hero: {
    status: "Taking new projects for January",
    title: "Pick an app. Use it like your customers would.",
    body: "Each project below is a complete product, not a mock-up. Book a massage, check out a cart, run the back office. Then tell us what your business needs.",
    primary: "Browse Showcases",
    secondary: "Talk to Us",
    openApp: (name: string) => `Open ${name}`,
  },
  showcases: {
    title: "Showcases",
    intro: "Every project here works for real. Jump in and try it, no sign-up needed.",
    live: "Live",
    soon: "Coming soon",
    open: "Open App",
    admin: "Staff Dashboard",
    home: "Home",
    screens: (name: string) => `${name} screens`,
    filter: "Filter by type",
    all: "All",
  },
  services: {
    title: "What we build",
    intro: "These are the projects we do most. Every one is shaped around your business, not a template.",
    items: [
      { name: "Booking systems", body: "Live availability, deposits by PromptPay, reminders and a dashboard for your staff." },
      { name: "Online shops", body: "Product pages, cart, checkout, order tracking and stock alerts." },
      { name: "Business websites", body: "Fast pages with your menu, prices, map and contact details, in Thai and English." },
      { name: "Care after launch", body: "Updates, fixes and small changes after your site goes live." },
    ],
  },
  process: {
    title: "How we work",
    steps: [
      { title: "Tell us what you need", body: "What it's for, who will use it and how you'd like it to look. We turn that into a clear plan together." },
      { title: "We build, you try it as we go", body: "You get a working link to click through along the way. Ask for changes whenever you like." },
      { title: "Launch wherever suits you", body: "On your company's servers, your own account, or hosted by us. We work with companies and individuals." },
    ],
  },
  contact: {
    title: "Tell us what you want to build.",
    body: "A few lines is enough: what the project is for, who will use it, and anything you've already got. We reply within one working day.",
    email: "Email",
  },
  footer: { rights: "All rights reserved." },
}

export type PortalMessages = typeof en

const th: PortalMessages = {
  skip: "ข้ามไปที่เนื้อหา",
  nav: { work: "ผลงาน", services: "บริการ", contact: "ติดต่อเรา", theme: "สลับโหมดมืด" },
  hero: {
    status: "เปิดรับงานใหม่สำหรับเดือนมกราคม",
    title: "เลือกแอปที่สนใจ แล้วลองใช้แบบลูกค้าจริงได้เลย",
    body: "ทุกโปรเจกต์ข้างล่างเป็นงานที่ใช้ได้จริง ไม่ใช่แค่ภาพม็อกอัป ลองจองคิวนวด ลองสั่งของ ลองเข้าระบบหลังบ้านดู แล้วค่อยมาเล่าให้เราฟังว่าธุรกิจของคุณอยากได้แบบไหน",
    primary: "ดูผลงาน",
    secondary: "คุยกับเรา",
    openApp: (name: string) => `เปิดแอป ${name}`,
  },
  showcases: {
    title: "ผลงาน",
    intro: "ทุกโปรเจกต์ใช้งานได้จริง กดเข้าไปลองเล่นได้เลย ไม่ต้องสมัครอะไร",
    live: "เปิดแล้ว",
    soon: "เร็ว ๆ นี้",
    open: "เปิดแอป",
    admin: "ระบบหลังบ้าน",
    home: "หน้าแรก",
    screens: (name: string) => `หน้าจอในแอป ${name}`,
    filter: "กรองตามประเภท",
    all: "ทั้งหมด",
  },
  services: {
    title: "เราทำอะไรได้บ้าง",
    intro: "งานที่เราทำบ่อยที่สุด ทุกงานออกแบบให้เข้ากับธุรกิจของคุณ ไม่ได้ใช้เทมเพลตสำเร็จรูป",
    items: [
      { name: "ระบบจองคิว", body: "เช็กคิวว่างได้ทันที รับมัดจำผ่านพร้อมเพย์ แจ้งเตือนลูกค้า และมีระบบหลังบ้านให้พนักงานใช้" },
      { name: "ร้านค้าออนไลน์", body: "หน้าสินค้า ตะกร้า ชำระเงิน ติดตามออเดอร์ และแจ้งเตือนเมื่อของใกล้หมด" },
      { name: "เว็บไซต์ธุรกิจ", body: "เว็บโหลดไว มีเมนู ราคา แผนที่ และช่องทางติดต่อครบ รองรับทั้งไทยและอังกฤษ" },
      { name: "ดูแลหลังขึ้นระบบ", body: "อัปเดต แก้บั๊ก หรือปรับนิด ๆ หน่อย ๆ หลังเว็บเปิดใช้งานแล้ว" },
    ],
  },
  process: {
    title: "ขั้นตอนการทำงาน",
    steps: [
      { title: "คุยกันก่อนว่าอยากได้แบบไหน", body: "เล่าให้เราฟังว่าจะเอาไปใช้ทำอะไร ใครเป็นคนใช้ อยากได้หน้าตาประมาณไหน แล้วเราช่วยสรุปเป็นแผนงานให้ชัด" },
      { title: "ทำไปส่งให้ลองไป", body: "ระหว่างพัฒนา เราส่งลิงก์ให้กดลองได้เรื่อย ๆ อยากปรับตรงไหนบอกได้ตลอด" },
      { title: "ขึ้นระบบตามที่คุณสะดวก", body: "จะใช้เซิร์ฟเวอร์ของบริษัท บัญชีส่วนตัว หรือให้เราดูแลให้ก็ได้ รับทั้งงานบริษัทและงานส่วนตัว" },
    ],
  },
  contact: {
    title: "อยากทำเว็บแบบไหน เล่าให้เราฟังได้เลย",
    body: "พิมพ์มาสั้น ๆ ก็พอ ว่าอยากทำอะไร ใครจะเป็นคนใช้ และตอนนี้มีอะไรอยู่แล้วบ้าง เราตอบกลับภายในหนึ่งวันทำการ",
    email: "อีเมล",
  },
  footer: { rights: "สงวนลิขสิทธิ์" },
}

export const portalMessages: Record<Locale, PortalMessages> = { en, th }
