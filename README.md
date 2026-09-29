# Client Finder 🚀

> **Local B2B Lead-Generation & Opportunity Engine for Web Agencies & Freelancers**

Client Finder is a fully local, privacy-first web application that discovers high-value web development opportunities for local businesses without requiring paid APIs or prohibited scraping.

---

## 🎯 The Workflow

```text
Find Businesses / Ingest Data
         ↓
Website Audit (Safe, deterministic inspection)
         ↓
Opportunity Scoring Engine (Transparent rules-based score 0-100)
         ↓
Personalized Outreach Pitch (Strictly verified facts only)
         ↓
Review, Edit & Approve Draft
         ↓
Safe Manual Contact Action (wa.me, mailto, public profile)
         ↓
Manual Send by User (Zero automated unsolicited messages)
```

---

## 🛡️ Anti-Spam & Ethical Compliance

- **No Prohibited Scraping**: No Google Places API, Google Maps scraping, CAPTCHA bypasses, proxy rotations, or account evasion.
- **Manual-First Guard**: The application **NEVER** sends messages automatically. It generates prefilled `wa.me` or `mailto` links for manual review and dispatch by the human operator.
- **Do Not Contact (DNC) Safeguard**: Immediate blocking of contact actions and message generation for opted-out businesses.
- **Demo Lead Safety**: Synthetic test leads with `is_demo = true` are protected from firing real outbound communication links.

---

## 🧱 Project Structure

```text
client-finder/
├── apps/
│   ├── web/                     # React 18, TypeScript, Vite, Tailwind CSS
│   │   ├── src/
│   │   │   ├── api/             # Typed API client
│   │   │   ├── components/      # Badges, Modals, Navigation
│   │   │   ├── pages/           # Dashboard, Find Leads, Leads, Messages, Settings
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   │
│   └── api/                     # Node.js, Fastify, Drizzle ORM, SQLite
│       ├── src/
│       │   ├── db/              # SQLite schema & database connection
│       │   ├── routes/          # Leads, Messages, Sources, Dashboard, Settings
│       │   ├── services/        # LeadService, WebsiteAuditService, MessageService
│       │   ├── sources/         # Pluggable LeadSource (CsvLeadSource, PublicUrlLeadSource)
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   └── shared/                  # Monorepo shared library
│       └── src/
│           ├── types.ts         # TypeScript definitions
│           ├── normalizer.ts    # Business name, phone, domain normalization
│           ├── deduplication.ts # Multi-factor duplicate detection
│           ├── csvValidator.ts  # CSV column & row validation
│           ├── scoring.ts       # Deterministic rules-based scoring engine
│           ├── messageGenerator.ts # Verified-facts personalized pitch builder
│           └── contactActions.ts# Safe wa.me / mailto action link builders
│
├── data/
│   ├── demo-leads.csv           # Synthetic demo dataset
│   └── client_finder.sqlite     # Local SQLite database
│
├── tests/
│   ├── unit/                    # Vitest unit test suite
│   └── e2e/                     # Playwright end-to-end test suite
│
├── .env.example
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## ⚙️ Requirements & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if custom ports are desired:
```bash
cp .env.example .env
```

Default variables:
```env
PORT=3001
HOST=127.0.0.1
DATABASE_URL=./data/client_finder.sqlite
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🚀 Running the Application

### Start Full Stack in Development Mode
```bash
npm run dev
```

This concurrently launches:
- **API Server**: `http://localhost:3001`
- **Web Dashboard**: `http://localhost:5173`

---

## 🧪 Testing

### 1. Run Unit Tests (Vitest)
Executes all unit tests covering CSV validation, normalization, deduplication, deterministic scoring, message generation, and DNC behavior:
```bash
npm run test
```

### 2. Run End-to-End Tests (Playwright)
Executes the full browser workflow in headless Chromium:
```bash
npm run test:e2e
```

---

## 🏗️ Production Build

```bash
npm run build
```
