# Shiroine Payment Backend Server

Backend server for handling Tripay payment gateway integration for Shiroine Bot premium services.

## Overview

This backend server securely handles all payment-related operations with Tripay payment gateway, including:
- Payment channel retrieval
- Transaction creation with signature generation
- Payment callback handling
- Transaction status checking
- Cookie-based storage for payment history and cart

## Features

- ✅ Secure signature generation (server-side only)
- ✅ Tripay callback verification
- ✅ Cookie-based payment history (non-expiring)
- ✅ Cookie-based cart management
- ✅ CORS support for frontend
- ✅ Rate limiting protection
- ✅ Security headers
- ✅ Health check endpoint
- ✅ Written in Go for better performance and lower resource usage

## Prerequisites

- Go 1.18+ or higher
- Tripay merchant account (sandbox or production)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Tripay Configuration
TRIPAY_MODE=sandbox  # or 'production' for live
TRIPAY_API_KEY=your_api_key_here
TRIPAY_PRIVATE_KEY=your_private_key_here
TRIPAY_MERCHANT_CODE=your_merchant_code_here

# Server Configuration
PORT=3001
NODE_ENV=development  # or 'production'

# Frontend URL (for CORS)
FRONTEND_URL=https://shiroine.my.id

# Domain
DOMAIN=shiroine.my.id
```

## Running the Server

### Development Mode
```bash
go run main.go
```

### Production Mode (Build and Run)
```bash
# Build the binary
go build -o server main.go

# Run the binary
./server
```

### Using Makefile
```bash
# Build the server
make build

# Run the server
make run

# Run in development mode with live reload (requires air)
make dev

# Clean build artifacts
make clean
```

### Using Docker
```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down

# Build manually
docker build -t shiroine-backend .

# Run manually
docker run -p 3001:3001 --env-file .env shiroine-backend
```

The server will start on `http://localhost:3001` (or the port specified in .env).

## Deployment

### Recommended Deployment Options

This backend should be deployed separately from the frontend (not on Vercel/Netlify). Recommended options:

1. **VPS/Cloud Server** (DigitalOcean, Linode, Vultr, etc.)
   - Install Node.js
   - Clone repository
   - Install dependencies
   - Configure environment variables
   - Use PM2 for process management
   - Configure Nginx as reverse proxy

2. **Platform as a Service** (Heroku, Railway, Render, etc.)
   - Connect GitHub repository
   - Set environment variables in platform dashboard
   - Deploy automatically on push

### Deployment Steps (VPS Example)

1. **Install Go on VPS:**
```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

2. **Clone and Setup:**
```bash
git clone <repository>
cd shiroine-web/backend
go mod download
cp .env.example .env
nano .env  # Configure your environment variables
```

3. **Build and Run with systemd:**
```bash
# Build the binary
go build -o server main.go

# Create systemd service file
sudo nano /etc/systemd/system/shiroine-payment.service
```

Add the following content:
```ini
[Unit]
Description=Shiroine Payment Backend Server
After=network.target

[Service]
Type=simple
User=runner
WorkingDirectory=/path/to/shiroine-web/backend
Environment="PATH=/usr/local/go/bin:/usr/bin:/bin"
ExecStart=/path/to/shiroine-web/backend/server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable shiroine-payment
sudo systemctl start shiroine-payment
sudo systemctl status shiroine-payment
```

4. **Configure Nginx (Reverse Proxy):**
```nginx
server {
    listen 80;
    server_name pay.shiroine.my.id;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Setup SSL with Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d pay.shiroine.my.id
```

## Domain Configuration

The backend should be accessible at `pay.<your-domain>`. For example:
- Main website: `https://shiroine.my.id`
- Payment backend: `https://pay.shiroine.my.id`

Configure DNS A record:
- Type: A
- Name: pay
- Value: [Your VPS IP Address]

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration mode.

### Get Payment Channels
```
GET /api/payment-channels
```
Returns available payment methods from Tripay.

### Create Transaction
```
POST /api/create-transaction
Body: {
  method: string,
  amount: number,
  customerName: string,
  customerPhone: string,
  orderItems: array,
  returnUrl: string
}
```
Creates a new payment transaction and returns payment details.

### Transaction Status
```
GET /api/transaction-status/:reference
```
Checks the status of a transaction by reference.

### Payment Callback (Tripay Webhook)
```
POST /callback
Headers: {
  x-callback-signature: string
}
```
Receives payment status updates from Tripay.

### Payment History
```
GET /api/payment-history
```
Returns payment history stored in cookies.

### Cart Management
```
GET /api/cart
POST /api/cart
Body: { items: array }
```
Manage shopping cart stored in cookies.

## Tripay Callback Configuration

In your Tripay dashboard, configure the callback URL:
```
https://pay.shiroine.my.id/callback
```

The callback handler will:
1. Verify the signature from Tripay
2. Process payment status updates
3. Update payment history in cookies
4. Log payment events

## Security Features

- **HMAC Signature Verification**: All Tripay requests are signed with HMAC-SHA256
- **Callback Verification**: Validates Tripay callback signatures
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes per IP)
- **Helmet.js**: Sets security headers
- **CORS**: Configured to allow only your frontend domain
- **Environment Variables**: Sensitive data never exposed to client

## Cookie-based Storage

The backend uses cookies (not requiring login) for:

### Payment History
- Stores last 50 transactions
- Includes status, amount, and timestamps
- Non-expiring (1 year max age)
- Accessible from client-side

### Shopping Cart
- Stores cart items
- Non-expiring (1 year max age)
- Accessible from client-side

## Monitoring and Logs

Use systemd for monitoring:
```bash
# View logs
sudo journalctl -u shiroine-payment -f

# Check status
sudo systemctl status shiroine-payment

# Restart service
sudo systemctl restart shiroine-payment
```

## Troubleshooting

### Server not starting
- Check if port 3001 is available
- Verify environment variables are set correctly
- Check Go version (should be 1.18+)
- Ensure all dependencies are installed: `go mod download`

### Payment channels not loading
- Verify Tripay API key is correct
- Check if Tripay account is active
- Ensure using correct API URL (sandbox vs production)

### Callback not receiving updates
- Verify callback URL in Tripay dashboard
- Check firewall settings allow incoming connections
- Verify signature validation is working

## Support

For issues related to:
- **Tripay Integration**: support@tripay.co.id
- **Shiroine Bot**: sherdi240@gmail.com

## License

ISC
