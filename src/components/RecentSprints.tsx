'use client';

import { useState } from 'react';
import { getSessionQuestions } from '@/app/actions/user';

interface Session {
  id: string;
  date: Date;
  duration: number;
  score: number;
}

interface QuestionDetail {
  id: string;
  isCorrect: boolean;
  timeTaken: number;
  questionText: string | null;
  userAnswer: string | null;
  correctAnswer: string | null;
  misconception: string | null;
  advice: string | null;
  answeredAt: Date;
  topic: {
    name: string;
  };
}

export default function RecentSprints({ sessions }: { sessions: Session[] }) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionClick = async (session: Session) => {
    setSelectedSession(session);
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const qData = await getSessionQuestions(session.id);
      setQuestions(qData as unknown as QuestionDetail[]);
    } catch (err) {
      console.error(err);
      setError('Failed to load details for this session.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSession(null);
    setQuestions([]);
  };

  return (
    <div className="space-y-4">
      {sessions.length === 0 && <p className="text-slate-600 italic">No sessions recorded yet.</p>}
      
      <div className="grid gap-3">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSessionClick(s)}
            className="flex justify-between items-center p-4 bg-slate-50 hover:bg-teal-50/40 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all text-left w-full cursor-pointer hover:scale-[1.01] active:scale-95 group shadow-sm"
          >
            <div>
              <div className="font-extrabold text-slate-800 group-hover:text-teal-800 transition-colors">
                {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-sm text-slate-500 font-bold mt-1">
                ⏱️ {Math.floor(s.duration / 60)}m {s.duration % 60}s duration
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-extrabold text-teal-600 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 shadow-sm">
                ⭐ {s.score} pts
              </div>
              <div className="text-slate-400 group-hover:text-teal-500 transition-colors font-bold text-lg">
                ➔
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] border-4 border-teal-300 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-teal-50/50 border-b-2 border-teal-100 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-extrabold text-teal-900">Sprint Details</h3>
                <p className="text-slate-600 font-bold text-sm mt-1">
                  {new Date(selectedSession.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="bg-teal-100 hover:bg-teal-200 text-teal-800 p-2 rounded-xl font-extrabold text-sm transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
                  <div className="font-extrabold text-teal-700 animate-pulse animate-in fade-in">Loading questions...</div>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 font-bold text-center">
                  ⚠️ {error}
                </div>
              )}

              {!loading && !error && questions.length === 0 && (
                <div className="text-slate-500 text-center py-8 font-medium">
                  No question logs found for this session.
                </div>
              )}

              {!loading && !error && questions.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Questions</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">{questions.length}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy</div>
                      <div className="text-2xl font-extrabold text-teal-600 mt-1">
                        {Math.round((questions.filter(q => q.isCorrect).length / questions.length) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                          q.isCorrect
                            ? 'bg-emerald-50/30 border-emerald-100'
                            : 'bg-rose-50/20 border-rose-100'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-xs font-extrabold bg-teal-100/80 text-teal-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {q.topic?.name || 'Mathematics'}
                          </span>
                          <span className="text-xs font-bold text-slate-500 whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                            ⏱️ {q.timeTaken}s taken
                          </span>
                        </div>

                        <p className="font-bold text-slate-800 leading-relaxed text-base">
                          {idx + 1}. {q.questionText || 'Question text not available.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-bold text-slate-500">Student Answer:</span>
                          <span
                            className={`px-3 py-1 rounded-lg font-extrabold ${
                              q.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.isCorrect ? '✅' : '❌'} {q.userAnswer}
                          </span>

                          {!q.isCorrect && (
                            <>
                              <span className="font-bold text-slate-500 ml-2">Correct:</span>
                              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-extrabold">
                                {q.correctAnswer}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Misconception diagnostics */}
                        {q.misconception && (
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                              <span>⚠️ Misconception:</span>
                              <span className="text-amber-800">{q.misconception}</span>
                            </div>
                            {q.advice && (
                              <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                                Advice given: &ldquo;{q.advice}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-2 px-6 rounded-xl shadow cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
