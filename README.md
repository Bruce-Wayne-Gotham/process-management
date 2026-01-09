# Tobacco Tracker

A modern web application for tracking tobacco processing, from farmer purchases to final product output.

## 🚀 Primary Stack

- **Frontend**: Next.js
- **Database**: AWS RDS (PostgreSQL)
- **Deployment**: Render / AWS

## 📊 Database Status: Unified

The application has been unified to use **Postgres (AWS RDS)** as the single source of truth. Legacy support for Supabase and Oracle Cloud has been decommissioned to maintain a clean and performant codebase.

## 🛠️ Getting Started

### Prerequisites

- A PostgreSQL database (AWS RDS recommended).
- Environment variables configured in `.env`.

### Environment Variables

Copy `.env.rds.example` to `.env` and fill in your RDS credentials:

```dotenv
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/tobacco_tracker?sslmode=require
```

### Database Initialization

You have two ways to initialize your AWS RDS database:

#### Option 1: Using SQL (Recommended for Cloud Console)
Copy the contents of `INITIALIZE_DATABASE.sql` and run them directly in your AWS RDS Query Editor or any SQL client (pgAdmin, DBeaver).

#### Option 2: Using Docker (Recommended for Local Dev)
If you have Docker Desktop installed, you can initialize the database without needing Node.js locally:
1. Ensure your `.env` file has the correct `DATABASE_URL`.
2. Right-click `init-db.ps1` and select **Run with PowerShell**.

## 📂 Project Structure

- `nextjs/`: The main application source code.
- `sql/`: Database schema and seed data.
- `rds-setup/`: Utilities for AWS RDS verification.
- `docs/`: (Coming soon) Detailed documentation.

## 📜 License

Private project.
