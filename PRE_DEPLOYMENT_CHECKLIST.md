# Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## Backend Setup

### Environment Configuration
- [ ] Created `.env` file from `.env.example`
- [ ] Set `TRIPAY_MODE=production` (or `sandbox` for testing)
- [ ] Added Tripay production API key
- [ ] Added Tripay production private key
- [ ] Added Tripay merchant code
- [ ] Set `PORT=3001` (or your preferred port)
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to your production frontend domain
- [ ] Set `DOMAIN` to your production domain (without pay. prefix)

### Dependencies
- [ ] Installed Node.js 14+ on server
- [ ] Ran `npm install` in `/backend` directory
- [ ] All dependencies installed successfully

### Server Setup (VPS)
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Backend started with PM2 (`pm2 start server.js --name shiroine-payment`)
- [ ] PM2 startup script created (`pm2 startup`)
- [ ] PM2 processes saved (`pm2 save`)
- [ ] Backend accessible on configured port

### Nginx Configuration
- [ ] Nginx installed
- [ ] Created site configuration in `/etc/nginx/sites-available/`
- [ ] Enabled site with symlink to `/etc/nginx/sites-enabled/`
- [ ] Tested Nginx config (`nginx -t`)
- [ ] Restarted Nginx (`systemctl restart nginx`)

### SSL/HTTPS
- [ ] Certbot installed
- [ ] SSL certificate obtained (`certbot --nginx -d pay.yourdomain.com`)
- [ ] Auto-renewal configured
- [ ] HTTPS working and redirects from HTTP

### DNS Configuration
- [ ] A record created: `pay` → Backend server IP
- [ ] DNS propagated (check with `dig pay.yourdomain.com`)
- [ ] Backend accessible at `https://pay.yourdomain.com`

### Backend Testing
- [ ] Health check works: `curl https://pay.yourdomain.com/health`
- [ ] Returns: `{"status":"ok","timestamp":"...","mode":"production"}`
- [ ] Payment channels endpoint works
- [ ] No errors in PM2 logs (`pm2 logs shiroine-payment`)

## Frontend Setup

### Environment Configuration
- [ ] Verified `.env` or platform environment variables
- [ ] `REACT_APP_BACKEND_URL` set to main domain
- [ ] `WDS_SOCKET_PORT=443` (for Vercel/Netlify)
- [ ] `REACT_APP_ENABLE_VISUAL_EDITS=false`
- [ ] `ENABLE_HEALTH_CHECK=false`

### Build Testing
- [ ] Local build successful: `npm run build`
- [ ] No errors or warnings in build output
- [ ] Build folder created with all static files

### Deployment Platform (Vercel/Netlify)
- [ ] Repository connected to platform
- [ ] Build command: `npm run build`
- [ ] Install command: `npm install --legacy-peer-deps`
- [ ] Output directory: `build`
- [ ] Environment variables set in platform dashboard
- [ ] Custom domain configured (if applicable)

### Frontend Testing
- [ ] All pages load correctly:
  - [ ] Home page (`/`)
  - [ ] Pricing page (`/pricing`)
  - [ ] Checkout page (`/checkout`)
  - [ ] Privacy Policy (`/privacy-policy`)
  - [ ] Terms of Service (`/terms-of-service`)
  - [ ] About Tripay (`/about-tripay`)
- [ ] Language toggle works (ID/EN)
- [ ] Navigation links functional
- [ ] Footer links work
- [ ] Responsive design on mobile

## Tripay Configuration

### Tripay Dashboard
- [ ] Logged into Tripay merchant dashboard
- [ ] Using production credentials (not sandbox)
- [ ] Account verified and active
- [ ] Payment methods activated

### Callback Configuration
- [ ] Callback URL set: `https://pay.yourdomain.com/callback`
- [ ] Callback URL saved in Tripay dashboard
- [ ] Signature verification enabled

### Credentials Verification
- [ ] API Key is correct
- [ ] Private Key is correct
- [ ] Merchant Code is correct
- [ ] Mode is set to 'production' in backend .env

## Payment Flow Testing

### Complete Transaction Test
- [ ] Navigate to pricing page
- [ ] Select a premium plan
- [ ] Click "Buy Now"
- [ ] Enter test WhatsApp number
- [ ] Payment methods load from backend
- [ ] Select a payment method
- [ ] Transaction creates successfully
- [ ] Redirects to Tripay payment page
- [ ] Payment instructions displayed

### Backend Payment Processing
- [ ] Transaction appears in backend logs
- [ ] Payment history saved in cookie
- [ ] Transaction reference generated correctly
- [ ] Signature calculated properly

### Callback Testing
- [ ] Make a test payment in sandbox mode first
- [ ] Verify callback received in backend logs
- [ ] Signature validation passes
- [ ] Payment status updates correctly
- [ ] Cookie updated with new status

## Security Verification

### Credentials Protection
- [ ] No Tripay credentials in frontend code
- [ ] `.env` file in `.gitignore`
- [ ] Backend `.env` not committed to repository
- [ ] Private key only in backend server

### HTTPS/SSL
- [ ] Frontend uses HTTPS
- [ ] Backend uses HTTPS
- [ ] SSL certificates valid and trusted
- [ ] No mixed content warnings

### API Security
- [ ] CORS configured to only allow frontend domain
- [ ] Rate limiting active on backend
- [ ] Helmet security headers enabled
- [ ] Signature verification on callbacks

### Cookie Security
- [ ] Cookies set with secure flag in production
- [ ] SameSite policy configured
- [ ] No sensitive data in cookies (just references)

## Monitoring & Logging

### Backend Monitoring
- [ ] PM2 status shows running: `pm2 status`
- [ ] PM2 logs accessible: `pm2 logs shiroine-payment`
- [ ] No error messages in logs
- [ ] Log rotation configured (optional)

### Frontend Monitoring
- [ ] Platform analytics enabled (Vercel/Netlify)
- [ ] Error tracking setup (optional)
- [ ] Performance monitoring (optional)

### Tripay Monitoring
- [ ] Can access Tripay dashboard transaction logs
- [ ] Webhook/callback logs visible
- [ ] Payment status updating correctly

## Documentation

### Team Documentation
- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT.md reviewed
- [ ] Backend README.md available
- [ ] Environment variables documented

### User Documentation
- [ ] Privacy Policy accessible
- [ ] Terms of Service accessible
- [ ] About Tripay page informative
- [ ] Contact information correct

## Backup & Recovery

### Configuration Backup
- [ ] Backend `.env` file backed up securely
- [ ] Nginx configuration backed up
- [ ] PM2 ecosystem file saved (if used)

### Disaster Recovery Plan
- [ ] Know how to restart backend (`pm2 restart`)
- [ ] Know how to check logs (`pm2 logs`)
- [ ] Have SSH access to server
- [ ] Have access to Tripay dashboard

## Go-Live Checklist

### Final Verification (Production)
- [ ] All tests pass in production environment
- [ ] Test payment completed successfully
- [ ] Callback received and processed
- [ ] Payment history updates in cookies
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Mobile responsiveness verified

### Communication
- [ ] Users notified about payment feature
- [ ] Support team informed about new system
- [ ] Contact information updated if needed

### Post-Launch Monitoring
- [ ] Monitor first few transactions closely
- [ ] Check logs regularly for first 24 hours
- [ ] Be available for quick fixes if needed
- [ ] Verify callback processing is working

## Common Issues & Solutions

### Backend won't start
```bash
# Check logs
pm2 logs shiroine-payment --err

# Restart
pm2 restart shiroine-payment

# Check if port is in use
lsof -i :3001
```

### Callback not working
- Verify URL in Tripay dashboard
- Check firewall allows incoming connections
- Verify signature validation code
- Check backend logs for callback attempts

### CORS errors
- Verify `FRONTEND_URL` in backend .env
- Check CORS configuration in server.js
- Clear browser cache
- Check browser console for specific error

### Payment methods not loading
- Verify Tripay credentials
- Check API mode (sandbox vs production)
- Check backend logs
- Verify network connectivity to Tripay

## Support Contacts

### Technical Support
- Email: sherdi240@gmail.com
- WhatsApp: +62 831-5666-9609

### Tripay Support
- Email: support@tripay.co.id
- Website: https://tripay.co.id
- Documentation: https://tripay.co.id/developer

## Notes

- Test thoroughly in sandbox mode before switching to production
- Keep backup of all configuration files
- Monitor logs closely after deployment
- Document any custom changes made
- Update this checklist based on your experience

---

**Last Updated**: January 2026
**Version**: 1.0
