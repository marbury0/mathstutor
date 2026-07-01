'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint, fetchAlternativeExplanation } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';
import { Timer, Pause, Play, LogOut, Trophy, HelpCircle, ArrowRight, RotateCcw, Save, Trash2, CheckCircle2 } from 'lucide-react';

interface Question {
  text: string;
  answer: string;
  acceptableAnswers?: string[];
  explanation: string;
  topic: string;
  visualHint: string;
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

  const loadNextQuestion = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setHint(null);
    setAttempts(0);
    setShowFullExplanation(false);
    setAlternativeExplanation(null);
    setIsExplainingLoading(false);
    setUserAnswer('');
    try {
      const q = await fetchNextQuestion();
      setCurrentQuestion(q);
      questionStartTime.current = Date.now();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

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

  const handleCancelExit = () => {
    setShowExitModal(false);
    setIsPaused(false);
  };

  useEffect(() => {
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
  }, [userId, loadNextQuestion]);

  useEffect(() => {
    if (!isInitialized || isSessionEnding.current) return;

    const storageKey = `maths_tutor_sprint_${userId}`;
    const stateToSave = {
      elapsedTime,
      questionsCompleted,
      score,
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
    if (!currentQuestion || isLoading || isPaused) return;

    setIsLoading(true);
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
          const [_, userNum, userUnit] = userNumMatch;
          const [__, correctNum, correctUnit] = correctNumMatch;
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
              const [_, userNum, userUnit] = userNumMatch;
              const [__, accNum, accUnit] = acceptableNumMatch;
              return Number(userNum) === Number(accNum) && (userUnit === accUnit || userUnit === "" || accUnit === "");
            }
            return false;
          });
        }
        return false;
      })();

      if (normalizedUser === normalizedCorrect || isNumericMatch || isAcceptableMatch) {
        await logQuestionResult(
          currentQuestion.topic,
          true,
          timeTaken,
          currentQuestion.text,
          trimmedUser,
          trimmedCorrect
        );
        setScore(score + 1);
        await handleNextQuestion(score + 1);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts === 1) {
          const hintText = await fetchHint(currentQuestion.text, trimmedUser, trimmedCorrect);
          setHint(hintText);
        } else {
          await logQuestionResult(
            currentQuestion.topic,
            false,
            timeTaken,
            currentQuestion.text,
            trimmedUser,
            trimmedCorrect
          );
          setShowFullExplanation(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

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

      <div className="bg-theme-card text-slate-900 p-12 rounded-3xl shadow-xl border-4 border-primary/40 text-center space-y-8 relative overflow-hidden min-h-[400px] sm:min-h-[450px] flex flex-col justify-center">
        {isLoading && !isPaused && (
          <div className="absolute inset-0 bg-theme-card/85 flex flex-col items-center justify-center gap-4 z-10">
            <div className="animate-bounce text-5xl">🤔</div>
            <p className="font-extrabold text-primary animate-pulse text-lg">{tutorName} is generating your personalized challenge...</p>
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
            
            {hint && !showFullExplanation && (
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
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
                    onClick={() => handleNextQuestion(score)}
                    disabled={isLoading || isExplainingLoading || isPaused}
                    className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95 duration-200 flex items-center justify-center gap-1.5"
                  >
                    Got it! Next question <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {!showFullExplanation && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isLoading || isPaused}
                  className="w-full p-3 text-xl md:text-2xl text-center border-4 border-primary-bg rounded-2xl focus:border-primary outline-none transition-colors text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                  placeholder={isPaused ? "Sprint is paused. Resume to answer!" : "Type your answer..."}
                  autoFocus={!isPaused}
                />
                <button
                  type="submit"
                  disabled={isLoading || isPaused}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-2xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPaused ? (
                    "Paused ⏸️"
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
                onClick={handleSaveAndExit}
                className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base flex items-center justify-center gap-1.5"
              >
                <Save className="w-5 h-5" /> Save & Exit
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
