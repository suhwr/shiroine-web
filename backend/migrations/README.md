# Database Migrations

This directory contains SQL migration files for updating the database schema.

## How to Run Migrations

1. Connect to your PostgreSQL database:
```bash
psql -U shiroine_user -d shiroine_db
```

2. Run the migration file:
```bash
\i backend/migrations/add_payment_number_and_expired_at.sql
```

Or from command line:
```bash
psql -U shiroine_user -d shiroine_db -f backend/migrations/add_payment_number_and_expired_at.sql
```

## Migration Files

### add_payment_number_and_expired_at.sql (2026-01-10)
Adds `payment_number` and `expired_at` columns to `payment_history` table to support Pakasir payment gateway.

- `payment_number`: Stores the payment identifier (QR string for QRIS, account number for VA, URL for PayPal)
- `expired_at`: Stores the payment expiration timestamp

These columns are required for:
- QRIS: Displaying QR code
- Virtual Account: Showing account number
- PayPal: Providing payment URL
- All methods: Showing countdown timer
