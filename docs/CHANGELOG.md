# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-02

### Added
- **GCP Cloud Run Deployment**: Added container support (`Dockerfile`, `.dockerignore`) and automated deployment script (`deploy.sh`) to host the application serverlessly.
- **Identity-Aware Proxy (IAP) Security**: Integrated native GCP IAP to lock down deployment access exclusively to authorized Google Accounts.
- **Sprint Resume Capability**: Enabled pupils to resume active sprints with a 72-hour inactivity TTL, supported by a frontend countdown timer.
- **Parent Advice Guide & Resources**: Introduced a parent resources section including strategies for de-escalating frustration and resistance.
- **Reward Management Polish**: Implemented editing, cloning, and date-filtering for rewards, and segregated claimed and archived rewards.
- **Prompt Templatization**: Extracted LLM prompt templates into dedicated files for easier iteration and cleaner source code.

### Changed
- **Next.js Standalone Build**: Configured Next.js to build in `standalone` mode to reduce Docker container footprint.
- **Prisma Build Hook**: Updated package build scripts to automatically generate Prisma client code before building.

### Fixed
- Cleaned up Prisma initialization and seeding code to eliminate explicit `any` typings.

## [1.1.0] - 2026-06-09

### Added
- **Gemini 3.5 Flash Integration**: Upgraded to the latest 2026 Gemini models for faster and more accurate tutoring.
- **Curriculum-Specific Seeding**: Topics are now dynamically seeded based on the UK National Curriculum for the selected Year Group (1-6).
- **Adaptive Difficulty Scaling**: Individual topic difficulty (1-10) now scales up after consecutive correct answers and drops immediately on mistakes.
- **Error Misconception Diagnosis**: AI now analyzes wrong answers to identify specific misconceptions (e.g., place value confusion) and provide targeted advice.
- **Visual Hints**: AI-generated emoji-based visual aids are now included with every question to help children visualize the math.
- **Avatar Support**: Added database support for companion avatars.
- **Automated Quality Auditing**: New testing suite where a "Lead Teacher" AI audits generated questions for age-appropriateness and curriculum alignment.

### Fixed
- Fixed 404 errors by standardizing on the 2026 stable model suite.
- Hardened math validation to prevent conceptual errors in complex explanations.

## [1.0.0] - 2026-06-09
...
