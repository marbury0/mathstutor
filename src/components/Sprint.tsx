'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNextQuestion, fetchHint } from '@/app/actions/questions';
import { logQuestionResult, finishSession } from '@/app/actions/progression';

interface Question {
  text: string;
  answer: string;
  explanation: string;
  topic: string;
  validationError?: boolean;
}

export default function Sprint({ onFinish }: { onFinish: (score: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(1200);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  
  const questionStartTime = useRef<number>(Date.now());
  const sprintStartTime = useRef<number>(Date.now());

  const loadNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setHint(null);
    setAttempts(0);
    setShowFullExplanation(false);
    setUserAnswer('');
    try {
      // Retry logic for internal AI validation
      let q = await fetchNextQuestion();
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
    if (timeLeft <= 0 && !isFinished) {
      handleFinalFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleFinalFinish = async () => {
    setIsFinished(true);
    const duration = Math.floor((Date.now() - sprintStartTime.current) / 1000);
    await finishSession(score, duration);
    onFinish(score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || isLoading) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);

    // Normalize answers for basic validation (e.g., removing whitespace)
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
        await logQuestionResult(currentQuestion.topic, false, timeTaken);
        setShowFullExplanation(true);
      }
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isFinished) {
    return (
      <div className="text-center space-y-6 p-8 bg-white rounded-3xl shadow-2xl border-4 border-green-500">
        <h2 className="text-4xl font-bold text-green-600 text-black">Time's Up! 🏁</h2>
        <p className="text-2xl text-gray-700 text-black">You scored <span className="font-bold text-blue-600">{score}</span> points!</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-xl cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border-2 border-blue-100">
        <div className="text-2xl font-bold text-blue-600">
          ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-2xl font-bold text-orange-500">
          ⭐ Score: {score}
        </div>
      </div>

      <div className="bg-white p-12 rounded-3xl shadow-xl border-4 border-blue-400 text-center space-y-8 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="animate-bounce text-4xl">🤔</div>
          </div>
        )}

        {currentQuestion && (
          <>
            <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">
              {currentQuestion.topic}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed text-black">
              {currentQuestion.text}
            </h2>
            
            {hint && !showFullExplanation && (
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 text-yellow-800 italic animate-in fade-in slide-in-from-top-4">
                💡 Hint: {hint}
              </div>
            )}

            {showFullExplanation && (
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 text-left space-y-4 animate-in zoom-in-95">
                <p className="font-bold text-blue-800">Don't worry! Here's how to do it:</p>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
                <button
                  onClick={loadNextQuestion}
                  className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg cursor-pointer"
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
                  className="w-full p-3 text-xl md:text-2xl text-center border-4 border-blue-100 rounded-2xl focus:border-blue-500 outline-none transition-colors text-black bg-white"
                  placeholder="Type your answer..."
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
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
