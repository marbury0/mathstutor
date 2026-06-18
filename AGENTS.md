<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Testing Rules
- DO NOT unnecessarily run `npm test` or execute the test suite, as it rebuilds/resets the database and interferes with active local data. Only run it if explicitly requested by the user.
