# Deploying Maths Tutor to Google Cloud Platform (GCP)

To deploy your application such that **only your Google Account can access it**, we use **Google Cloud Run (Serverless)** coupled with a serverless **PostgreSQL** database (e.g. Neon or Supabase) and secured by GCP's native **Identity-Aware Proxy (IAP)**.

This architecture runs **100% within the free tiers** of GCP and database providers (costing $0/month) and does not require managing any virtual machines.

---

## 🏗️ Architecture Design

```mermaid
graph TD
    User([User's Browser]) -->|Google Account Login| IAP[Identity-Aware Proxy]
    IAP -->|Authorized Request| CloudRun[Google Cloud Run]
    CloudRun -->|Next.js App Server| NextJS[Next.js Application]
    NextJS -->|PostgreSQL Protocol| Postgres[(External Serverless Postgres)]
    NextJS -->|REST API| Gemini[Google Gemini API]
```

---

## ⚡ Deployment in 5 Minutes (Automated)

We have created an automated deployment script `deploy.sh` in the `deploy/` directory. To deploy, simply run:

```bash
./deploy/deploy.sh
```

The script will prompt you for:
1. **GCP Project ID**: The ID of your Google Cloud project.
2. **GCP Region**: Default is `us-central1`.
3. **Google Email**: Your Google account email to authorize for access.
4. **Gemini API Key**: Your Google Gemini API Key.
5. **DATABASE_URL**: The PostgreSQL connection string.

It will handle the following steps:
1. Enable `run.googleapis.com` (Cloud Run) and `iap.googleapis.com` (Identity-Aware Proxy) APIs.
2. Sync the database schema and seed the initial primary school curriculum via Prisma.
3. Build the Next.js app inside a Docker container using the optimized `Dockerfile`.
4. Deploy the service to Google Cloud Run with direct IAP enabled.
5. Authorize your Google email as an IAP HTTPS resource accessor.

---

## ⚙️ Manual Configuration Steps

If you prefer to configure everything step-by-step or need to update resources manually, follow these instructions:

### Step 1: Database Setup
1. Create a free PostgreSQL database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Copy the connection URI:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"
   ```

### Step 2: Configure GCP Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your project.
3. Configure the **OAuth Consent Screen** (Required for IAP first-time setup):
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - Choose User Type: **External** (if using a standard Gmail account) or **Internal** (if on a Google Workspace).
   - Enter your App Name (e.g., `Maths Tutor`) and Support Email.
   - Save and continue. You do not need to publish the app.

### Step 3: Run Schema Migrations
Before deploying the server, push the database schema to the PostgreSQL instance from your local terminal:
```bash
DATABASE_URL="your-postgresql-url" npx prisma db push
DATABASE_URL="your-postgresql-url" npx prisma db seed
```

### Step 4: Deploy to Cloud Run
Deploy the application with the `--iap` flag:
```bash
gcloud run deploy maths-tutor \
  --source . \
  --region us-central1 \
  --no-allow-unauthenticated \
  --iap \
  --set-env-vars="DATABASE_URL=your-postgresql-url,GEMINI_API_KEY=your-gemini-key,LLM_PROVIDER=gemini,LLM_MODEL=gemini-3.5-flash-lite,MOCK_AI=false"
```
*Note: The `--no-allow-unauthenticated` flag locks down the URL, while `--iap` activates the Google account login screen.*

### Step 5: Grant User Access
Grant the **IAP-secured Web App User** role to your specific Google Account email:
```bash
gcloud iap web add-iam-policy-binding \
  --member="user:your-email@gmail.com" \
  --role="roles/iap.httpsResourceAccessor" \
  --resource-type="cloud-run" \
  --service="maths-tutor" \
  --region="us-central1"
```
Now, only your Google Account can load the application. Any other account attempting to view it will be blocked by the Google Cloud login gate.
