# Shiroine Bot Website

This is the official website for Shiroine WhatsApp Bot, built with React and a secure backend for payment processing.

## Architecture

The project consists of two main components:

1. **Frontend** (React) - User interface, hosted on Vercel/Netlify
2. **Backend** (Go) - Payment gateway integration, hosted on VPS/cloud platform

## Features

### Frontend
- **Home Page**: Overview of bot features and capabilities
- **Pricing Page**: Premium plan options for users and groups
- **Checkout Page**: Secure payment interface
- **Static Pages**: Privacy Policy, Terms of Service, About Tripay
- **Cookie-based Storage**: Payment history and cart management (no login required)
- **Responsive Design**: Mobile-friendly interface
- **Multi-language Support**: Indonesian and English

### Backend
- **Secure Tripay Integration**: Server-side signature generation
- **Payment Processing**: Create and manage transactions
- **Callback Handling**: Automatic payment verification
- **Cookie Management**: Non-expiring storage for payment history
- **API Endpoints**: RESTful API for frontend communication

## Payment Integration

The website uses [Tripay Payment Gateway](https://tripay.co.id) for processing premium purchases through a secure backend server. Users can pay using:
- Virtual Account (Bank Transfer)
- E-Wallet (QRIS, GoPay, OVO, DANA, etc.)
- Retail Outlets (Alfamart, Indomaret, etc.)

**Security Note**: All payment requests go through the backend server at `pay.<your-domain>`. The frontend never directly communicates with Tripay, keeping your API credentials secure.

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Frontend Installation

1. Clone the repository
   ```bash
   git clone https://github.com/suhwr/shiroine-web.git
   cd shiroine-web
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Copy `.env.example` to `.env` and configure:
   ```env
   REACT_APP_BACKEND_URL=https://shiroine.my.id
   WDS_SOCKET_PORT=443
   REACT_APP_ENABLE_VISUAL_EDITS=false
   ENABLE_HEALTH_CHECK=false
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Backend Installation

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Copy `.env.example` to `.env` and configure:
   ```env
   TRIPAY_MODE=sandbox
   TRIPAY_API_KEY=your_tripay_api_key
   TRIPAY_PRIVATE_KEY=your_tripay_private_key
   TRIPAY_MERCHANT_CODE=your_merchant_code
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   DOMAIN=localhost
   ```

4. Start the backend server:
   ```bash
   go run main.go
   # or build and run:
   make build && make run
   ```

## Environment Variables

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://shiroine.my.id
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### Backend (.env)
See `backend/.env.example` for all available options.

## Available Scripts

### Frontend Scripts

#### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

#### `npm run build`
Builds the app for production to the `build` folder.

#### `npm test`
Launches the test runner in interactive watch mode.

### Backend Scripts

#### `go run main.go`
Runs the backend server in development mode.

#### `make build`
Builds the backend server binary.

#### `make run`
Builds and runs the backend server.

#### `make dev`
Runs the backend server with live reload (requires air).

## Project Structure

```
shiroine-web/
├── src/                      # Frontend source
│   ├── components/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Pricing.jsx       # Premium plans page
│   │   ├── Checkout.jsx      # Payment checkout page
│   │   ├── PrivacyPolicy.jsx # Privacy policy page
│   │   ├── TermsOfService.jsx# Terms of service page
│   │   ├── AboutTripay.jsx   # About Tripay page
│   │   └── ui/               # Reusable UI components
│   ├── lib/
│   │   ├── cookies.js        # Cookie utilities
│   │   └── utils.js          # Helper functions
│   ├── config.js             # Configuration constants
│   ├── translations.js       # Multi-language support
│   └── App.js                # Main app component with routing
│
├── backend/                  # Backend server
│   ├── server.js             # Express server
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Environment variables template
│   └── README.md             # Backend documentation
│
├── public/                   # Static files
├── DEPLOYMENT.md             # Deployment guide
├── TRIPAY_INTEGRATION.md     # Tripay setup guide
└── README.md                 # This file
```

## Cookie-based Storage

The application uses non-expiring cookies to store:
- **Payment History**: Last 50 transactions with status
- **Shopping Cart**: Cart items (future feature)

No login is required - cookies persist for 1 year to provide a seamless experience.

## API Endpoints

The backend provides the following endpoints:

- `GET /health` - Health check
- `GET /api/payment-channels` - Get available payment methods
- `POST /api/create-transaction` - Create payment transaction
- `GET /api/transaction-status/:reference` - Check payment status
- `POST /callback` - Tripay payment callback
- `GET /api/payment-history` - Get payment history from cookies
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Update cart items

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deployment Summary

**Frontend**: Deploy to Vercel or Netlify
- Auto-deploys on git push
- Set environment variables in platform dashboard

**Backend**: Deploy to VPS or cloud platform
- Must be on a separate server (not Vercel/Netlify)
- Configure domain: `pay.<your-domain>`
- Setup SSL certificate
- Use PM2 for process management

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Tripay Integration Guide](./TRIPAY_INTEGRATION.md) - Payment gateway setup
- [Backend Documentation](./backend/README.md) - Backend server details

## Security

- ✅ Backend handles all Tripay API calls
- ✅ Signature generation server-side only
- ✅ Private keys never exposed to frontend
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Callback signature verification

## Support

For questions or issues, contact:
- Email: sherdi240@gmail.com
- WhatsApp: +62 831-5666-9609

## License

This project is part of the Shiroine Bot ecosystem.

