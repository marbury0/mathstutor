# AI Prompts Health & Intent Review

This document provides a comprehensive health audit of the prompt files in [src/lib/ai/prompts/](file:///home/tim/Documents/Dev/marbury0/maths_tutor/src/lib/ai/prompts) using the principles of the **Skill Creator** framework.

---

## 1. Health Status Dashboard

| Prompt File | Core Intent | Health Status | Primary Risk / Area for Improvement |
| :--- | :--- | :--- | :--- |
| **`diagnoseError.txt`** | Misconception & student advice generation | 🟢 **Healthy** | Add a few-shot example to reinforce formatting. |
| **`generateQuestion.txt`** | Adaptive curriculum question generation | 🟡 **Moderate** | Large prompt size; complexity of multi-variable mapping. |
| **`generateWeeklyInsights.txt`** | Parent reporting & action plan generation | 🟢 **Healthy** | Handle edge cases with 0 metrics more explicitly. |
| **`getAdaptiveHint.txt`** | Scaffolded hint generation for mistakes | 🟢 **Healthy** | Ensure the "leading question" constraint is always hit. |
| **`getAlternativeExplanation.txt`** | Concept restatement with visual analogies | 🟡 **Moderate** | Lacks explicit Year Group/age context in prompt variables. |
| **`validateMath.txt`** | Mathematical answer validation (YES/NO) | 🟢 **Healthy** | Highly strict; needs continuous testing for edge cases. |

---

## 2. Prompt-by-Prompt Audit

### 📁 diagnoseError.txt
- **Intent**: Diagnose a student's mathematical misconception from their wrong answer and write friendly advice directly to them.
- **Health Analysis**:
  - **Strengths**: Strict 6-category classification prevents open-ended diagnosis. Imperative constraints forbid LaTeX and markdown wrapper blocks.
  - **Vulnerabilities**: If the wrong answer is random characters or nonsensical (e.g. typing "abc"), the model might struggle to choose a category.
  - **Suggested Improvements**:
    1. Define category `6. Concept Misunderstanding / Unrelated Input` as the default fallback for gibberish or empty submissions.
    2. Add a one-shot example of a raw JSON diagnosis response in the prompt itself to anchor formatting.

### 📁 generateQuestion.txt
- **Intent**: Produce a personalized, curriculum-aligned word problem matching the user's hobbies, pets, and target difficulty.
- **Health Analysis**:
  - **Strengths**: Strong child safety constraints (no mature/dark themes). Progressive layout ensures Y1-2 vs Y3-6 sentence complexity rules are prioritized.
  - **Vulnerabilities**: High prompt complexity. If a child has complex hobbies or multiple pets, the story integration might become convoluted or run out of tokens.
  - **Suggested Improvements**:
    1. Provide a concrete few-shot example for a Year 1 student (simple sentences) vs a Year 5 student (multi-step scenarios) to guide pedagogical tone.
    2. Add a guardrail: "Do not exceed 100 words for the word problem text."

### 📁 generateWeeklyInsights.txt
- **Intent**: Provide parent-facing progress analyses, recommendations, and child-facing encouragement.
- **Health Analysis**:
  - **Strengths**: Clean separation of parent-facing markdown components and child-facing praise notes.
  - **Vulnerabilities**: If `questionsCount` is 0 or low, the AI could generate negative analysis.
  - **Suggested Improvements**:
    1. Add an instruction: "If practice time or questions attempted are zero, focus entirely on welcoming the student back, setting simple starting goals, and keeping the analysis warm and encouraging."

### 📁 getAdaptiveHint.txt
- **Intent**: Guide the student with a scaffolding hint instead of giving the answer away.
- **Health Analysis**:
  - **Strengths**: Excellent progressive step guidelines (praise -> rule hint -> leading question).
  - **Vulnerabilities**: If the question itself is simple, the hint could inadvertently reveal the answer (e.g., "What is 1 + 1?" -> "What happens if you count 1 and then 1 more?").
  - **Suggested Improvements**:
    1. Add a negative space constraint: "NEVER use the correct answer value anywhere in the hint text, even as part of a mathematical formula or question."

### 📁 getAlternativeExplanation.txt
- **Intent**: Restate a mathematical concept using visual, physical analogies (like LEGO or pizza).
- **Health Analysis**:
  - **Strengths**: Encourages sensory and spatial learning analogies (number lines, toy cars).
  - **Vulnerabilities**: The template in the backend does not currently pass the child's `yearGroup` or `age`. The AI must infer appropriate language complexity solely from the question text.
  - **Suggested Improvements**:
    1. Update the implementation in `src/app/actions/questions.ts` or `src/lib/ai/index.ts` to pass the `yearGroup` variable into this prompt template.
    2. Suggest adding a prompt guideline: "If the child's age group is unknown, default to clear, simple vocabulary appropriate for a 7-year-old child."

### 📁 validateMath.txt
- **Intent**: Provide a strict binary validation (YES/NO) on the correctness of the generated question.
- **Health Analysis**:
  - **Strengths**: Highly constrained. Forbids explanation, punctuation, and markdown wrappers.
  - **Vulnerabilities**: Math equivalence can be subjective (e.g., is `2.50` equivalent to `2.5`? Yes, but spelling differences or currency symbols must be handled accurately).
  - **Suggested Improvements**:
    1. Add concrete validation examples:
       - Problem: "What is half of £5?" | Answer: "£2.50" | Expected: `YES`
       - Problem: "What is half of £5?" | Answer: "2.5" | Expected: `YES`
       - Problem: "What is half of £5?" | Answer: "250p" | Expected: `YES`
       - Problem: "What is half of £5?" | Answer: "3" | Expected: `NO`

---

## 3. Skill Creator Design Stress-Test

Applying the 5 core interrogations of the **Skill Creator** framework to the overall AI module design:

1. **What happens when a prompt is wrong?**
   - *Risk*: A math question with an incorrect answer is served to the child, leading to frustration and curriculum misalignment.
   - *Mitigation*: The dual-call validation loop (Generator + Validator) catches errors. If validation fails, it regenerates. We must ensure `validateMath` is extremely robust.
2. **What inputs vary?**
   - Hobbies, pets, year group, topic, and wrong answers. If these inputs contain special characters or SQL injection strings, they must not break the JSON format. The JSON parsing blocks are wrapped in try/catch fallbacks.
3. **Are external dependencies declared?**
   - The module depends on `@google/generative-ai` (`gemini-3.5-flash`). Model updates could affect prompt performance. Regular monitoring is recommended.
4. **Is the output format robust?**
   - All JSON-returning prompts (`generateQuestion`, `diagnoseError`, `generateWeeklyInsights`) have been refactored to explicitly forbid conversational text and markdown fences (like ` ```json `), reducing parsing failures.
