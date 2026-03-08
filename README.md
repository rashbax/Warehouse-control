# Warehouse Control

Internal warehouse inventory management system for marketplace sellers. Tracks stock movements, shipments, and product marking (Честный знак) across multiple marketplaces.

## Features

- **Stock Overview** — real-time stock balances computed from operations, filterable by marketplace
- **SKU Management** — product catalog with images, cost prices, and marketplace assignment
- **Receiving (Приход)** — record incoming stock with Честный знак codes
- **Shipments (Отгрузка)** — record outgoing shipments with per-code stock validation
- **Audit Log (История)** — full operation history with filters by type, marketplace, and date range
- **Marketplaces** — Wildberries, Ozon, Uzum Market, Yandex Market, Другое
- **Authentication** — session-based auth with role support (Admin, Warehouse Manager, Marketplace Manager)

## Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Framework | Next.js 16 (App Router)           |
| Language  | TypeScript                        |
| UI        | React 19, Tailwind CSS v4         |
| Database  | PostgreSQL (Supabase)             |
| ORM       | Prisma 7                          |
| Auth      | NextAuth v5                       |
| Storage   | Supabase Storage (product images) |
| Hosting   | Vercel                            |

## Database Schema

```
User          — id, name, email, passwordHash, role
SKU           — id, artikul, model, color, marketplace, costPrice, imageUrl
Operation     — id, type (PRIHOD|OTGRUZKA), skuId, qty, marketplace, chestnyZnak, note, date, userId
```

Stock balance is computed — no separate stock field. Balance = SUM(PRIHOD) - SUM(OTGRUZKA), grouped per SKU and Честный знак code.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase project)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Generate Prisma client
npm run db:generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Production build         |
| `npm run start`       | Start production server  |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:migrate`  | Run migrations (dev)     |
| `npm run db:push`     | Push schema to database  |
| `npm run db:seed`     | Seed database            |
| `npm run db:studio`   | Open Prisma Studio       |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── ostatki/       # Stock balances page
│   │   ├── tovary/        # SKU management page
│   │   ├── prihod/        # Receiving form
│   │   ├── otgruzka/      # Shipment form
│   │   └── istoriya/      # Audit log
│   └── login/             # Authentication
├── components/            # UI components per route
└── lib/                   # Prisma client, auth config, Supabase client
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history
└── seed.ts                # Seed data
```

## Deployment

Deployed on Vercel with Supabase as the database provider. Push to `master` triggers automatic deployment.

## License

Private — internal use only.
