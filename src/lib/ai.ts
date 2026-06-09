import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
}

export async function generateQuestion(
  topic: string,
  profile: { name: string; yearGroup: number; hobbies: string[]; petNames: string[] }
): Promise<QuestionData> {
  const age = profile.yearGroup + 4;
  const prompt = `
    You are an expert UK Primary School Maths Tutor.
    Generate a word problem for "${topic}" (Year ${profile.yearGroup}, Age ${age}).
    Personalize for ${profile.name} (Likes: ${profile.hobbies.join(", ")}, Pets: ${profile.petNames.join(", ")}).
    
    Return JSON:
    - reasoning: Internal calculation steps.
    - text: The word problem.
    - answer: The numeric answer.
    - explanation: How to solve it.
    - topic: Topic name.
  `;

  let attempts = 0;
  while (attempts < 3) {
    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr) as QuestionData;

    // GUARDRAIL: Cross-validate the math before returning
    const isValid = await validateMath(data.text, data.answer);
    if (isValid) return data;

    attempts++;
    console.warn(`Math validation failed for ${topic}. Attempt ${attempts}/3. Regenerating...`);
  }

  throw new Error("Could not generate a mathematically valid question after 3 attempts.");
}

export async function getAdaptiveHint(
  question: string,
  wrongAnswer: string,
  correctAnswer: string,
  profileName: string
): Promise<string> {
  const prompt = `
    A child named ${profileName} answered "${wrongAnswer}" to: "${question}" (Correct: "${correctAnswer}").
    Provide a friendly hint (don't give the answer).
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
