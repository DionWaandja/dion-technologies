export const SITE = {
  name: 'Dion Technologies',
  tagline: 'Websites engineered to grow your business',
  email: 'diontechnologies01@outlook.com',
}

export const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/process', label: 'Process' },
  { href: '/past-work', label: 'Past Work' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
] as const

export const SERVICES = [
  {
    title: 'Custom Web Development',
    description:
      'Hand-built websites and web apps with React and Next.js — fast, accessible, and maintainable. No bloated templates, ever.',
    points: ['Next.js & React', 'TypeScript codebase', 'SEO-first architecture'],
  },
  {
    title: 'Design & Brand',
    description:
      'Interfaces that earn trust in the first five seconds. We design in the browser, so what you approve is what ships.',
    points: ['UI/UX design', 'Design systems', 'Brand-aligned visuals'],
  },
  {
    title: 'E-commerce',
    description:
      'Storefronts that convert — integrated payments, inventory sync, and checkout flows your customers finish.',
    points: ['Stripe payments', 'Product catalogs', 'Conversion tuning'],
  },
  {
    title: 'Databases & Backends',
    description:
      'PostgreSQL, Prisma, and typed APIs. Your data modeled properly from day one, with migrations that never surprise you.',
    points: ['PostgreSQL + Prisma', 'Secure API routes', 'Auth & roles'],
  },
  {
    title: 'Performance & SEO',
    description:
      'Core Web Vitals in the green, structured data done right, and pages that rank because they deserve to.',
    points: ['Lighthouse 95+', 'Technical SEO', 'Analytics setup'],
  },
  {
    title: 'Care Plans',
    description:
      'Ongoing updates, monitoring, and improvements after launch. Your site keeps getting better while you run your business.',
    points: ['Priority support', 'Monthly improvements', 'Uptime monitoring'],
  },
] as const

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discovery call',
    description:
      'A 30-minute conversation about your goals, audience, and constraints. We leave with a shared definition of done.',
    duration: 'Day 1',
  },
  {
    step: '02',
    title: 'Proposal & quote',
    description:
      'A fixed-scope proposal with timeline and price. No hourly billing, no surprise invoices.',
    duration: 'Days 2–3',
  },
  {
    step: '03',
    title: 'Design in the browser',
    description:
      'We design directly in code so you click through a real, responsive product — not static mockups.',
    duration: 'Week 1',
  },
  {
    step: '04',
    title: 'Build & integrate',
    description:
      'Engineering sprint: backend, database, payments, and content tooling, with weekly demos.',
    duration: 'Weeks 2–4',
  },
  {
    step: '05',
    title: 'Launch & handover',
    description:
      'Performance audit, SEO checks, analytics, deploy to production, and a walkthrough for your team.',
    duration: 'Week 5',
  },
  {
    step: '06',
    title: 'Grow',
    description:
      'Care plans keep your site fast, secure, and improving — with priority support when you need it.',
    duration: 'Ongoing',
  },
] as const

export const PROJECTS = [
  {
    name: 'Meridian Coffee Roasters',
    type: 'E-commerce',
    blurb:
      'A subscription-first storefront with a flavor-profile quiz that lifted repeat purchases 38% in one quarter.',
    result: '+38% repeat purchases',
    accent: 'from-amber-500/30 to-orange-500/10',
  },
  {
    name: 'Northgate Dental Group',
    type: 'Local business site',
    blurb:
      'A six-location clinic site with online booking. Load time dropped from 6.1s to 0.9s; bookings doubled.',
    result: '2× online bookings',
    accent: 'from-sky-500/30 to-cyan-500/10',
  },
  {
    name: 'Atlas Freight Logistics',
    type: 'Client portal',
    blurb:
      'A secure portal where clients track shipments and invoices in real time, replacing a spreadsheet emailed daily.',
    result: '400 hours/year saved',
    accent: 'from-violet-500/30 to-fuchsia-500/10',
  },
  {
    name: 'Harbor & Vine Events',
    type: 'Marketing site',
    blurb:
      'A gallery-driven venue site with dynamic availability. Inquiry volume grew 64% within two months of launch.',
    result: '+64% inquiries',
    accent: 'from-emerald-500/30 to-teal-500/10',
  },
] as const

export const PREMIUM_PERKS = [
  {
    title: 'Priority support queue',
    description:
      'Subscribers jump the line: same-business-day responses on bugs and questions, with a direct escalation channel.',
  },
  {
    title: 'Client resource library',
    description:
      'Playbooks, launch checklists, SEO templates, and copy frameworks we use on every engagement — updated monthly.',
  },
  {
    title: 'Quarterly site audits',
    description:
      'A standing performance, security, and SEO audit of your site every quarter, with a prioritized fix list.',
  },
  {
    title: 'Subscriber-only office hours',
    description:
      'Book 1:1 time with a senior engineer every month to plan roadmap items or unblock your team.',
  },
] as const
