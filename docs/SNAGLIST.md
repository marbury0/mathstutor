# Snag List 🚩

Small fixes, UI polish, and technical "snags" that need immediate attention.

## UI/UX Polish
- [x] **Onboarding Contrast**: Ensure all text in the onboarding steps is consistent (some use `text-black`, others use `text-gray-700`).
- [x] **Mobile Grid**: Test the 3x2 grid of "Year Group" buttons on small screens (iPhone SE size) to ensure no overflow.
- [x] **Button States**: Add a "hover" scale effect to the "Next" buttons in onboarding to match the "Year Group" button feel.
- [x] **Sprint Loading**: The "🤔" emoji bounce animation is great, but adding a "Generating your personalized challenge..." text would manage expectations better.

## Technical Refinement
- [x] **Single User Assumption**: Code currently uses `prisma.user.findFirst()`. This will break if a second person uses the app. Needs to be tied to a session/ID.
- [x] **Validator Hardening**: The `validateMath` function looks for "YES" in a string. It should be hardened to handle "Yes.", "YES!", or "yes".
- [x] **AI Version Consistency**: Standardize on one model version (e.g., `gemini-2.0-flash`) across all functions in `ai.ts`.
- [x] **Empty State**: What happens if the `Topic` table is empty? (Currently `fetchNextQuestion` might fail or return undefined).

## Bug Fixes
- [x] **Sprint Reload**: The "Back to Dashboard" button uses `window.location.reload()`. It should ideally use a proper state transition or `router.push('/')`.
- [x] **Answer Normalization**: Currently handles whitespace, but should also handle cases like "£5" vs "5" or "5.0" vs "5".
- [x] **Hint Persona**: Ensure the `getAdaptiveHint` function always knows the child's `yearGroup` so it doesn't use language that is too complex.

## Content/Educational
- [x] **Topic Seeding**: The `seedTopics` action needs more variety for Year 1/2 (e.g., "Number Bonds", "Shape Recognition") vs Year 5/6.
- [ ] **Reasoning Visibility**: Decide if parents should be able to see the AI's "Internal Reasoning" in the Dashboard to check for AI logic errors.
