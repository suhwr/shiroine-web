# Database Setup and Migration Guide

## Overview
This guide explains how to set up the PostgreSQL database for the Shiroine payment system and migrate from the cookie-based system to the database-driven system.

## Database Requirements

### PostgreSQL Installation
1. Install PostgreSQL (version 12 or higher recommended)
2. Create a new database for the application

```sql
CREATE DATABASE shiroine_db;
CREATE USER shiroine_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shiroine_db TO shiroine_user;
```

## Database Schema Setup

### Running the Schema
Execute the schema file to create all required tables:

```bash
cd backend
psql -U shiroine_user -d shiroine_db -f schema.sql
```

### Tables Created

1. **users** - Stores WhatsApp user information
   - `phone_number` (PRIMARY KEY): User's phone number
   - `lid`: Local ID from WhatsApp
   - `created_at`, `updated_at`: Timestamps

2. **names** - Stores user display names
   - `lid` (PRIMARY KEY): Local ID
   - `push_name`: User's display name
   - `created_at`, `updated_at`: Timestamps

3. **groups** - Stores WhatsApp group information
   - `id` (PRIMARY KEY): Group ID
   - `group_name`: Group display name
   - `created_at`, `updated_at`: Timestamps

4. **premium** - Tracks premium subscriptions
   - `jid`, `lid` (COMPOSITE PRIMARY KEY): User/group identifiers
   - `special_limit`: Current special limit usage
   - `max_special_limit`: Maximum special limit for this subscription
   - `expired`: Expiration timestamp (RFC3339 format)
   - `last_special_reset`: Last time special limit was reset
   - `created_at`, `updated_at`: Timestamps

5. **payment_history** - Complete payment transaction history
   - `id` (PRIMARY KEY): Auto-incrementing ID
   - `reference`: Tripay payment reference
   - `merchant_ref`: Merchant reference
   - `phone_number`: User's phone number (nullable)
   - `group_id`: Group ID (nullable)
   - `customer_name`: Customer name
   - `method`: Payment method
   - `amount`: Payment amount
   - `status`: Payment status (UNPAID, PAID, EXPIRED, FAILED)
   - `plan_type`: Type of plan purchased
   - `plan_duration`: Duration of the plan
   - `order_items`: JSON data of order items
   - `created_at`, `updated_at`, `paid_at`: Timestamps

## Backend Configuration

### Environment Variables
Update `backend/.env` with your database credentials:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=shiroine_user
DB_PASSWORD=your_secure_password
DB_NAME=shiroine_db
DB_SSLMODE=disable  # Use 'require' in production
```

### Connection Pooling
The backend automatically configures connection pooling:
- Max open connections: 25
- Max idle connections: 5
- Connection max lifetime: 5 minutes

## Premium Plan Configuration

### Special Limits by Plan

**User Plans:**
- 7 days (user-5d): 5 special limit
- 15 days (user-15d): 10 special limit
- 30 days (user-1m): 15 special limit

**Group Plans:**
- 15 days (group-15d): 30 special limit
- 30 days (group-1m): 50 special limit

### Premium Stacking Behavior

When a user purchases a new premium plan while having an active subscription:

1. **Duration**: New days are added to the remaining time
   - Example: 3 days remaining + 15 days new = 18 days total

2. **Special Limit**: Reset to 0 and max updated to new plan
   - Example: Had 30-day plan (15 limit), buy 15-day plan → max becomes 10

3. **Implementation**: Handled in `callbackHandler` function in `backend/main.go`

## API Endpoints

### 1. Verify User/Group
**POST** `/api/verify-user`

Request:
```json
{
  "identifier": "628123456789",
  "type": "user"  // or "group"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Apakah kamu bernama \"John Doe\"?",
  "data": {
    "type": "user",
    "phoneNumber": "628123456789",
    "lid": "xxxxx@s.whatsapp.net",
    "name": "John Doe"
  }
}
```

Response (Not Found):
```json
{
  "success": false,
  "message": "Tidak menemukan user di database, pastikan kamu sudah menggunakan bot dari kami"
}
```

### 2. Payment History
**POST** `/api/payment-history`

Request:
```json
{
  "identifier": "628123456789",
  "type": "user",
  "page": 1
}
```

Response:
```json
{
  "success": true,
  "data": {
    "history": [...],
    "page": 1,
    "perPage": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 3. Create Transaction
**POST** `/api/create-transaction`

Request:
```json
{
  "method": "QRIS",
  "amount": 15000,
  "customerName": "John Doe",
  "customerPhone": "628123456789",
  "groupId": "",
  "orderItems": [
    {
      "name": "User Premium - 15 Days",
      "price": 15000,
      "quantity": 1
    }
  ],
  "returnUrl": "https://shiroine.my.id/pricing"
}
```

## Testing the Implementation

### 1. Test Database Connection
```bash
cd backend
go run main.go
```

Look for: `✅ Database connection established successfully`

### 2. Test User Verification
```bash
# Create test user data
psql -U shiroine_user -d shiroine_db
```

```sql
INSERT INTO users (phone_number, lid) VALUES ('628123456789', 'test@s.whatsapp.net');
INSERT INTO names (lid, push_name) VALUES ('test@s.whatsapp.net', 'Test User');
```

Then test via API:
```bash
curl -X POST http://localhost:3001/api/verify-user \
  -H "Content-Type: application/json" \
  -d '{"identifier":"628123456789","type":"user"}'
```

### 3. Test Payment Flow
1. Create a test transaction via the frontend
2. Check `payment_history` table:
```sql
SELECT * FROM payment_history ORDER BY created_at DESC LIMIT 5;
```

3. Simulate payment callback (development only):
```bash
# This would normally come from Tripay
# Manually update status to test premium activation
UPDATE payment_history SET status = 'PAID', paid_at = NOW() WHERE reference = 'xxx';
```

### 4. Test Premium Activation
After simulating payment, check the premium table:
```sql
SELECT * FROM premium WHERE jid = '628123456789';
```

Should show:
- `special_limit`: 0
- `max_special_limit`: Based on plan (5, 10, or 15)
- `expired`: Future timestamp
- `last_special_reset`: Current timestamp

### 5. Test Premium Stacking
1. Create initial premium record:
```sql
INSERT INTO premium (jid, lid, special_limit, max_special_limit, expired, last_special_reset)
VALUES ('628123456789', 'test@s.whatsapp.net', 5, 15, '2026-02-01T00:00:00Z', NOW());
```

2. Purchase another plan via the frontend
3. Verify the premium record is updated correctly:
   - `expired` should be extended
   - `special_limit` reset to 0
   - `max_special_limit` updated to new plan's limit

## Migration from Cookie-based System

### For Existing Users
If you have existing payment history in cookies, you can:

1. **Keep cookie system running temporarily** - The backend saves to both database and cookies during transition
2. **Inform users** - Ask users to search their history using phone/group ID
3. **Data preservation** - Old cookie data will remain accessible on their browsers

### Cleanup
After confirming all users have migrated, you can:
1. Remove cookie-related code from `createTransactionHandler`
2. Remove `getPaymentHistory` and `setCookie` functions
3. Update `paymentHistoryHandler` to only use database

## Security Considerations

1. **Database Credentials**: Never commit `.env` file to repository
2. **SSL Mode**: Use `sslmode=require` in production
3. **Connection Limits**: Monitor and adjust connection pool settings based on load
4. **Input Validation**: All user inputs are validated before database queries
5. **SQL Injection**: Using parameterized queries throughout

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify credentials in `.env` file
- Check firewall settings: `sudo ufw status`

### "Failed to save transaction to database"
- Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
- Verify schema is properly applied
- Check table permissions

### "Verification fails for existing users"
- Ensure `users` and `names` tables are populated
- Check if `lid` field is not empty in `users` table
- Verify data format matches WhatsApp ID format

## Performance Optimization

1. **Indexes**: Already created on frequently queried columns
2. **Connection Pooling**: Configured for optimal performance
3. **Pagination**: Implemented to handle large datasets efficiently
4. **Query Optimization**: Using efficient SQL queries with proper JOINs

## Monitoring

Monitor these metrics:
1. Database connection pool usage
2. Query response times
3. Transaction success/failure rates
4. Premium activation success rates

## Support

For issues:
1. Check backend logs for detailed error messages
2. Verify database schema matches `schema.sql`
3. Test API endpoints individually
4. Review environment variables configuration
