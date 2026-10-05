# Maths Tutor GCP Deployment Checklist

Recommended architecture: Cloud Run in `europe-west2` + Supabase Free PostgreSQL + direct Cloud Run IAP.

## 1. Prepare the project

- [x] Confirm the app uses Gemini 3.5 Flash-Lite.
  - Expected settings:
    ```env
    LLM_PROVIDER=gemini
    LLM_MODEL=gemini-3.5-flash-lite
    ```
- [ ] Decide whether to preserve existing local SQLite data.
  - For a fresh deployment, seed a new database.
  - If preserving data, plan a SQLite-to-PostgreSQL migration first.
- [ ] Do not commit `.env` files or API keys.
- [ ] Rotate the Gemini key if it has ever been committed or shared publicly.

## 2. Create the PostgreSQL database

- [x] Create a free Supabase project.
- [x] Choose a European region, preferably London or nearby.
- [x] Copy the PostgreSQL connection string.
- [x] Keep the database under 500 MB.
- [x] Remember that free projects can pause after one week of inactivity.

## 3. Switch Prisma to PostgreSQL

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run locally:

```bash
DATABASE_URL="your-supabase-url" npx prisma db push
DATABASE_URL="your-supabase-url" npx prisma db seed
```

- [x] Confirm the schema and starter topics appear in Supabase.
- [ ] Do not run the project test suite unless specifically needed, because it resets databases.

## 4. Migrate existing local data (completed)

The local SQLite database was copied to Supabase with IDs and relationships preserved:

- 3 users
- 68 topics
- 45 sessions
- 400 question-history records
- 23 rewards
- 8 weekly insights

The reusable migration utility is `deploy/migrate-sqlite-to-postgres.mjs`.

## 5. Configure Google Cloud

- [x] Create or select a GCP project.
- [x] Attach a billing account.
- [ ] Set a budget alert, for example £1 or $1.
- [x] Install and authenticate the Google Cloud CLI:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

- [x] Enable the required APIs:

```bash
gcloud services enable run.googleapis.com iap.googleapis.com
```

## 6. Configure IAP

- [ ] Open Cloud Run in the Google Cloud Console.
- [ ] Deploy or create the service initially.
- [ ] Enable direct Identity-Aware Proxy from the service's Security settings.
- [ ] Configure the OAuth consent screen if prompted.
- [ ] Add your Google account as an authorised user.
- [ ] Add any additional family accounts as required.

## 7. Deploy the application

From the repository root:

```bash
./deploy/deploy.sh
```

Enter:

- [ ] GCP project ID
- [ ] `europe-west2`
- [ ] Google account email
- [ ] Gemini API key
- [ ] Supabase PostgreSQL URL

The deployment script sets:

```env
DATABASE_URL=postgresql://.../?sslmode=require
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.5-flash-lite
MOCK_AI=false
```

And deploys under the dedicated unprivileged service account:
`maths-tutor-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com` (0 project roles).

## 8. Verify the deployment

- [ ] Open the Cloud Run URL.
- [ ] Confirm unauthorised users are blocked.
- [ ] Confirm your Google account can sign in.
- [ ] Create or select a student profile.
- [ ] Run one complete sprint.
- [ ] Check that questions, results, sessions, streaks, and topics are saved in Supabase.
- [ ] Test a hint and an alternative explanation.
- [ ] Confirm Gemini requests appear in AI Studio.
- [ ] Confirm Cloud Run logs show no database or Prisma errors.

## 9. Ongoing safeguards

- [ ] Set a GCP budget alert.
- [ ] Monitor Gemini usage in AI Studio.
- [ ] Monitor Supabase database size and project activity.
- [ ] Keep a backup of the PostgreSQL database.
- [ ] Review Cloud Run logs occasionally.
- [ ] Keep the service at minimum practical CPU, memory, and maximum-instance settings.
