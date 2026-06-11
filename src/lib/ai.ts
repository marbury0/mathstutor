import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ]
});

/**
 * Cleans LaTeX mathematics notation from text and replaces them with standard readable symbols.
 */
export function cleanMathText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\(approx|times|div|pm|mp|le|ge|ne|degree|circ|cdot|theta|pi|Delta|alpha|beta|gamma)/g, (match, p1) => {
      switch (p1) {
        case 'times': return '×';
        case 'div': return '÷';
        case 'approx': return '≈';
        case 'pm': return '±';
        case 'le': return '≤';
        case 'ge': return '≥';
        case 'ne': return '≠';
        case 'cdot': return '·';
        case 'theta': return 'θ';
        case 'pi': return 'π';
        case 'Delta': return 'Δ';
        case 'alpha': return 'α';
        case 'beta': return 'β';
        case 'gamma': return 'γ';
        case 'circ':
        case 'degree': return '°';
        default: return match;
      }
    })
    .replace(/\^\\circ/g, '°')
    .replace(/\^circ/g, '°')
    .replace(/\^\\degree/g, '°')
    .replace(/\^degree/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\{(\d+)\}/g, '$1')
    .replace(/\$/g, ''); // Strip math mode dollar signs
}

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
  if (response.startsWith("YES") || response === "YES") {
    return true;
  }
  if (response.startsWith("NO") || response === "NO") {
    return false;
  }
  return response.includes("YES") && !response.includes("NOT CORRECT") && !response.includes("INCORRECT");
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
      visualHint: "🍎🍎 + 🍎🍎 = ?"
    };
  }

  
  const prompt = `
    You are an expert UK Primary School Maths Tutor.
    Generate a word problem for "${topic}" (Year ${profile.yearGroup}, Age ${age}).
    Personalize for ${profile.name} (Likes: ${profile.hobbies.join(", ")}, Pets: ${petsList}).
    
    Difficulty Level: ${profile.difficultyLevel}/10 (1 = very basic, 10 = challenging for this year group).
    
    Guidelines for Accuracy:
    - For Algebra: Clearly define variables. If b is the number of items, explain finding b as "finding the number of items" (do not use LaTeX $b$).
    - For Word Problems: Keep scenarios logical and numbers age-appropriate. NEVER use LaTeX notation (like $ or \circ). Use standard characters (like ° for degrees, x or letters directly for variables).
    
    Child Safety:
    - The word problem, name context, and explanation must be 100% appropriate and safe for primary school children (Ages 5-11).
    - NEVER generate scenarios involving violence, fear, weapons, danger, injury, illness, dark themes, or mature topics. Keep the tone warm, positive, and encouraging.
    
    Return JSON:
    - reasoning: Internal calculation steps.
    - text: The word problem.
    - answer: The numeric answer.
    - explanation: How to solve it, using precise mathematical language.
    - visualHint: A simple visual representation of the problem setup using emojis to help the child visualize the objects and quantities (e.g. 🍎🍎 + 🍎 = ?). NEVER include the final answer, result, or completed equation. If there is a missing number, represent it with a question mark (?).
    - topic: Topic name.
  `;

  let attempts = 0;
  while (attempts < 3) {
    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    data.answer = String(data.answer); // Force to string to prevent client-side .trim() crashes if model outputs a number
    
    const questionData = data as QuestionData;
    questionData.text = cleanMathText(questionData.text);
    questionData.explanation = cleanMathText(questionData.explanation);
    questionData.visualHint = cleanMathText(questionData.visualHint);
    questionData.reasoning = cleanMathText(questionData.reasoning);

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
  yearGroup: number,
  isTestMode = false
): Promise<string> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return `Hey ${profileName}, think about what you get when you put 2 and 2 together!`;
  }
  const prompt = `
    A Year ${yearGroup} student named ${profileName} answered "${wrongAnswer}" to: "${question}" (Correct: "${correctAnswer}").
    Provide a friendly, age-appropriate hint (don't give the answer) suitable for a Year ${yearGroup} student.
    NEVER use LaTeX notation (like $ or \circ). Use standard characters (like ° for degrees).
    Child Safety: Ensure the hint tone and language are 100% child-safe, positive, encouraging, and appropriate for primary school kids.
  `;
  const result = await model.generateContent(prompt);
  return cleanMathText(result.response.text());
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
    
    Child Safety: The output must remain entirely child-appropriate, encouraging, and supportive.
    
    Return a JSON object:
    - misconception: A short description of what they did wrong.
    - advice: A one-sentence tip to help them avoid this mistake next time.
  `;

  const result = await model.generateContent(prompt);
  const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
  const diagnosis = JSON.parse(jsonStr);
  return {
    misconception: cleanMathText(diagnosis.misconception),
    advice: cleanMathText(diagnosis.advice)
  };
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
    NEVER use LaTeX notation (like $ or \circ). Use standard characters (like ° for degrees).
    Child Safety: The explanation must be completely safe, encouraging, and appropriate for primary school children.
  `;
  const result = await model.generateContent(prompt);
  return cleanMathText(result.response.text());
}
