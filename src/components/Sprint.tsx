'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint, fetchAlternativeExplanation } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';

interface Question {
  text: string;
  answer: string;
  explanation: string;
  topic: string;
  visualHint: string;
}

/**
 * Normalizes answer strings to handle currency symbols, spaces, case-insensitivity, 
 * and numeric formats (like 5.0 vs 5).
 */
export function normalizeAnswer(ans: string): string {
  if (!ans) return "";
  let cleaned = ans.replace(/[£$€¥]/g, "").trim();
  cleaned = cleaned.replace(/\s+/g, "");
  const num = Number(cleaned);
  if (!isNaN(num) && cleaned !== "") {
    return String(num);
  }
  return cleaned.toLowerCase();
}

export default function Sprint({ onFinish, isTestMode = false }: { onFinish: (score: number) => void; isTestMode?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(1200);
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

  const initialTime = useRef(1200);

  useEffect(() => {
    if (isTestMode) {
      console.log('Test override detected: Setting sprint duration to 5 seconds.');
      initialTime.current = 5;
      const timer = setTimeout(() => setTimeLeft(5), 0);
      return () => clearTimeout(timer);
    }
  }, [isTestMode]);
  
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

  const handleFinalFinish = useCallback(async () => {
    setIsFinished(true);
    const duration = Math.max(0, initialTime.current - timeLeft);
    await finishSession(score, duration);
  }, [score, timeLeft]);

  const handleExitClick = () => {
    setIsPaused(true);
    setShowExitModal(true);
  };

  const handleSaveAndExit = async () => {
    const duration = Math.max(0, initialTime.current - timeLeft);
    await finishSession(score, duration);
    onFinish(score);
  };

  const handleDiscardAndExit = () => {
    onFinish(score);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setIsPaused(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNextQuestion();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadNextQuestion]);

  useEffect(() => {
    if (isPaused || isFinished) return;
    if (timeLeft <= 0) {
      const timer = setTimeout(() => {
        handleFinalFinish();
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isPaused, handleFinalFinish]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || isLoading || isPaused) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const trimmedUser = userAnswer.trim();
    const trimmedCorrect = currentQuestion.answer.trim();
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(currentQuestion.answer);

    if (normalizedUser === normalizedCorrect) {
      await logQuestionResult(
        currentQuestion.topic,
        true,
        timeTaken,
        currentQuestion.text,
        trimmedUser,
        trimmedCorrect
      );
      setScore(score + 1);
      loadNextQuestion();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts === 1) {
        setIsLoading(true);
        const hintText = await fetchHint(currentQuestion.text, trimmedUser, trimmedCorrect);
        setHint(hintText);
        setIsLoading(false);
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
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isFinished) {
    return (
      <div className="text-center space-y-6 p-8 bg-white text-slate-900 rounded-3xl shadow-2xl border-4 border-green-500">
        <h2 className="text-4xl font-bold text-green-700">Time&apos;s Up! 🏁</h2>
        <p className="text-2xl text-slate-800">You scored <span className="font-bold text-blue-700">{score}</span> points!</p>
        <button
          onClick={() => onFinish(score)}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white/95 text-slate-900 p-4 rounded-2xl shadow-sm border-2 border-teal-100">
        <div className="flex items-center gap-4">
          <div id="sprint-timer" className="text-2xl font-bold text-teal-800">
            ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-xl text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={handleExitClick}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            🚪 Exit
          </button>
        </div>
        <div className="text-2xl font-bold text-orange-600">
          ⭐ Score: {score}
        </div>
      </div>

      <div className="bg-white/95 text-slate-900 p-12 rounded-3xl shadow-xl border-4 border-teal-300 text-center space-y-8 relative overflow-hidden min-h-[400px] sm:min-h-[450px] flex flex-col justify-center">
        {isLoading && !isPaused && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-4 z-10">
            <div className="animate-bounce text-5xl">🤔</div>
            <p className="font-extrabold text-teal-700 animate-pulse text-lg">Generating your personalized challenge...</p>
          </div>
        )}

        {isPaused ? (
          <div className="py-12 space-y-6">
            <h3 className="text-3xl font-extrabold text-teal-800">Sprint Paused! ⏸️</h3>
            <p className="text-xl text-slate-600">Take a quick breath, relax your mind, and resume when you are ready to learn.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-4 px-8 rounded-2xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Resume Sprint ▶️
            </button>
          </div>
        ) : currentQuestion && (
          <>
            <div className="text-sm font-extrabold text-teal-700 uppercase tracking-widest">
              {currentQuestion.topic}
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
                <div className="text-base sm:text-lg md:text-xl font-bold text-teal-800 bg-teal-50/40 px-6 py-3 rounded-2xl border border-teal-100/60 max-w-lg mx-auto leading-relaxed shadow-sm">
                  {currentQuestion.visualHint}
                </div>
              );
            })()}

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {hint && !showFullExplanation && (
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 text-yellow-950 italic font-semibold animate-in fade-in slide-in-from-top-4">
                💡 Hint: {hint}
              </div>
            )}

            {showFullExplanation && (
              <div className="bg-teal-50/50 p-6 rounded-xl border-2 border-teal-100 text-left space-y-4 animate-in zoom-in-95">
                <p className="font-bold text-teal-900">Don&apos;t worry! Here&apos;s how to do it:</p>
                <p className="text-slate-800 leading-relaxed">
                  {alternativeExplanation || currentQuestion.explanation}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {!alternativeExplanation && (
                    <button
                      type="button"
                      disabled={isExplainingLoading}
                      onClick={handleGetAlternativeExplanation}
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 disabled:opacity-50 font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      {isExplainingLoading ? "Thinking of another way... 🤔" : "Explain in another way! 💡"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadNextQuestion}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-3 px-4 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Got it! Next question ➡️
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
                  className="w-full p-3 text-xl md:text-2xl text-center border-4 border-teal-100 rounded-2xl focus:border-teal-400 outline-none transition-colors text-slate-900 bg-white"
                  placeholder="Type your answer..."
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-3 rounded-2xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {attempts > 0 ? "Try Again! 🔄" : "Submit 🚀"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full border-4 border-teal-300 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="text-5xl">🚪</div>
            <h3 className="text-2xl font-extrabold text-teal-900">Exit Sprint?</h3>
            <p className="text-slate-600 font-medium text-base leading-relaxed">
              You have answered <span className="text-teal-600 font-bold">{score}</span> {score === 1 ? 'question' : 'questions'} correctly so far. Would you like to save your progress or discard this session?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndExit}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base"
              >
                💾 Save & Exit
              </button>
              <button
                onClick={handleDiscardAndExit}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 px-4 rounded-xl shadow transition-colors cursor-pointer text-base"
              >
                🗑️ Discard & Exit
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
