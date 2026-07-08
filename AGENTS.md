<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Testing Rules
- DO NOT unnecessarily run `npm test` or execute the test suite, as it rebuilds/resets the database and interferes with active local data. Only run it if explicitly requested by the user.

# GCP Free Tier Deployment Rules
- Remember that GCP Always Free VM (`e2-micro`) is only available in US regions (`us-central1`, `us-east1`, `us-west1`). 
- For deployments requiring the UK/London region (`europe-west2`) to be 100% free, do not suggest Compute Engine VMs; instead, guide the user to deploy using Cloud Run + external free-tier PostgreSQL (such as Neon or Supabase).

