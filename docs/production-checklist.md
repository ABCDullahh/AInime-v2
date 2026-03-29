# Production Deployment Checklist — AInime

## Database

- [ ] PostgreSQL installed and running on VPS
- [ ] Run Prisma migrations: `cd server && npx prisma migrate deploy`
- [ ] Verify database connection string in `server/.env`
- [ ] Test database connectivity: `npx prisma db pull`

## Firebase

- [ ] Firebase authorized domains configured (add production domain in Firebase Console > Authentication > Settings > Authorized domains)
- [ ] Firebase Security Rules reviewed and tightened for production
- [ ] Firebase service account JSON downloaded and placed at `server/firebase-service-account.json`
- [ ] Verify `FIREBASE_SERVICE_ACCOUNT` path in `server/.env`

## Environment Variables

### Client (`.env`)
- [ ] `VITE_API_URL=/api` (relative path for production proxy)
- [ ] `VITE_USE_LOCAL_ONLY=false` (enable remote API mode)
- [ ] Remove `VITE_GEMINI_API_KEY` from client env (move to server-only)

### Server (`server/.env`)
- [ ] `DATABASE_URL=postgresql://user:password@localhost:5432/anime_compass?schema=public`
- [ ] `PORT=3001`
- [ ] `FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json`
- [ ] `GEMINI_API_KEY=<production-api-key>` (server-side only, no VITE_ prefix)
- [ ] `NODE_ENV=production`

## Build & Server

- [ ] `npm run build` succeeds without errors (produces `dist/` directory)
- [ ] Express server starts: `cd server && npm start`
- [ ] Health check responds: `curl http://localhost:3001/api/health`
- [ ] Static files served from `dist/` in production mode
- [ ] SPA fallback works (all routes return `index.html`)

## Nginx Reverse Proxy

- [ ] Nginx installed and configured
- [ ] Proxy `/api` requests to Express server (port 3001)
- [ ] Proxy `/api-proxy/gemini` to `https://generativelanguage.googleapis.com` (or handle in Express)
- [ ] Serve static files from `dist/` directly via Nginx for performance
- [ ] Enable gzip compression for JS/CSS/HTML
- [ ] Set appropriate cache headers for static assets
- [ ] Configure WebSocket support if needed

## SSL / HTTPS

- [ ] SSL certificate obtained via Certbot (`certbot --nginx -d yourdomain.com`)
- [ ] Auto-renewal configured (`certbot renew --dry-run`)
- [ ] HTTP to HTTPS redirect configured
- [ ] HSTS header enabled

## Security Hardening

- [ ] Rate limiting on Express API (`express-rate-limit`)
  ```typescript
  import rateLimit from 'express-rate-limit';
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  ```
- [ ] CORS configured for production domain only
  ```typescript
  app.use(cors({ origin: ['https://yourdomain.com'], credentials: true }));
  ```
- [ ] Helmet.js middleware added for security headers
- [ ] Gemini API key moved to server-side only (remove from client bundle)
- [ ] Firebase service account file permissions restricted (`chmod 600`)
- [ ] Express trust proxy enabled if behind Nginx (`app.set('trust proxy', 1)`)

## Code Cleanup

- [x] Remove debug `console.log` statements from production code
- [ ] Verify no API keys/secrets in committed code (only in `.env` files)
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run lint: `npx eslint src/`

## External Services

- [ ] Image CDN (Kitsu) accessible from VPS — verify `https://media.kitsu.app` is reachable
- [ ] Jikan API accessible — verify `https://api.jikan.moe/v4` responds
- [ ] AniList API accessible — verify `https://graphql.anilist.co` responds
- [ ] Gemini API key rotated for production (use a fresh key, not the development key)
- [ ] Firebase authorized domains updated with production URL

## PWA

- [ ] Service worker registers correctly in production
- [ ] Manifest icons (`favicon.png`, `pwa-icon.svg`, `pwa-maskable.svg`) are accessible
- [ ] Offline fallback works for cached pages
- [ ] PWA install prompt appears on supported browsers

## Monitoring (Optional)

- [ ] Error tracking service configured (Sentry, LogRocket, etc.)
- [ ] Uptime monitoring for health endpoint
- [ ] Log rotation configured for Express server output
- [ ] Database backup schedule established
