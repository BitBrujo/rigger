# Deployment Notes

## Remote Access Configuration

### Current Setup (Temporary Solution)

**Date**: 2025-11-22

**Issue**: Turbopack (Next.js 16) was not properly picking up environment variable changes from `.env.local` file, even after clearing cache and restarting the dev server.

**Symptoms**:
- Updated `NEXT_PUBLIC_API_URL` in `.env.local` to `http://100.87.169.2:3333/api`
- Browser console showed it was still using `http://localhost:3333/api`
- Cleared `.next` cache multiple times with no effect
- Environment variable appeared correct in build output but was cached in compiled code

**Temporary Solution**:
Hardcoded the API URL directly in `lib/api-client.ts`:

```typescript
// TEMPORARY HARDCODE: Turbopack is not picking up environment variable changes
const API_BASE_URL = 'http://100.87.169.2:3333/api';
```

**Location**: `lib/api-client.ts:4`

### Proper Solutions (To Implement Later)

1. **Dynamic Host Detection**:
   ```typescript
   const API_BASE_URL = typeof window !== 'undefined'
     ? `http://${window.location.hostname}:3333/api`
     : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
   ```
   This automatically uses the same host as the frontend, making it work for both local and remote access.

2. **Switch to Webpack** (if Turbopack issues persist):
   ```bash
   # In package.json, change:
   "dev": "next dev -p 3334"
   # Instead of current Turbopack mode
   ```

3. **Build in Production Mode**:
   ```bash
   npm run build
   npm run start
   ```
   Production builds handle environment variables more reliably.

4. **Use Next.js Runtime Config** (for dynamic values):
   In `next.config.js`:
   ```javascript
   module.exports = {
     publicRuntimeConfig: {
       apiUrl: process.env.NEXT_PUBLIC_API_URL
     }
   }
   ```

### Network Configuration

- **Frontend**: Port 3334
- **Backend API**: Port 3333 (Docker maps to internal port 3001)
- **Database**: Port 3335 (PostgreSQL, internal port 5432)
- **Tailscale IP**: 100.87.169.2 (for remote access)

### Environment Files

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://100.87.169.2:3333/api
```

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
ANTHROPIC_API_KEY=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
NODE_ENV=development
PORT=3001
```

### TODO

- [ ] Implement dynamic host detection (Solution #1 above)
- [ ] Remove hardcoded URL from `lib/api-client.ts`
- [ ] Test with production build
- [ ] Consider adding environment-specific config files
- [ ] Update CLAUDE.md with remote access instructions

### Testing Remote Access

1. Ensure all services are running:
   ```bash
   docker-compose up -d    # Backend + PostgreSQL
   npm run dev             # Frontend
   ```

2. Verify backend is accessible from external IP:
   ```bash
   curl http://100.87.169.2:3333/health
   curl http://100.87.169.2:3333/api/presets
   ```

3. Access frontend from remote browser:
   ```
   http://100.87.169.2:3334
   ```

4. Check browser console for API URL confirmation:
   ```
   [API Client] Using API_BASE_URL: http://100.87.169.2:3333/api
   [API Client] HARDCODED for remote access
   ```

### Known Issues

- **Turbopack Environment Variables**: Turbopack aggressively caches compiled code, including inlined environment variables. May require full server restart or switch to webpack mode.
- **Cross-Origin Warnings**: Next.js shows warnings about cross-origin requests from Tailscale IP (100.87.169.2). Can be resolved by adding to `next.config.js`:
  ```javascript
  experimental: {
    allowedDevOrigins: ['100.87.169.2']
  }
  ```
