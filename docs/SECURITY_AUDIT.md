# Maths Tutor Application - Security Audit Report

**Date:** October 5, 2026  
**Target:** Maths Tutor AI (`https://maths-tutor-116776748387.europe-west2.run.app`)  
**Deployment Platform:** Google Cloud Run (`europe-west2`) with Direct Identity-Aware Proxy (IAP)  
**Database:** PostgreSQL on Supabase (`db.xtfhgctryfiyiiuzjava.supabase.co`)  
**Auditor:** Antigravity AI Security Review  

---

## 1. Executive Summary

A comprehensive security audit of the deployed **Maths Tutor** application was performed covering perimeter access control, cloud infrastructure IAM, secrets management, HTTP transport security, application authorization logic, and container configurations.

Overall, the perimeter defense is **strong**: Direct Identity-Aware Proxy (IAP) is correctly enforced, preventing unauthenticated network access to the application container. However, several critical defense-in-depth issues were discovered in cloud IAM least-privilege configuration, secrets storage, missing security headers, client cookie handling, and object-level authorization (IDOR).

### Security Posture Scorecard

| Area | Status | Severity | Summary |
| :--- | :---: | :---: | :--- |
| **Perimeter Access Control** | 🟢 PASS | Low | Direct IAP active; blocks unauthenticated requests before reaching the container. |
| **GCP IAM & Service Accounts** | 🔴 FAIL | High | Cloud Run runs as default Compute service account with project-wide `roles/editor`. |
| **Secrets & Transport** | 🟡 WARN | Medium | `DATABASE_URL` and `GEMINI_API_KEY` are plaintext env vars; PostgreSQL lacks `sslmode=require`. |
| **HTTP Security Headers** | 🟡 WARN | Medium | Missing CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, and `poweredByHeader`. |
| **Application & Session Auth** | 🟡 WARN | Medium | `userId` cookie lacks `httpOnly`; reward operations lack ownership verification (BOLA/IDOR). |
| **Container & Supply Chain** | 🟢 PASS | Low | Container runs as non-root user (`USER nextjs`); `.dockerignore` excludes secrets; 24 transitive dependency advisories. |

---

## 2. Detailed Findings

### Finding 1: Overprivileged Runtime Service Account (High Risk)
- **Component:** Google Cloud Run Service (`maths-tutor`)
- **Current Configuration:**
  - Service Account: `116776748387-compute@developer.gserviceaccount.com`
  - Assigned Roles: `roles/editor`, `roles/run.builder`
- **Impact:** If an attacker achieves Remote Code Execution (RCE) or exploits Server-Side Request Forgery (SSRF) against the internal metadata server (`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`), the attacker gains an OAuth token with full Editor access across the entire Google Cloud project.
- **Remediation:** Create a dedicated, unprivileged service account (`maths-tutor-runner`) with zero GCP project roles, since the application only connects out to Supabase and Google Gemini API.

### Finding 2: Plaintext Credentials in Cloud Run Environment Variables (Medium Risk)
- **Component:** Cloud Run Service Configuration
- **Current Configuration:** `DATABASE_URL` (including Supabase postgres password) and `GEMINI_API_KEY` are stored directly in `spec.template.spec.containers[0].env`.
- **Impact:** Anyone with `roles/run.viewer` or access to Cloud Run revision descriptions/logs can extract database credentials and AI API keys.
- **Remediation:** Transition credentials to Google Secret Manager or restrict GCP IAM viewer roles. Also append `?sslmode=require` to `DATABASE_URL` to ensure TLS verification.

### Finding 3: Missing HTTP Security Headers (Medium Risk)
- **Component:** Next.js Server Configuration (`next.config.ts`)
- **Current Configuration:** No custom headers defined. `poweredByHeader` is not disabled.
- **Missing Headers:**
  - `X-Frame-Options: DENY` (Clickjacking protection)
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Remediation:** Configure `headers()` and `poweredByHeader: false` in `next.config.ts`.

### Finding 4: Insecure Cookie Configuration (Medium Risk)
- **Component:** Next.js Server Actions (`src/app/actions/user.ts`)
- **Current Configuration:** The `userId` cookie is stored with `sameSite: 'lax'`, `secure: true`, but `httpOnly` is not set (`httpOnly: false` by default).
- **Impact:** Any potential Cross-Site Scripting (XSS) vulnerability or untrusted third-party client script can read the active `userId` from `document.cookie`.
- **Remediation:** Explicitly set `httpOnly: true` on all `userId` cookie mutations.

### Finding 5: Broken Object-Level Authorization (BOLA/IDOR) in Rewards Actions (Medium Risk)
- **Component:** Next.js Server Actions (`src/app/actions/rewards.ts`)
- **Current Configuration:** In `deleteReward`, `claimReward`, `requestTaskApproval`, `approveTaskProgress`, and `rejectTaskApproval`, mutations take `rewardId` without verifying that `reward.userId === user.id`. In contrast, `updateReward` properly enforces ownership.
- **Impact:** An authenticated user can tamper with, approve, or delete rewards belonging to other user profiles by passing another reward ID.
- **Remediation:** Enforce `userId` check across all reward mutation functions before executing database updates or deletions.

### Finding 6: Redundant SQLite Backup Child Process in Serverless Container (Low Risk)
- **Component:** Next.js Server Actions (`src/app/actions/progression.ts`)
- **Current Configuration:** `finishSession` calls `exec('bash backup-db.sh backup')` in the background.
- **Impact:** `backup-db.sh` is designed for SQLite (`data/maths_tutor.db`) and is not copied into the Docker container. On Cloud Run with PostgreSQL, this execution constantly fails and pollutes container logs.
- **Remediation:** Guard the script execution so it only runs if using SQLite locally and the script file exists.

### Finding 7: Dependency Vulnerabilities (Low Risk)
- **Component:** `package-lock.json`
- **Current Configuration:** `npm audit` reports 24 vulnerabilities (17 high, 7 moderate) in transitive dependencies (e.g., `postcss`, `braces`, `nanoid`, `valibot`).
- **Remediation:** Run targeted non-breaking fixes (`npm audit fix`) or update dependencies cleanly.

---

## 3. Remediation Roadmap & Actions Taken

1. [x] **Audit and Document**: Complete vulnerability analysis and issue report.
2. [x] **Code Fix - HTTP Headers**: Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and disabled `poweredByHeader` in `next.config.ts`.
3. [x] **Code Fix - Cookie Hardening**: Enforced `httpOnly: true` on all `userId` cookie operations (`createUser`, `switchUser`, `startNewProfileOnboarding`) in `src/app/actions/user.ts`.
4. [x] **Code Fix - Authorization Checks**: Added user ownership verification (`reward.userId === user.id`) to `deleteReward`, `claimReward`, `requestTaskApproval`, `approveTaskProgress`, and `rejectTaskApproval` in `src/app/actions/rewards.ts` to prevent BOLA/IDOR.
5. [x] **Code Fix - Backup Process Guard**: Restricted `backup-db.sh` background execution to local SQLite environments where the file exists in `src/app/actions/progression.ts`.
6. [x] **Infra Fix - Cloud Run Service Account**: Switched Cloud Run runtime service account from default Compute (`roles/editor`) to dedicated unprivileged service account `maths-tutor-sa@maths-tutor-503816.iam.gserviceaccount.com` (0 project roles).
7. [x] **Infra Fix - Enforced Database TLS**: Updated active Cloud Run service configuration and `deploy/deploy.sh` to enforce `?sslmode=require` on `DATABASE_URL`.
8. [x] **Supply Chain - Safe Dependency Fixes**: Ran `npm audit fix`, resolving 12 transitive dependency advisories.
9. [x] **Verification**: TypeScript checks pass cleanly with 0 errors (`npx tsc --noEmit`). Verified active Cloud Run revision serving traffic.
