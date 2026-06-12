'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint, fetchAlternativeExplanation } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';
import { Timer, Pause, Play, LogOut, Trophy, HelpCircle, ArrowRight, RotateCcw, Save, Trash2, CheckCircle2 } from 'lucide-react';

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

export default function Sprint({
  onFinish,
  isTestMode = false,
  tutorName = 'Maths Bot',
  sprintDuration = 900
}: {
  onFinish: (score: number) => void;
  isTestMode?: boolean;
  tutorName?: string;
  sprintDuration?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(sprintDuration);
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

  const initialTime = useRef(sprintDuration);

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
    if (isLoading) return;
    setIsLoading(true);
    try {
      const duration = Math.max(0, initialTime.current - timeLeft);
      await finishSession(score, duration);
      onFinish(score);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
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
    if (isPaused || isFinished || isLoading || !currentQuestion) return;
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
  }, [timeLeft, isFinished, isPaused, isLoading, currentQuestion, handleFinalFinish]);

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
        await loadNextQuestion();
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isFinished) {
    return (
      <div className="text-center space-y-6 p-8 bg-theme-card text-slate-900 rounded-3xl shadow-2xl border-4 border-green-500">
        <h2 className="text-4xl font-bold text-green-700 flex items-center justify-center gap-2">
          Time&apos;s Up! <CheckCircle2 className="w-10 h-10 text-green-600" />
        </h2>
        <p className="text-2xl text-slate-800">You scored <span className="font-bold text-secondary">{score}</span> points!</p>
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
      <div className="flex justify-between items-center bg-theme-card text-slate-900 p-4 rounded-2xl shadow-sm border-2 border-theme-border">
        <div className="flex items-center gap-4">
          <div id="sprint-timer" className="text-2xl font-bold text-primary flex items-center gap-2">
            <Timer className="w-6 h-6 animate-pulse" /> {minutes}:{seconds.toString().padStart(2, '0')}
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

      <div className="bg-theme-card text-slate-900 p-12 rounded-3xl shadow-xl border-4 border-primary/40 text-center space-y-8 relative overflow-hidden min-h-[400px] sm:min-h-[450px] flex flex-col justify-center">
        {isLoading && !isPaused && (
          <div className="absolute inset-0 bg-theme-card/85 flex flex-col items-center justify-center gap-4 z-10">
            <div className="animate-bounce text-5xl">🤔</div>
            <p className="font-extrabold text-primary animate-pulse text-lg">{tutorName} is generating your personalized challenge...</p>
          </div>
        )}

        {isPaused ? (
          <div className="py-12 space-y-6 flex flex-col items-center">
            <h3 className="text-3xl font-extrabold text-theme-title">Sprint Paused! ⏸️</h3>
            <p className="text-xl text-slate-600 max-w-md">Take a quick breath, relax your mind, and resume when you are ready to learn.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold py-4 px-8 rounded-2xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Play className="w-6 h-6 fill-white text-white" /> Resume Sprint
            </button>
          </div>
        ) : currentQuestion && (
          <>
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
                      disabled={isExplainingLoading || isLoading}
                      onClick={handleGetAlternativeExplanation}
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 disabled:opacity-50 font-bold py-3 px-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-95 duration-200"
                    >
                      {isExplainingLoading ? "Thinking... 🤔" : "Explain in another way! 💡"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadNextQuestion}
                    disabled={isLoading || isExplainingLoading}
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
                  className="w-full p-3 text-xl md:text-2xl text-center border-4 border-primary-bg rounded-2xl focus:border-primary outline-none transition-colors text-slate-900 bg-white"
                  placeholder="Type your answer..."
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-2xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {attempts > 0 ? <RotateCcw className="w-5 h-5 animate-spin-once" /> : null}
                  {attempts > 0 ? "Try Again! 🔄" : "Submit 🚀"}
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
