# ISP Management System

A full-stack web application for managing Internet Service Provider operations, including customer management, subscriptions, payments, complaints, and zone management.

## Features

### Admin Portal
- Dashboard with analytics and overview
- Customer management (add, edit, import)
- Package and subscription management
- Payment tracking and recording
- Complaint management
- Announcement system
- Zone management
- Trial management settings

### Customer Portal
- Dashboard with account overview
- View and browse packages
- Payment history
- Submit and track complaints
- View announcements
- Speed test tool
- Account settings

### Other Features
- Role-based access control (admin, customer)
- Password reset via email
- Authentication with secure sessions

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Build Tool | Vite |
| Deployment | Vercel |

## Project Structure

```
isp-management-trial/
├── artifacts/
│   ├── api-server/        # Express backend API
│   │   └── src/
│   │       ├── routes/    # API route handlers
│   │       └── middlewares/
│   ├── isp-portal/        # React frontend
│   │   └── src/
│   │       ├── pages/     # Admin and customer pages
│   │       ├── components/
│   │       ├── contexts/
│   │       └── hooks/
│   └── mockup-sandbox/
├── lib/
│   ├── db/                # Database schema and config
│   │   └── src/schema/
│   ├── api-client-react/  # API client hooks
│   ├── api-spec/          # API specification
│   └── api-zod/           # Zod validation schemas
├── scripts/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── vercel.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arooba-shafique/isp-management-trial.git
   cd isp-management-trial
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables for database connection.

4. Run database migrations:
   ```bash
   pnpm run typecheck
   ```

5. Start the development server:
   ```bash
   pnpm -r --if-present run dev
   ```
