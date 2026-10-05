# Infra Build

**Predictive infrastructure monitoring and issue reporting platform for public infrastructure.**

**Predict,        Prioritize,        Prevent**

Infra Build helps authorities and citizens report, track, and prioritize infrastructure problems across roads, bridges, drainage, and streetlights.

---

## 🚀 Features

- 🏗️ **Infrastructure asset management**: roads, bridges, drainage, and streetlights in one place
- 🚨 **Citizen issue reporting**: anyone can report a problem
- 🔗 **Automatic asset matching**: reports are linked to existing assets
- 📊 **Deterministic lifecycle risk scoring**: transparent, repeatable scores
- 🗺️ **Interactive Leaflet infrastructure map**: all assets on a live map
- 🏢 **Automatic department assignment**: issues go to the right team
- 📋 **Report tracking and status management**: follow each report to resolution
- 🔴 **Risk-based map markers**: see the most critical assets at a glance
- 🔐 **Google sign-in** for dashboard access
- 🤖 **Groq AI insights** to summarize infrastructure data

---

## 📊 Risk Levels

| Score  | Risk        |
| ------ | ----------- |
| 0–24   | 🟢 Low      |
| 25–49  | 🟡 Medium   |
| 50–74  | 🟠 High     |
| 75–100 | 🔴 Critical |

Risk is calculated from the **installation year**, the **last maintenance year**, and the **current year**.

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)

---

## ⚙️ Setup

### 1. Clone and install

```bash
git clone https://github.com/Ankit69Dev/Infra-Guard.git
cd infra-guard
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Auth (Google sign-in)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a-long-random-string"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI insights (Groq)
GROQ_API_KEY="your-groq-api-key"
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔄 Workflow

```text
Report Issue
     ↓
Find Existing Asset
     ↓
Attach OR Create Asset
     ↓
Calculate Risk
     ↓
Update Dashboard + Map
```

---

## 🏆 Goal

Move infrastructure management from **reactive complaint handling** to **proactive, risk-based maintenance**.

---

© Infra Build