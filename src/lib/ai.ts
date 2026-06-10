import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

/**
 * Validates the math in the generated question using a separate AI call (The Validator).
 * This ensures the answer and text actually match up.
 */
async function validateMath(question: string, reportedAnswer: string): Promise<boolean> {
  const prompt = `
    You are a Mathematical Validator. 
    Review this math problem and the reported answer:
    Problem: "${question}"
    Reported Answer: "${reportedAnswer}"
    
    Is the reported answer mathematically correct based on the text? 
    Answer ONLY with "YES" or "NO". No other text.
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text().trim().toUpperCase();
  return response.includes("YES");
}

export interface QuestionData {
  text: string;
  answer: string;
  explanation: string;
  topic: string;
  reasoning: string;
  visualHint: string; // Emojis or ASCII art to help visualize
}

export async function generateQuestion(
  topic: string,
  profile: { name: string; age: number; yearGroup: number; hobbies: string[]; pets: { name: string, type: string }[]; difficultyLevel: number },
  isTestMode = false
): Promise<QuestionData> {
  const age = profile.age;
  const petsList = profile.pets.map(p => `${p.name} the ${p.type}`).join(", ");
  
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return {
      topic,
      text: `Mock Year ${profile.yearGroup} question for ${profile.name} who likes ${profile.hobbies.join(", ")} and has pets: ${petsList}. What is 2 + 2?`,
      answer: "4",
      explanation: "Since 2 + 2 equals 4, the answer is 4.",
      reasoning: "2 + 2 = 4",
      visualHint: "🍎🍎 + 🍎🍎 = 🍎🍎🍎🍎"
    };
  }

  
  const prompt = `
    You are an expert UK Primary School Maths Tutor.
    Generate a word problem for "${topic}" (Year ${profile.yearGroup}, Age ${age}).
    Personalize for ${profile.name} (Likes: ${profile.hobbies.join(", ")}, Pets: ${petsList}).
    
    Difficulty Level: ${profile.difficultyLevel}/10 (1 = very basic, 10 = challenging for this year group).
    
    Guidelines for Accuracy:
    - For Algebra: Clearly define variables. If $b$ is the number of items, explain finding $b$ as "finding the number of items".
    - For Word Problems: Keep scenarios logical and numbers age-appropriate.
    
    Return JSON:
    - reasoning: Internal calculation steps.
    - text: The word problem.
    - answer: The numeric answer.
    - explanation: How to solve it, using precise mathematical language.
    - visualHint: A simple visual representation using emojis (e.g., 🍎🍎 + 🍎 = 🍎🍎🍎).
    - topic: Topic name.
  `;

  let attempts = 0;
  while (attempts < 3) {
    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    data.answer = String(data.answer); // Force to string to prevent client-side .trim() crashes if model outputs a number
    const questionData = data as QuestionData;

    // GUARDRAIL: Cross-validate the math before returning
    const isValid = await validateMath(questionData.text, questionData.answer);
    if (isValid) return questionData;

    attempts++;
    console.warn(`Math validation failed for ${topic}. Attempt ${attempts}/3. Regenerating...`);
  }

  throw new Error("Could not generate a mathematically valid question after 3 attempts.");
}

export async function getAdaptiveHint(
  question: string,
  wrongAnswer: string,
  correctAnswer: string,
  profileName: string,
  isTestMode = false
): Promise<string> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return `Hey ${profileName}, think about what you get when you put 2 and 2 together!`;
  }
  const prompt = `
    A child named ${profileName} answered "${wrongAnswer}" to: "${question}" (Correct: "${correctAnswer}").
    Provide a friendly hint (don't give the answer).
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Diagnoses the specific mathematical misconception from a wrong answer.
 */
export async function diagnoseError(
  question: string,
  wrongAnswer: string,
  correctAnswer: string,
  yearGroup: number,
  isTestMode = false
): Promise<{ misconception: string; advice: string }> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return {
      misconception: "Calculation error",
      advice: "Double check your simple arithmetic adding 2 and 2."
    };
  }
  const prompt = `
    A Year ${yearGroup} student gave the wrong answer "${wrongAnswer}" to this question: "${question}".
    The correct answer is "${correctAnswer}".
    
    Analyze their mistake. Are they confusing place value? Did they pick the wrong operation? Did they make a simple calculation error?
    
    Return a JSON object:
    - misconception: A short description of what they did wrong.
    - advice: A one-sentence tip to help them avoid this mistake next time.
  `;

  const result = await model.generateContent(prompt);
  const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(jsonStr);
}

export async function getAlternativeExplanation(
  question: string,
  explanation: string,
  profileName: string,
  isTestMode = false
): Promise<string> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return `Alternative: Since 2 and 2 make 4, the total is 4.`;
  }
  const prompt = `
    A child named ${profileName} did not understand this explanation:
    "${explanation}"
    
    For the question:
    "${question}"
    
    Explain it in another way that is simple, fun, and extremely easy for a child to understand. Use analogies, visuals, or simple step-by-step guidance.
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
