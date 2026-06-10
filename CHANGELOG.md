# Changelog

All notable changes to this project will be documented in this file.

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
