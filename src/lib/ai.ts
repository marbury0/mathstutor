import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getPrompt } from "./promptLoader";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
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
  const prompt = getPrompt("validateMath.txt", {
    question,
    reportedAnswer,
  });

  const result = await model.generateContent(prompt);
  const response = result.response.text().trim().toLowerCase().replace(/[^a-z]/g, "");
  if (response === "yes" || response.startsWith("yes")) {
    return true;
  }
  if (response === "no" || response.startsWith("no")) {
    return false;
  }
  const rawResponse = result.response.text().toUpperCase();
  return rawResponse.includes("YES") && !rawResponse.includes("NOT CORRECT") && !rawResponse.includes("INCORRECT") && !/\bNO\b/.test(rawResponse);
}

export interface QuestionData {
  text: string;
  answer: string;
  acceptableAnswers: string[]; // List of alternative correct answers
  explanation: string;
  topic: string;
  reasoning: string;
  visualHint: string; // Emojis or ASCII art to help visualize
}

export async function generateQuestion(
  topic: string,
  profile: { name: string; age: number; yearGroup: number; hobbies: string[]; pets: { name: string, type: string }[]; difficultyLevel: number; tutorName?: string },
  isTestMode = false
): Promise<QuestionData> {
  const age = profile.age;
  const petsList = profile.pets.map(p => `${p.name} the ${p.type}`).join(", ");
  const tutorName = profile.tutorName || "Maths Bot";

  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return {
      topic,
      text: `Mock Year ${profile.yearGroup} question for ${profile.name} who likes ${profile.hobbies.join(", ")} and has pets: ${petsList}. What is 2 + 2?`,
      answer: "4",
      acceptableAnswers: ["4", "four"],
      explanation: `Since 2 + 2 equals 4, the answer is 4, explains ${tutorName}.`,
      reasoning: "2 + 2 = 4",
      visualHint: "🍎🍎 + 🍎🍎 = ?"
    };
  }

  const prompt = getPrompt("generateQuestion.txt", {
    tutorName,
    topic,
    yearGroup: profile.yearGroup,
    age,
    name: profile.name,
    hobbies: profile.hobbies.join(", "),
    petsList,
    difficultyLevel: profile.difficultyLevel,
  });

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
    if (Array.isArray(questionData.acceptableAnswers)) {
      questionData.acceptableAnswers = questionData.acceptableAnswers.map(ans => cleanMathText(String(ans)));
    } else {
      questionData.acceptableAnswers = [];
    }

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
  tutorName = 'Maths Bot',
  isTestMode = false
): Promise<string> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return `Hey ${profileName}, ${tutorName} thinks you should think about what you get when you put 2 and 2 together!`;
  }
  const prompt = getPrompt("getAdaptiveHint.txt", {
    tutorName,
    yearGroup,
    profileName,
    wrongAnswer,
    question,
    correctAnswer,
  });
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
  const prompt = getPrompt("diagnoseError.txt", {
    yearGroup,
    wrongAnswer,
    question,
    correctAnswer,
  });

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
  tutorName = 'Maths Bot',
  isTestMode = false
): Promise<string> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return `Alternative: Since 2 and 2 make 4, the total is 4, explains ${tutorName}.`;
  }
  const prompt = getPrompt("getAlternativeExplanation.txt", {
    tutorName,
    profileName,
    explanation,
    question,
  });
  const result = await model.generateContent(prompt);
  return cleanMathText(result.response.text());
}

export interface WeeklyInsightsData {
  aiAnalysis: string;
  recsPlan: string;
  encouragement: string;
}

export async function generateWeeklyInsights(
  profile: { name: string; age: number; yearGroup: number; tutorName: string },
  metrics: { questionsCount: number; accuracy: number; pointsEarned: number; studyTime: number },
  questionsList: { topic: string; isCorrect: boolean; questionText: string; userAnswer: string; correctAnswer: string; misconception: string | null; advice: string | null }[],
  isTestMode = false
): Promise<WeeklyInsightsData> {
  if (isTestMode || process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
    return {
      aiAnalysis: `### Weekly Progress Summary for ${profile.name}\n\nThis week, ${profile.name} completed **${metrics.questionsCount} questions** across their math sprints with an overall accuracy of **${Math.round(metrics.accuracy)}%**.\n\nThey showed great dedication by practicing for **${Math.round(metrics.studyTime / 60)} minutes** and earning **${metrics.pointsEarned} points**.\n\nThey are doing fantastic!`,
      recsPlan: `- **Consistent Practice**: Keep up the daily sprints to build fluency.\n- **Focus on Strengths**: Celebrate the topics where accuracy was high.`,
      encouragement: `Great job this week, ${profile.name}! You've worked so hard on your math questions. Keep up the amazing work with ${profile.tutorName}! 🌟`
    };
  }

  // Group questions by topic and count correctness/misconceptions
  const topicSummary = questionsList.reduce((acc, q) => {
    if (!acc[q.topic]) {
      acc[q.topic] = { total: 0, correct: 0, misconceptions: [] as string[] };
    }
    acc[q.topic].total++;
    if (q.isCorrect) {
      acc[q.topic].correct++;
    } else if (q.misconception) {
      acc[q.topic].misconceptions.push(q.misconception);
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number; misconceptions: string[] }>);

  const topicSummaryText = Object.entries(topicSummary)
    .map(([topic, stats]) => {
      const acc = Math.round((stats.correct / stats.total) * 100);
      return `- **${topic}**: ${stats.correct}/${stats.total} correct (${acc}% accuracy). ${stats.misconceptions.length > 0
          ? `Struggles/Misconceptions: ${Array.from(new Set(stats.misconceptions)).join(", ")}`
          : "No major misconceptions."
        }`;
    })
    .join("\n");

  const prompt = getPrompt("generateWeeklyInsights.txt", {
    name: profile.name,
    age: profile.age,
    yearGroup: profile.yearGroup,
    tutorName: profile.tutorName,
    questionsCount: metrics.questionsCount,
    accuracy: Math.round(metrics.accuracy),
    pointsEarned: metrics.pointsEarned,
    studyTime: Math.round(metrics.studyTime / 60),
    topicSummaryText,
  });

  try {
    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    return {
      aiAnalysis: cleanMathText(data.aiAnalysis),
      recsPlan: cleanMathText(data.recsPlan),
      encouragement: cleanMathText(data.encouragement),
    };
  } catch (error) {
    console.error("Error generating weekly insights from AI:", error);
    return {
      aiAnalysis: `### Weekly Progress Summary for ${profile.name}\n\nThis week, ${profile.name} completed **${metrics.questionsCount} questions** across their math sprints with an overall accuracy of **${Math.round(metrics.accuracy)}%**.\n\nThey showed great dedication by practicing for **${Math.round(metrics.studyTime / 60)} minutes** and earning **${metrics.pointsEarned} points**.\n\nWe recommend continuing to practice active topics to build confidence!`,
      recsPlan: `- **Consistent Practice**: Keep up the daily sprints to build fluency.\n- **Focus on Strengths**: Celebrate the topics where accuracy was high.`,
      encouragement: `Fantastic work this week, ${profile.name}! You've worked so hard on your math questions. Keep shining and having fun in your next sprint with ${profile.tutorName}! 🌟`
    };
  }
}

