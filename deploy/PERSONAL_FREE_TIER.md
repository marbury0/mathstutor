# Maths Tutor AI - Personal GCP Deployment Guide

This guide describes how to deploy the **Maths Tutor AI** application on a **personal, free-tier GCP profile** (using a personal `@gmail.com` account) in the **London (`europe-west2`)** region, while keeping costs at **$0/month**.

---

## ⚠️ CRITICAL: Keeping it Free in `europe-west2`

Google Cloud's **Always Free VM Tier** (which covers one `e2-micro` instance) is strictly limited to three US regions: `us-central1`, `us-east1`, and `us-west1`. 
* **If you deploy a VM (Compute Engine) in `europe-west2`, you will be billed ~£8-9/month** (or it will consume your temporary $300 signup credits).
* **If you must deploy in `europe-west2` and want it 100% free forever, you MUST use Option B (Google Cloud Run + Serverless PostgreSQL)**. Cloud Run's free tier (2 million requests/month) is active globally, including in `europe-west2`.

---

## 🏗️ Comparison: Option A vs. Option B

| Feature | Option A (GCP VM + SQLite) | Option B (Cloud Run + Postgres) |
| :--- | :--- | :--- |
| **GCP Region** | **US Regions only** (for $0 free tier) | **`europe-west2` (London)** (or any region, $0 free tier) |
| **GCP Resources** | `e2-micro` Compute Instance | Cloud Run (Free tier) + IAP |
| **Database** | Local SQLite (Stored on persistent VM disk) | PostgreSQL (External Neon/Supabase Free Tier) |
| **Code Changes** | None (Runs out-of-the-box) | Change Prisma provider to `postgresql` |
| **Securing Access** | Restricted IP Firewall or Caddy Basic Auth | Google Account Login (IAP) |
| **Cost in `europe-west2`**| **~£8-9/month** (Not Free) | **£0/month (100% Free)** |

---

## ⚡ Option B: Google Cloud Run + Serverless PostgreSQL (London Region, 100% Free)

This option uses Google Cloud Run in `europe-west2` combined with a **100% free-tier external PostgreSQL database** (which has a $0/month free tier on Neon or Supabase) to persist SQLite-like data.

### Step 1: Set Up your Free PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech/) or [Supabase.com](https://supabase.com/) and create a free project.
2. When creating the database, choose the **London (`eu-west-2`)** or nearest European region to minimize latency.
3. Copy your connection string. Example:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Step 2: Configure OAuth Consent Screen & Test Users (For IAP Login)
Because the app will be exposed publicly, we use GCP's Identity-Aware Proxy (IAP) to prompt for Google Login.
1. In the Google Cloud Console, navigate to **APIs & Services** ➔ **OAuth consent screen**.
2. Select **External** and fill in the app name (`Maths Tutor AI`) and contact email.
3. Under **Test Users**, add your personal `@gmail.com` address and the Google accounts of any family members who need access.
4. Keep the publishing status as **Testing**.

### Step 3: Modify Code for PostgreSQL Provider
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
   DATABASE_URL="your-postgresql-url" npx prisma db push
   DATABASE_URL="your-postgresql-url" npx prisma db seed
   ```
   *(Note: The database connection files `src/lib/prisma.ts` and `prisma/seed.ts` have already been updated to dynamically handle SQLite/PostgreSQL depending on the URL scheme, so no other code changes are needed).*

### Step 4: Deploy Using `deploy.sh`
Run the included deployment script:
```bash
./deploy/deploy.sh
```
Provide the required details when prompted:
* **GCP Project ID**
* **GCP Region**: Enter `europe-west2` (London)
* **Google Email**: (to authorize via IAP)
* **Gemini API Key**
* **DATABASE_URL**: (your Neon or Supabase PostgreSQL connection string)

The script will automatically enable IAP and deploy the app to Cloud Run in London. Only the Google Accounts you authorize will be able to log in and access the application.

---

## 🛠️ Option A: Compute Engine VM (e2-micro) + Local SQLite (US Region, 100% Free)

If you are willing to host the application in a US region (e.g. `us-central1-a`) to keep it **100% free** while using SQLite (with zero code modifications), follow this route.

### Step 1: Local Terminal Setup & VM Provisioning
1. **Authenticate and set up your project:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Enable Compute Engine API:**
   ```bash
   gcloud services enable compute.googleapis.com
   ```
3. **Provision the Free Tier VM (Must be in a US Region):**
   ```bash
   gcloud compute instances create mathstutor-personal \
       --zone=us-central1-a \
       --machine-type=e2-micro \
       --image-family=ubuntu-2204-lts \
       --image-project=ubuntu-os-cloud \
       --boot-disk-size=30GB \
       --boot-disk-type=pd-standard \
       --tags=http-server,https-server
   ```

### Step 2: Restrict Access via Firewall
Since the app doesn't have built-in login pages, you should restrict access to your home IP address:
1. **Get your current public IP:** run `curl ifconfig.me` or visit [whatsmyip.org](https://www.whatsmyip.org).
2. **Create a firewall rule restricting access to your IP:**
   ```bash
   gcloud compute firewall-rules create allow-mathstutor-my-ip-only \
       --direction=INGRESS \
       --priority=900 \
       --action=ALLOW \
       --rules=tcp:80,tcp:443 \
       --source-ranges=YOUR_IP_ADDRESS/32 \
       --target-tags=mathstutor-restricted
   ```
3. **Add the tag to your VM and remove the public tags:**
   ```bash
   gcloud compute instances add-tags mathstutor-personal --zone=us-central1-a --tags=mathstutor-restricted
   gcloud compute instances remove-tags mathstutor-personal --zone=us-central1-a --tags=http-server,https-server
   ```

### Step 3: Server Setup & Run App
1. **SSH into your VM:**
   ```bash
   gcloud compute ssh mathstutor-personal --zone=us-central1-a
   ```
2. **Install Node.js & Git on the VM:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm git
   ```
3. **Clone the code & build:**
   ```bash
   git clone <your-repository-url> /home/ubuntu/maths_tutor
   cd /home/ubuntu/maths_tutor
   npm install
   ```
4. **Set up your Environment Variables:**
   ```bash
   nano /home/ubuntu/maths_tutor/.env
   ```
   Add your API keys and configuration:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   DATABASE_URL="file:./data/maths_tutor.db"
   MOCK_AI=false
   PORT=3000
   ```
5. **Initialize SQLite database:**
   ```bash
   npx prisma db push
   npm run seed
   ```
6. **Build and Run (using PM2 to keep it running in the background):**
   ```bash
   sudo npm install -g pm2
   npm run build
   pm2 start npm --name "maths-tutor" -- run start
   pm2 save
   pm2 startup
   ```
7. **(Optional) Configure Caddy for Reverse Proxy:**
   To serve the app cleanly over port 80/443 without appending `:3000` to the IP:
   ```bash
   sudo apt install -y caddy
   ```
   Edit `/etc/caddy/Caddyfile` and replace the default config with:
   ```caddy
   :80 {
       reverse_proxy localhost:3000
   }
   ```
   Restart Caddy: `sudo systemctl restart caddy`.
   You can now access your app at `http://<YOUR_VM_PUBLIC_IP>`.
