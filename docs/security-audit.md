# Security Audit — AInime

**Date:** March 2026
**Scope:** Full client (`src/`) and server (`server/`) codebase review

---

## 1. API Key Exposure

### CRITICAL: Firebase config hardcoded in client
- **File:** `src/lib/firebase.ts`
- **Status:** Acceptable (with caveats)
- **Detail:** Firebase client config (apiKey, authDomain, projectId, etc.) is hardcoded in the client bundle. This is standard for Firebase web apps — the `apiKey` is a public identifier, NOT a secret. Security is enforced by Firebase Security Rules, not by hiding the key.
- **Action Required:** Ensure Firebase Security Rules are properly configured to restrict data access. Configure authorized domains in Firebase Console to prevent unauthorized origins from using the auth config.

### MEDIUM: Gemini API key in `.env` and client bundle
- **File:** `.env` (VITE_GEMINI_API_KEY), `src/lib/aiSearch.ts`
- **Status:** Risk — key exposed in client bundle
- **Detail:** `VITE_GEMINI_API_KEY` is prefixed with `VITE_` which means Vite includes it in the client JavaScript bundle. Anyone can extract this key from browser DevTools.
- **Action Required:** In production, move Gemini API calls to the Express server (`server/src/routes/aiRecommendations.ts`) and keep `GEMINI_API_KEY` server-side only (no `VITE_` prefix). The Vite proxy approach is acceptable for development only.

### LOW: `.env` is gitignored
- **File:** `.gitignore`
- **Status:** OK
- **Detail:** `.env`, `.env.local`, and all `.env.*.local` variants are properly gitignored.

---

## 2. XSS Vulnerabilities

### LOW: `dangerouslySetInnerHTML` usage
- **File:** `src/components/ui/chart.tsx` (line 70)
- **Status:** Safe
- **Detail:** Only used in the shadcn/ui chart component to inject dynamically generated CSS theme variables. No user input flows into this code path.

### OK: No raw HTML rendering of user input
- **Status:** Safe
- **Detail:** Searched entire `src/` directory. No instances of `dangerouslySetInnerHTML` receiving user-controlled data. React's JSX auto-escapes all interpolated values.

---

## 3. Input Sanitization

### MEDIUM: No explicit input sanitization
- **Status:** Acceptable risk
- **Detail:** User inputs (search queries, list notes, tier list names) are not explicitly sanitized before storage. However, React's rendering model prevents XSS by default, and localStorage/PostgreSQL do not execute stored content.
- **Action Required:** If any future feature renders user content as HTML, add DOMPurify or equivalent sanitization.

---

## 4. CORS Configuration

### HIGH: Express server uses open CORS
- **File:** `server/src/index.ts` (line 17)
- **Status:** Risk in production
- **Detail:** `app.use(cors())` allows requests from ANY origin. This is fine for development but dangerous in production.
- **Action Required:** Configure CORS with explicit allowed origins for production:
  ```typescript
  app.use(cors({
    origin: ['https://yourdomain.com'],
    credentials: true,
  }));
  ```

---

## 5. Rate Limiting

### HIGH: No rate limiting on Express API
- **File:** `server/src/index.ts`
- **Status:** Missing
- **Detail:** No rate limiting middleware is configured. The API endpoints (anime list CRUD, tier lists, AI recommendations) are exposed without throttling.
- **Action Required:** Add `express-rate-limit` middleware before deploying to production.

---

## 6. Authentication

### OK: Firebase Auth with secure session handling
- **File:** `src/contexts/SimpleAuthContext.tsx`
- **Status:** Acceptable
- **Detail:** Authentication is handled entirely by Firebase SDK. No custom JWT or session token management that could introduce vulnerabilities. Privacy settings are stored in localStorage keyed by user ID.

### MEDIUM: Server-side auth verification not audited
- **File:** `server/src/routes/` (all route files)
- **Status:** Needs verification
- **Detail:** Server routes should verify Firebase ID tokens for authenticated endpoints. Ensure `firebase-admin` is used to verify tokens, not just trusting client-sent user IDs.

---

## 7. Data Privacy

### OK: Privacy controls implemented
- **File:** `src/types/privacy.ts`, `src/components/PrivacySettings.tsx`
- **Status:** Good
- **Detail:** Users can control visibility of their lists and activity through privacy settings.

---

## 8. Console Statements

### CLEANED: Removed debug console.log
- **File:** `src/pages/AISearch.tsx`
- **Status:** Fixed
- **Detail:** Removed 2 `console.log` statements that were logging AI response data and search titles to the browser console. Remaining `console.warn` and `console.error` statements are appropriate for error handling.

### Remaining console statements (acceptable):
- `console.error` — used for legitimate error logging (404, auth failures, API errors)
- `console.warn` — used for non-critical warnings (image fetch failures, search fallbacks)

---

## Summary

| Finding | Severity | Status |
|---------|----------|--------|
| Firebase config in client | Low | Acceptable (standard practice) |
| Gemini API key in client bundle | Medium | Must move server-side for production |
| Open CORS on Express | High | Must restrict for production |
| No rate limiting | High | Must add for production |
| No input sanitization library | Medium | Acceptable (React auto-escapes) |
| `dangerouslySetInnerHTML` | Low | Safe (CSS only, no user input) |
| Debug console.log | Low | Fixed |
| Server-side auth verification | Medium | Needs verification |
