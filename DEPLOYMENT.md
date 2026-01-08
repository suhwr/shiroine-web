# Deployment Guide for Shiroine Web

This guide covers deploying both the frontend and backend components of Shiroine Web.

## Architecture Overview

The Shiroine Web application consists of two parts:

1. **Frontend** - React application (deployed to Vercel/Netlify)
2. **Backend** - Node.js/Express server for Tripay integration (deployed to VPS or cloud platform)

## Frontend Deployment

### Deploying to Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install --legacy-peer-deps`

3. **Environment Variables**
   Set the following in Vercel dashboard:
   ```
   REACT_APP_BACKEND_URL=https://shiroine.my.id
   WDS_SOCKET_PORT=443
   REACT_APP_ENABLE_VISUAL_EDITS=false
   ENABLE_HEALTH_CHECK=false
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Deploying to Netlify

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Install command: `npm install --legacy-peer-deps`

3. **Environment Variables**
   Set in Netlify dashboard (same as Vercel)

4. **Deploy**
   - Click "Deploy site"

## Backend Deployment

The backend MUST be deployed to a separate server (not Vercel/Netlify) because:
- It needs Node.js runtime support
- It handles sensitive Tripay credentials
- It requires persistent connections for callbacks

### Option 1: VPS Deployment (Recommended for Production)

#### Prerequisites
- A VPS (DigitalOcean, Linode, Vultr, AWS EC2, etc.)
- Ubuntu 20.04+ or similar Linux distribution
- Domain/subdomain pointing to your VPS (e.g., pay.shiroine.my.id)

#### Step 1: Setup VPS

1. **Connect to VPS**
   ```bash
   ssh root@your_vps_ip
   ```

2. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   ```

4. **Install Nginx**
   ```bash
   apt install nginx -y
   ```

5. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

#### Step 2: Deploy Backend

1. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/suhwr/shiroine-web.git
   cd shiroine-web/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Edit the following values:
   ```env
   TRIPAY_MODE=production
   TRIPAY_API_KEY=your_production_api_key
   TRIPAY_PRIVATE_KEY=your_production_private_key
   TRIPAY_MERCHANT_CODE=your_merchant_code
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://shiroine.my.id
   DOMAIN=shiroine.my.id
   ```

4. **Start with PM2**
   ```bash
   pm2 start server.js --name shiroine-payment
   pm2 startup
   pm2 save
   ```

5. **Check Status**
   ```bash
   pm2 status
   pm2 logs shiroine-payment
   ```

#### Step 3: Configure Nginx

1. **Create Nginx Configuration**
   ```bash
   nano /etc/nginx/sites-available/pay.shiroine.my.id
   ```

2. **Add Configuration**
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

3. **Enable Site**
   ```bash
   ln -s /etc/nginx/sites-available/pay.shiroine.my.id /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

#### Step 4: Setup SSL with Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d pay.shiroine.my.id
```

Follow the prompts to complete SSL setup.

#### Step 5: Configure DNS

In your DNS provider (e.g., Cloudflare), add an A record:
- Type: A
- Name: pay
- Value: [Your VPS IP Address]
- TTL: Auto

### Option 2: Platform as a Service (PaaS)

#### Deploying to Railway.app

1. **Create Account**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Root Directory: `/backend`
   - Start Command: `npm start`

4. **Environment Variables**
   Set all variables from `.env.example`

5. **Generate Domain**
   - Railway will provide a domain
   - Or add custom domain: pay.shiroine.my.id

#### Deploying to Render.com

1. **Create Account**
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect repository

3. **Configure**
   - Name: shiroine-payment-backend
   - Root Directory: backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Environment Variables**
   Add all variables from `.env.example`

5. **Domain**
   - Use Render's domain or add custom domain

#### Deploying to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create shiroine-payment-backend
   ```

3. **Configure Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. **Set Root Directory**
   Create a `Procfile` in backend directory:
   ```
   web: node server.js
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set TRIPAY_MODE=production
   heroku config:set TRIPAY_API_KEY=your_api_key
   # ... set all other variables
   ```

6. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

## DNS Configuration

For both frontend and backend to work together:

1. **Main Domain** (shiroine.my.id)
   - Points to Vercel/Netlify
   - Configure in your DNS provider

2. **Payment Subdomain** (pay.shiroine.my.id)
   - Points to your backend server
   - A record: pay → [Backend IP]

## Tripay Configuration

1. **Login to Tripay Dashboard**
   - Go to [Tripay.co.id](https://tripay.co.id)
   - Login to merchant dashboard

2. **Configure Callback URL**
   - Navigate to Settings → Callback URL
   - Set: `https://pay.shiroine.my.id/callback`

3. **Get Production Credentials**
   - API Key
   - Private Key
   - Merchant Code

4. **Update Backend .env**
   - Set TRIPAY_MODE=production
   - Add production credentials

## Post-Deployment Verification

### Frontend
1. Visit your main domain
2. Check all pages load correctly:
   - Home page
   - Pricing page
   - Privacy Policy
   - Terms of Service
   - About Tripay

### Backend
1. **Health Check**
   ```bash
   curl https://pay.shiroine.my.id/health
   ```
   Should return: `{"status":"ok","timestamp":"...","mode":"production"}`

2. **Payment Channels**
   ```bash
   curl https://pay.shiroine.my.id/api/payment-channels
   ```
   Should return available payment methods

3. **Test Payment Flow**
   - Go to pricing page
   - Select a plan
   - Enter WhatsApp number
   - Choose payment method
   - Verify transaction creation

## Monitoring

### Backend Monitoring with PM2

```bash
# View logs
pm2 logs shiroine-payment

# Monitor resources
pm2 monit

# Restart service
pm2 restart shiroine-payment

# View status
pm2 status
```

### Setup PM2 Web Dashboard (Optional)

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting

### Backend Issues

**Backend not starting:**
```bash
pm2 logs shiroine-payment --err
```

**Port already in use:**
```bash
lsof -i :3001
kill -9 [PID]
pm2 restart shiroine-payment
```

**Nginx issues:**
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Frontend Issues

**Build fails on Vercel/Netlify:**
- Use install command: `npm install --legacy-peer-deps`
- Check build logs for specific errors

**CORS errors:**
- Verify FRONTEND_URL in backend .env
- Check backend CORS configuration

### Payment Issues

**Callback not working:**
1. Verify callback URL in Tripay dashboard
2. Check backend logs: `pm2 logs shiroine-payment`
3. Test callback signature validation
4. Ensure firewall allows incoming connections

**Payment channels not loading:**
1. Verify Tripay credentials
2. Check API mode (sandbox vs production)
3. Check backend logs

## Security Checklist

- [ ] Backend .env file is not committed to git
- [ ] Tripay private key is only in backend
- [ ] SSL/HTTPS enabled on both frontend and backend
- [ ] Rate limiting enabled on backend
- [ ] CORS properly configured
- [ ] Firewall configured to allow only necessary ports
- [ ] PM2 configured to restart on crashes
- [ ] Regular backups of environment files
- [ ] Monitoring and logging enabled

## Updates and Maintenance

### Updating Backend

```bash
cd /var/www/shiroine-web
git pull origin main
cd backend
npm install
pm2 restart shiroine-payment
```

### Updating Frontend

Push to main branch - Vercel/Netlify will auto-deploy

## Support

For deployment issues:
- Frontend: Check Vercel/Netlify logs
- Backend: Check PM2 logs (`pm2 logs`)
- Tripay: support@tripay.co.id
- General: sherdi240@gmail.com
