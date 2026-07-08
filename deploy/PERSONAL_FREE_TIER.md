# Maths Tutor AI - Personal GCP Free Tier Deployment Guide

This guide describes how to deploy the **Maths Tutor AI** application on a **personal, free-tier GCP profile** (using a personal `@gmail.com` account) in the **London (`europe-west2`)** region for **£0/month**.

---

## 🏗️ Architecture Design (100% Free Tier in `europe-west2`)

Google Cloud's Always Free VM (`e2-micro`) is strictly limited to US regions. To deploy in London (`europe-west2`) completely for free, we use a serverless architecture:

*   **Google Cloud Run (Serverless)**: Cloud Run's free tier includes 2 million requests per month globally, including `europe-west2`.
*   **Identity-Aware Proxy (IAP)**: GCP's native proxy protects the application, allowing access only to specific authorized Google accounts.
*   **External Serverless PostgreSQL**: Since Cloud Run is stateless and ephemeral, we use a **100% free-tier external PostgreSQL database** (such as Neon or Supabase) to persist all student profiles, streaks, and study logs.

---

## 1. Step 1: Local Terminal Setup & GCP CLI Login

Before deploying, ensure you have the Google Cloud SDK (`gcloud` CLI) installed locally.

1. **Authenticate your Google account:**
   ```bash
   gcloud auth login
   ```
   *This opens a browser window. Log in using your personal `@gmail.com` account.*

2. **Retrieve your target Project ID:**
   ```bash
   gcloud projects list
   ```

3. **Set your active project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
   *(Replace `YOUR_PROJECT_ID` with the correct ID).*

4. **Enable the required GCP APIs:**
   ```bash
   gcloud services enable run.googleapis.com iap.googleapis.com
   ```

---

## 2. Step 2: Configure Google OAuth Consent Screen & Test Users (CRITICAL)

Because you are using a personal Gmail account, GCP does not allow you to select "Internal" for the OAuth consent screen. You must use "External" and explicitly register yourself and any family members as test users.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** ➔ **OAuth consent screen**.
3. Choose **External** and click **Create**.
4. Fill in the required fields:
   * **App Name:** `Maths Tutor AI`
   * **User support email:** Choose your Gmail address.
   * **Developer contact email:** Choose your Gmail address.
5. Click **Save and Continue** until you reach the **Test Users** screen.
6. **Under Test Users (CRITICAL):**
   * Click **+ Add Users**.
   * Enter your personal Gmail address, plus any child or partner Gmail addresses that will access the application.
   * Click **Save**.
   * *Note: If a Gmail account is not added here, IAP will block them with an authorization error.*
7. Keep the app publishing status as **Testing**. Do *not* submit it for verification.

---

## 3. Step 3: Set Up a Free Serverless Database

1. Go to [Neon.tech](https://neon.tech/) or [Supabase.com](https://supabase.com/) and create a free project.
2. Select **London (`eu-west-2`)** or the nearest European region for the database location to minimize latency.
3. Copy your connection string. Example:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"
   ```

---

## 4. Step 4: Modify Code for PostgreSQL Provider

Since Prisma defaults to SQLite in this codebase, you must tell it to use PostgreSQL:

1. Open [prisma/schema.prisma](file:///home/tim/Documents/Dev/marbury0/maths_tutor/prisma/schema.prisma) and change lines 5-7 to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Initialize the database schema and default curriculum:
   ```bash
   DATABASE_URL="your-postgresql-connection-uri" npx prisma db push
   DATABASE_URL="your-postgresql-connection-uri" npx prisma db seed
   ```
   *(Note: The database connection files `src/lib/prisma.ts` and `prisma/seed.ts` have already been updated to dynamically handle SQLite/PostgreSQL depending on the URL scheme, so no other code changes are needed).*

---

## 5. Step 5: Run the Deployment

Run the automated deployment script in the project repository:

```bash
./deploy/deploy.sh
```

Provide the required details when prompted:
* **GCP Project ID**
* **GCP Region**: Enter `europe-west2`
* **Google Email**: (to authorize via IAP)
* **Gemini API Key**
* **DATABASE_URL**: (your Neon or Supabase PostgreSQL connection string)

The script will automatically enable IAP and deploy the app to Cloud Run in London.

---

## 6. Step 6: Managing Family Access

To allow other family members (e.g., your child) to access the app:

1. Ensure their Google accounts are added to the **Test Users** list in the **OAuth consent screen** (see Step 2).
2. Grant them the IAP Web App User role using the following command:
   ```bash
   gcloud iap web add-iam-policy-binding \
     --member="user:family-member@gmail.com" \
     --role="roles/iap.httpsResourceAccessor" \
     --resource-type="cloud-run" \
     --service="maths-tutor" \
     --region="europe-west2"
   ```
3. Share the Cloud Run URL (printed at the end of the deployment script) with them. They will be prompted to log in using their Google account.
