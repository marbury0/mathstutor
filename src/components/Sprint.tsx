'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint, fetchAlternativeExplanation } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';
import { Pause, Play, LogOut, Trophy, HelpCircle, ArrowRight, RotateCcw, Save, Trash2, CheckCircle2 } from 'lucide-react';

interface Question {
  text: string;
  answer: string;
  acceptableAnswers?: string[];
  explanation: string;
  topic: string;
  visualHint: string;
}

type SupportLevel = 'independent' | 'hint' | 'parent_help' | 'parent_answered';

interface PendingResult {
  isCorrect: boolean;
  timeTaken: number;
  userAnswer: string;
  correctAnswer: string;
}

export function normalizeAnswer(ans: string): string {
  if (!ans) return "";
  
  // 1. Remove currency symbols and trim whitespace
  let cleaned = ans.replace(/[£$€¥]/g, "").trim();
  cleaned = cleaned.replace(/\s+/g, "");
  
  // 2. Standardize units and lowercase
  cleaned = cleaned.toLowerCase()
    .replace(/degrees?|deg/g, "°")
    .replace(/squarecentimet(er|re)s?|cm\^?2/g, "cm²")
    .replace(/squaremet(er|re)s?|m\^?2/g, "m²")
    .replace(/cubiccentimet(er|re)s?|cm\^?3/g, "cm³")
    .replace(/cubicmet(er|re)s?|m\^?3/g, "m³")
    .replace(/centimet(er|re)s?|cms/g, "cm")
    .replace(/millimet(er|re)s?|mms/g, "mm")
    .replace(/kilomet(er|re)s?|kms/g, "km")
    .replace(/met(er|re)s?|ms/g, "m")
    .replace(/kilograms?|kgs/g, "kg")
    .replace(/grams?|gs/g, "g")
    .replace(/millilit(er|re)s?|mls/g, "ml")
    .replace(/lit(er|re)s?/g, "l")
    .replace(/percent(age)?/g, "%")
    .replace(/pence|penn(y|ies)/g, "p");

  // 3. Normalize the numeric prefix if present (e.g., "5.0cm" -> "5cm", "12.50" -> "12.5")
  const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  if (match) {
    const numPart = Number(match[1]);
    const unitPart = match[2];
    if (!isNaN(numPart)) {
      return String(numPart) + unitPart;
    }
  }

  return cleaned;
}

export default function Sprint({
  userId,
  onFinish,
  isTestMode = false,
  tutorName = 'Maths Bot',
  sprintDuration = 900
}: {
  userId: string;
  onFinish: (score: number) => void;
  isTestMode?: boolean;
  tutorName?: string;
  sprintDuration?: number;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState(false);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [alternativeExplanation, setAlternativeExplanation] = useState<string | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const isSessionEnding = useRef(false);

  const totalQuestions = isTestMode ? 2 : (() => {
    // Check if the saved value is in seconds (e.g. 300, 600, 900) or directly a question count
    if (sprintDuration >= 60) {
      const mins = Math.round(sprintDuration / 60);
      if (mins <= 3) return 3;
      if (mins <= 5) return 5;
      if (mins <= 10) return 10;
      if (mins <= 15) return 15;
      if (mins <= 20) return 20;
      if (mins <= 25) return 25;
      return 30;
    }
    return sprintDuration || 15;
  })();
  
  const questionStartTime = useRef<number>(0);
  const isFetching = useRef(false);
  const prefetchedQuestionRef = useRef<Question | null>(null);
  const prefetchPromiseRef = useRef<Promise<Question | null> | null>(null);
  const prefetchVersionRef = useRef(0);

  const invalidatePrefetch = useCallback(() => {
    prefetchVersionRef.current += 1;
    prefetchedQuestionRef.current = null;
    prefetchPromiseRef.current = null;
  }, []);

  const prefetchNextQuestion = useCallback(() => {
    if (prefetchedQuestionRef.current || prefetchPromiseRef.current) return;
    const requestVersion = prefetchVersionRef.current;
    const promise = fetchNextQuestion()
      .then((q) => {
        if (requestVersion !== prefetchVersionRef.current) return null;
        prefetchedQuestionRef.current = q;
        prefetchPromiseRef.current = null;
        return q;
      })
      .catch((err) => {
        console.error("Prefetch next question failed:", err);
        prefetchPromiseRef.current = null;
        return null;
      });
    prefetchPromiseRef.current = promise;
  }, []);

  const loadNextQuestion = useCallback(async (preferredTopicName?: string, excludedTopicName?: string) => {
    setHint(null);
    setAttempts(0);
    setShowFullExplanation(false);
    setAlternativeExplanation(null);
    setIsExplainingLoading(false);
    setIsHintLoading(false);
    setUserAnswer('');

    if (preferredTopicName || excludedTopicName) {
      invalidatePrefetch();
      if (isFetching.current) return;
      isFetching.current = true;
      setIsLoading(true);
      try {
        const q = await fetchNextQuestion(preferredTopicName, excludedTopicName);
        setCurrentQuestion(q);
        questionStartTime.current = Date.now();
        prefetchNextQuestion();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
      return;
    }

    // 1. If prefetched question is already in memory, display instantly!
    if (prefetchedQuestionRef.current) {
      const nextQ = prefetchedQuestionRef.current;
      prefetchedQuestionRef.current = null;
      setCurrentQuestion(nextQ);
      questionStartTime.current = Date.now();
      setIsLoading(false);
      prefetchNextQuestion();
      return;
    }

    // 2. If a prefetch is in flight, await it
    if (prefetchPromiseRef.current) {
      setIsLoading(true);
      try {
        const nextQ = await prefetchPromiseRef.current;
        if (nextQ) {
          prefetchedQuestionRef.current = null;
          setCurrentQuestion(nextQ);
          questionStartTime.current = Date.now();
          setIsLoading(false);
          prefetchNextQuestion();
          return;
        }
      } catch (err) {
        console.error("Error awaiting prefetched question:", err);
      }
    }

    // 3. Fallback: on-demand fetch
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    try {
      const q = await fetchNextQuestion();
      setCurrentQuestion(q);
      questionStartTime.current = Date.now();
      prefetchNextQuestion();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [invalidatePrefetch, prefetchNextQuestion]);

  const practiseSameTopic = async () => {
    if (currentQuestion) await loadNextQuestion(currentQuestion.topic);
  };

  const practiseDifferentTopic = async () => {
    if (currentQuestion) await loadNextQuestion(undefined, currentQuestion.topic);
  };

  const retryCurrentQuestion = () => {
    setHint(null);
    setAttempts(0);
    setShowFullExplanation(false);
    setAlternativeExplanation(null);
    setUserAnswer('');
    questionStartTime.current = Date.now();
  };

  const handleGetAlternativeExplanation = async () => {
    if (!currentQuestion || isExplainingLoading) return;
    setIsExplainingLoading(true);
    try {
      const alt = await fetchAlternativeExplanation(currentQuestion.text, currentQuestion.explanation);
      setAlternativeExplanation(alt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplainingLoading(false);
    }
  };

  const handleNextQuestion = useCallback(async (newScore: number) => {
    const nextCount = questionsCompleted + 1;
    setQuestionsCompleted(nextCount);
    
    if (nextCount >= totalQuestions) {
      isSessionEnding.current = true;
      setIsFinished(true);
      localStorage.removeItem(`maths_tutor_sprint_${userId}`);
      await finishSession(newScore, elapsedTime);
    } else {
      await loadNextQuestion();
    }
  }, [questionsCompleted, totalQuestions, elapsedTime, loadNextQuestion, userId]);

  const recordSupportAndContinue = async (supportLevel: SupportLevel) => {
    if (!currentQuestion || !pendingResult) return;

    const result = pendingResult;
    setPendingResult(null);
    setIsCorrectFeedback(false);

    logQuestionResult(
      currentQuestion.topic,
      result.isCorrect,
      result.timeTaken,
      currentQuestion.text,
      result.userAnswer,
      result.correctAnswer,
      supportLevel
    ).catch((err) => console.error("Error logging question result:", err));

    if (result.isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      await handleNextQuestion(newScore);
    }
  };

  const handleExitClick = () => {
    setIsPaused(true);
    setShowExitModal(true);
  };

  const handleSaveAndExit = async () => {
    if (isLoading) return;
    isSessionEnding.current = true;
    setIsLoading(true);
    try {
      await finishSession(score, elapsedTime);
      localStorage.removeItem(`maths_tutor_sprint_${userId}`);
      onFinish(score);
    } catch (e) {
      console.error(e);
      isSessionEnding.current = false;
      setIsLoading(false);
    }
  };

  const handleDiscardAndExit = () => {
    isSessionEnding.current = true;
    localStorage.removeItem(`maths_tutor_sprint_${userId}`);
    onFinish(score);
  };

  const handlePauseAndExit = () => {
    isSessionEnding.current = true;
    onFinish(score);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setIsPaused(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      const storageKey = `maths_tutor_sprint_${userId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const EXPIRATION_MS = 72 * 60 * 60 * 1000; // 72 hours
          if (parsed.timestamp && Date.now() - parsed.timestamp > EXPIRATION_MS) {
            localStorage.removeItem(storageKey);
            loadNextQuestion();
          } else {
            setElapsedTime(parsed.elapsedTime ?? 0);
            setQuestionsCompleted(parsed.questionsCompleted ?? 0);
            setScore(parsed.score ?? 0);
            setPendingResult(parsed.pendingResult ?? null);
            setCurrentQuestion(parsed.currentQuestion ?? null);
            setAttempts(parsed.attempts ?? 0);
            setHint(parsed.hint ?? null);
            setShowFullExplanation(parsed.showFullExplanation ?? false);
            setAlternativeExplanation(parsed.alternativeExplanation ?? null);
            setIsPaused(parsed.isPaused ?? false);
            setIsLoading(false);
            questionStartTime.current = Date.now();
            if (!parsed.currentQuestion) {
              loadNextQuestion();
            } else {
              prefetchNextQuestion();
            }
          }
        } catch (e) {
          console.error("Failed to parse saved sprint:", e);
          localStorage.removeItem(storageKey);
          loadNextQuestion();
        }
      } else {
        loadNextQuestion();
      }
      setIsInitialized(true);
    });
  }, [userId, loadNextQuestion, prefetchNextQuestion]);

  useEffect(() => {
    if (!isInitialized || isSessionEnding.current) return;

    const storageKey = `maths_tutor_sprint_${userId}`;
    const stateToSave = {
      elapsedTime,
      questionsCompleted,
      score,
      pendingResult,
      currentQuestion,
      attempts,
      hint,
      showFullExplanation,
      alternativeExplanation,
      isPaused,
      timestamp: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [
    isInitialized,
    userId,
    elapsedTime,
    questionsCompleted,
    score,
    pendingResult,
    currentQuestion,
    attempts,
    hint,
    showFullExplanation,
    alternativeExplanation,
    isPaused,
  ]);

  useEffect(() => {
    if (isPaused || isFinished || isLoading || !currentQuestion) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isFinished, isLoading, currentQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || isLoading || isPaused || isCorrectFeedback || isHintLoading) return;

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);
      const trimmedUser = userAnswer.trim();
      const trimmedCorrect = currentQuestion.answer.trim();
      const normalizedUser = normalizeAnswer(userAnswer);
      const normalizedCorrect = normalizeAnswer(currentQuestion.answer);

      // Check if they match directly, or if the numeric parts match and user omitted the unit
      const isNumericMatch = (() => {
        const userNumMatch = normalizedUser.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
        const correctNumMatch = normalizedCorrect.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
        if (userNumMatch && correctNumMatch) {
          const [, userNum, userUnit] = userNumMatch;
          const [, correctNum, correctUnit] = correctNumMatch;
          return Number(userNum) === Number(correctNum) && (userUnit === correctUnit || userUnit === "" || correctUnit === "");
        }
        return false;
      })();

      // Also check against acceptableAnswers array if present
      const isAcceptableMatch = (() => {
        if (currentQuestion.acceptableAnswers && Array.isArray(currentQuestion.acceptableAnswers)) {
          return currentQuestion.acceptableAnswers.some(ans => {
            const normalizedAcceptable = normalizeAnswer(ans);
            if (normalizedUser === normalizedAcceptable) return true;

            const userNumMatch = normalizedUser.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
            const acceptableNumMatch = normalizedAcceptable.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
            if (userNumMatch && acceptableNumMatch) {
              const [, userNum, userUnit] = userNumMatch;
              const [, accNum, accUnit] = acceptableNumMatch;
              return Number(userNum) === Number(accNum) && (userUnit === accUnit || userUnit === "" || accUnit === "");
            }
            return false;
          });
        }
        return false;
      })();

      if (normalizedUser === normalizedCorrect || isNumericMatch || isAcceptableMatch) {
        // Show positive feedback, then ask how much support was needed before recording it.
        setIsCorrectFeedback(true);
        setPendingResult({
          isCorrect: true,
          timeTaken,
          userAnswer: trimmedUser,
          correctAnswer: trimmedCorrect,
        });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts === 1) {
          setIsHintLoading(true);
          try {
            const hintText = await fetchHint(currentQuestion.text, trimmedUser, trimmedCorrect);
            setHint(hintText);
          } catch (err) {
            console.error("Error fetching hint:", err);
          } finally {
            setIsHintLoading(false);
          }
        } else {
          setPendingResult({
            isCorrect: false,
            timeTaken,
            userAnswer: trimmedUser,
            correctAnswer: trimmedCorrect,
          });

          // Show the explanation, but record the support level first.
          setShowFullExplanation(true);
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  const supportPrompt = pendingResult && (
    <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl text-left space-y-3">
      <p className="font-extrabold text-sky-900">How was this question solved?</p>
      <p className="text-sm text-sky-800 font-medium">This helps us choose the right level. There is no wrong choice.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" onClick={() => recordSupportAndContinue('independent')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold py-2.5 px-3 rounded-xl cursor-pointer">
          I did it myself
        </button>
        <button type="button" onClick={() => recordSupportAndContinue('hint')} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-2.5 px-3 rounded-xl cursor-pointer">
          I needed a hint
        </button>
        <button type="button" onClick={() => recordSupportAndContinue('parent_help')} className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold py-2.5 px-3 rounded-xl cursor-pointer">
          Parent helped
        </button>
        <button type="button" onClick={() => recordSupportAndContinue('parent_answered')} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2.5 px-3 rounded-xl cursor-pointer">
          Parent answered
        </button>
      </div>
    </div>
  );

  if (isFinished) {
    return (
      <div className="text-center space-y-6 p-8 bg-theme-card text-slate-900 rounded-3xl shadow-2xl border-4 border-green-500">
        <h2 className="text-4xl font-extrabold text-green-700 flex items-center justify-center gap-2 animate-bounce">
          Sprint Completed! 🏆
        </h2>
        <p className="text-2xl text-slate-800 font-bold">
          You scored <span className="font-extrabold text-secondary">{score}</span> out of <span className="font-extrabold text-primary">{totalQuestions}</span> questions!
        </p>
        <p className="text-slate-500 font-semibold">
          Total Time: {minutes}m {seconds}s
        </p>
        <button
          onClick={() => onFinish(score)}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col bg-theme-card text-slate-900 p-4 rounded-2xl shadow-sm border-2 border-theme-border gap-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div id="sprint-progress" className="text-xl font-extrabold text-primary flex items-center gap-1.5">
                🎯 {Math.min(questionsCompleted + 1, totalQuestions)} / {totalQuestions}
              </div>
              <div id="sprint-timer" className="text-sm text-slate-500 font-bold flex items-center gap-1">
                ⏱️ Time: {minutes}:{seconds.toString().padStart(2, '0')}
                {isPaused && <span className="text-yellow-600 font-bold ml-1 animate-pulse">(Paused)</span>}
              </div>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 bg-primary-bg hover:bg-primary/20 text-primary rounded-xl text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
            >
              {isPaused ? <Play className="w-4 h-4 fill-primary text-primary" /> : <Pause className="w-4 h-4 fill-primary text-primary" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleExitClick}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
          <div className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-secondary fill-secondary-bg" /> Score: {score}
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(questionsCompleted / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className={`bg-theme-card text-slate-900 p-12 rounded-3xl shadow-xl border-4 ${isCorrectFeedback ? 'border-green-500 ring-4 ring-green-200' : 'border-primary/40'} transition-all text-center space-y-8 relative overflow-hidden min-h-[400px] sm:min-h-[450px] flex flex-col justify-center`}>
        {isLoading && !isPaused && (
          <div className="absolute inset-0 bg-theme-card/85 flex flex-col items-center justify-center gap-4 z-10 animate-in fade-in duration-200">
            <div className="animate-bounce text-5xl">🤔</div>
            <p className="font-extrabold text-primary animate-pulse text-lg">{tutorName} is preparing your next challenge...</p>
          </div>
        )}

        {currentQuestion && (
          <>
            {isPaused && (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-950 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mb-2 animate-in fade-in slide-in-from-top-3">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-lg flex items-center justify-center sm:justify-start gap-1.5 text-yellow-800">
                    Sprint Paused! ⏸️
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    The timer is stopped. You can read the question, then click Resume to type your answer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="whitespace-nowrap bg-primary hover:bg-primary-hover text-white font-extrabold py-2.5 px-5 rounded-xl text-sm shadow transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white text-white" /> Resume Sprint
                </button>
              </div>
            )}

            <div className="text-sm font-extrabold text-primary uppercase tracking-widest flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary" /> {currentQuestion.topic}
            </div>
            
            {currentQuestion.visualHint && (() => {
              const match = currentQuestion.visualHint.match(/^([^a-zA-Z\(\)]*)(.*)$/);
              const emojis = match ? match[1].trim() : '';
              const text = match ? match[2].trim() : '';

              if (emojis) {
                return (
                  <div className="flex flex-col items-center justify-center gap-3 py-2">
                    <div className="text-3xl sm:text-4xl tracking-wider select-none leading-normal">
                      {emojis}
                    </div>
                    {text && (
                      <div className="text-sm sm:text-base font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 max-w-md mx-auto leading-relaxed shadow-sm">
                        {text}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="text-base sm:text-lg md:text-xl font-bold text-primary bg-primary-bg/50 px-6 py-3 rounded-2xl border border-primary/20 max-w-lg mx-auto leading-relaxed shadow-sm">
                  {currentQuestion.visualHint}
                </div>
              );
            })()}

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {isHintLoading && !showFullExplanation && (
              <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300 text-amber-950 flex items-center justify-center gap-2 font-semibold animate-pulse">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent"></div>
                <span>Not quite! {tutorName} is thinking of a hint for you... 💡</span>
              </div>
            )}

            {hint && !showFullExplanation && !isHintLoading && (
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 text-yellow-950 italic font-semibold animate-in fade-in slide-in-from-top-4">
                💡 {tutorName}&apos;s Hint: {hint}
              </div>
            )}

            {showFullExplanation && (
              <div className="bg-primary-bg/40 p-6 rounded-xl border-2 border-primary/20 text-left space-y-4 animate-in zoom-in-95 relative overflow-hidden">
                <p className="font-bold text-theme-title text-base md:text-lg">Don&apos;t worry! Here&apos;s how to do it:</p>
                
                {isExplainingLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-3 text-slate-500 animate-in fade-in">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold text-primary animate-pulse text-sm">{tutorName} is thinking of another way to explain this...</p>
                  </div>
                ) : (
                  <p className="text-slate-800 leading-relaxed text-base md:text-lg font-medium">
                    {alternativeExplanation || currentQuestion.explanation}
                  </p>
                )}

                {supportPrompt}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {!alternativeExplanation && (
                    <button
                      type="button"
                      disabled={isExplainingLoading || isLoading || isPaused}
                      onClick={handleGetAlternativeExplanation}
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 disabled:opacity-50 font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95 duration-200"
                    >
                      {isExplainingLoading ? "Thinking... 🤔" : "Explain in another way! 💡"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={retryCurrentQuestion}
                    disabled={isLoading || isExplainingLoading || isPaused || Boolean(pendingResult)}
                    className="bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-900 font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-all active:scale-95"
                  >
                    Try this one again
                  </button>
                  <button
                    type="button"
                    onClick={practiseSameTopic}
                    disabled={isLoading || isExplainingLoading || isPaused || Boolean(pendingResult)}
                    className="bg-secondary-bg hover:bg-secondary/20 disabled:opacity-50 text-secondary font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-all active:scale-95"
                  >
                    Another like this
                  </button>
                  <button
                    type="button"
                    onClick={practiseDifferentTopic}
                    disabled={isLoading || isExplainingLoading || isPaused || Boolean(pendingResult)}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-all active:scale-95"
                  >
                    Try a different topic
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextQuestion(score)}
                    disabled={isLoading || isExplainingLoading || isPaused || Boolean(pendingResult)}
                    className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95 duration-200 flex items-center justify-center gap-1.5"
                  >
                    Got it! Next question <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {!showFullExplanation && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isCorrectFeedback && (
                  <div className="bg-green-100 border-2 border-green-500 text-green-900 p-3 rounded-2xl flex items-center justify-center gap-2 font-extrabold text-lg animate-in zoom-in-95">
                    <CheckCircle2 className="w-6 h-6 text-green-600 animate-bounce" /> Correct! Awesome job! 🌟
                  </div>
                )}
                {isCorrectFeedback && supportPrompt}
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isLoading || isPaused || isCorrectFeedback || isHintLoading}
                  className={`w-full p-3 text-xl md:text-2xl text-center border-4 rounded-2xl focus:border-primary outline-none transition-all text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-400 ${isCorrectFeedback ? 'border-green-500 bg-green-50/50 text-green-700 font-extrabold' : 'border-primary-bg'}`}
                  placeholder={isPaused ? "Sprint is paused. Resume to answer!" : isCorrectFeedback ? "Correct! 🌟" : "Type your answer..."}
                  autoFocus={!isPaused}
                />
                <button
                  type="submit"
                  disabled={isLoading || isPaused || isCorrectFeedback || isHintLoading}
                  className={`w-full ${isCorrectFeedback ? 'bg-green-600 text-white' : 'bg-primary hover:bg-primary-hover text-white'} font-extrabold py-3 rounded-2xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  {isPaused ? (
                    "Paused ⏸️"
                  ) : isCorrectFeedback ? (
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-6 h-6" /> Correct!</span>
                  ) : isHintLoading ? (
                    "Thinking... 💡"
                  ) : (
                    <>
                      {attempts > 0 ? <RotateCcw className="w-5 h-5 animate-spin-once" /> : null}
                      {attempts > 0 ? "Try Again! 🔄" : "Submit 🚀"}
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card p-8 rounded-3xl max-w-md w-full border-4 border-primary/40 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="text-5xl">🚪</div>
            <h3 className="text-2xl font-extrabold text-theme-title">Exit Sprint?</h3>
            <p className="text-slate-600 font-medium text-base leading-relaxed">
              You have answered <span className="text-primary font-bold">{score}</span> {score === 1 ? 'question' : 'questions'} correctly so far. Would you like to save your progress or discard this session?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePauseAndExit}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base flex items-center justify-center gap-1.5"
              >
                <Pause className="w-5 h-5" /> Pause & Exit (Resume Later)
              </button>
              <button
                onClick={handleSaveAndExit}
                className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base flex items-center justify-center gap-1.5"
              >
                <Save className="w-5 h-5" /> Finish & Submit Session
              </button>
              <button
                onClick={handleDiscardAndExit}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-5 h-5" /> Discard & Exit
              </button>
              <button
                onClick={handleCancelExit}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
