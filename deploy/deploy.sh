#!/bin/bash
set -e

# Ensure we run from the project root directory (one level up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=================================================="
echo "🚀 Maths Tutor AI - GCP Cloud Run Deployment Script"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud CLI (gcloud) is not installed."
    echo "Please install it from https://cloud.google.com/sdk/docs/install and try again."
    exit 1
fi

# Step 1: Gather configuration details
read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ Error: Project ID cannot be empty."
    exit 1
fi

read -p "Enter GCP Region [us-central1]: " GCP_REGION
GCP_REGION=${GCP_REGION:-us-central1}

read -p "Enter your Google Account email (to grant IAP access): " GOOGLE_EMAIL
if [ -z "$GOOGLE_EMAIL" ]; then
    echo "❌ Error: Email cannot be empty."
    exit 1
fi

read -p "Enter your Gemini API Key: " GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: Gemini API key cannot be empty."
    exit 1
fi

read -p "Enter your PostgreSQL DATABASE_URL (from Neon or Supabase): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL cannot be empty."
    exit 1
fi

echo -v "\n=================================================="
echo "⚙️ Configuring Google Cloud SDK..."
echo "=================================================="

# Set target project
gcloud config set project "$GCP_PROJECT_ID"

# Enable Cloud Run and IAP APIs
echo "Enabling required APIs (Cloud Run and Identity-Aware Proxy)..."
gcloud services enable run.googleapis.com iap.googleapis.com

echo -e "\n=================================================="
echo "🗄️ Setting up database schema and seeding..."
echo "=================================================="

# Run database push and seed locally using the provided DATABASE_URL
echo "Pushing database schema to PostgreSQL..."
DATABASE_URL="$DATABASE_URL" npx prisma db push

echo "Seeding default curriculum topics..."
DATABASE_URL="$DATABASE_URL" npx prisma db seed

# Ensure database URL enforces TLS
if [[ "$DATABASE_URL" == *"postgresql://"* && "$DATABASE_URL" != *"sslmode="* ]]; then
  if [[ "$DATABASE_URL" == *"?"* ]]; then
    DATABASE_URL="${DATABASE_URL}&sslmode=require"
  else
    DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "Enforced TLS on database URL: sslmode=require"
fi

# Ensure dedicated unprivileged service account exists for least-privilege runtime
SERVICE_ACCOUNT_NAME="maths-tutor-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &> /dev/null; then
  echo "Creating dedicated least-privilege service account ($SERVICE_ACCOUNT_NAME)..."
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="Maths Tutor Cloud Run Service Account"
fi

echo -e "\n=================================================="
echo "📦 Deploying Maths Tutor to Google Cloud Run..."
echo "=================================================="

# Deploy service with direct IAP enabled
gcloud run deploy maths-tutor \
  --source . \
  --region "$GCP_REGION" \
  --no-allow-unauthenticated \
  --iap \
  --service-account "$SERVICE_ACCOUNT_EMAIL" \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},GEMINI_API_KEY=${GEMINI_API_KEY},LLM_PROVIDER=gemini,LLM_MODEL=gemini-3.5-flash-lite,MOCK_AI=false"

echo -e "\n=================================================="
echo "🔒 Securing access via Identity-Aware Proxy (IAP)..."
echo "=================================================="

# Grant the IAP accessor role to the specified Google account
gcloud iap web add-iam-policy-binding \
  --member="user:${GOOGLE_EMAIL}" \
  --role="roles/iap.httpsResourceAccessor" \
  --resource-type="cloud-run" \
  --service="maths-tutor" \
  --region="$GCP_REGION"

echo -e "\n=================================================="
echo "🎉 Deployment successfully initiated!"
echo "=================================================="
echo "Note: If this is the first time you are enabling IAP in this project,"
echo "you may need to configure your OAuth Consent Screen in the GCP console:"
echo "👉 https://console.cloud.google.com/apis/credentials/consent"
echo "Select User Type: External, fill in the app name/emails, and click Save."
echo "=================================================="
