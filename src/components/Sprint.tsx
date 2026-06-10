'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';

interface Question {
  text: string;
  answer: string;
  explanation: string;
  topic: string;
  visualHint: string;
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

  const initialTime = useRef(1200);

  useEffect(() => {
    if (isTestMode) {
      console.log('Test override detected: Setting sprint duration to 5 seconds.');
      initialTime.current = 5;
      setTimeLeft(5);
    }
  }, [isTestMode]);
  
  const questionStartTime = useRef<number>(Date.now());

  const loadNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setHint(null);
    setAttempts(0);
    setShowFullExplanation(false);
    setUserAnswer('');
    try {
      const q = await fetchNextQuestion();
      setCurrentQuestion(q);
      questionStartTime.current = Date.now();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  useEffect(() => {
    if (isPaused || isFinished) return;
    if (timeLeft <= 0) {
      handleFinalFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isPaused]);

  const handleFinalFinish = async () => {
    setIsFinished(true);
    const duration = Math.max(0, initialTime.current - timeLeft);
    await finishSession(score, duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || isLoading || isPaused) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const normalizedUser = userAnswer.trim();
    const normalizedCorrect = currentQuestion.answer.trim();

    if (normalizedUser === normalizedCorrect) {
      await logQuestionResult(currentQuestion.topic, true, timeTaken);
      setScore(score + 1);
      loadNextQuestion();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts === 1) {
        setIsLoading(true);
        const hintText = await fetchHint(currentQuestion.text, normalizedUser, normalizedCorrect);
        setHint(hintText);
        setIsLoading(false);
      } else {
        await logQuestionResult(currentQuestion.topic, false, timeTaken, normalizedUser, normalizedCorrect);
        setShowFullExplanation(true);
      }
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isFinished) {
    return (
      <div className="text-center space-y-6 p-8 bg-white text-slate-900 rounded-3xl shadow-2xl border-4 border-green-500">
        <h2 className="text-4xl font-bold text-green-700">Time's Up! 🏁</h2>
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
        </div>
        <div className="text-2xl font-bold text-orange-600">
          ⭐ Score: {score}
        </div>
      </div>

      <div className="bg-white/95 text-slate-900 p-12 rounded-3xl shadow-xl border-4 border-teal-300 text-center space-y-8 relative overflow-hidden">
        {isLoading && !isPaused && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="animate-bounce text-4xl">🤔</div>
            <p className="absolute bottom-10 font-bold text-teal-700 animate-pulse">Generating your personalized challenge...</p>
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
            
            <div className="text-4xl py-4 text-slate-900">
              {currentQuestion.visualHint}
            </div>

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
                <p className="font-bold text-teal-900">Don't worry! Here's how to do it:</p>
                <p className="text-slate-800">{currentQuestion.explanation}</p>
                <button
                  onClick={loadNextQuestion}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-2 rounded-lg cursor-pointer"
                >
                  Got it! Next question ➡️
                </button>
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
    </div>
  );
}
