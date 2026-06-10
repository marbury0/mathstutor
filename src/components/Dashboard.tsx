'use client';

import { useState } from 'react';
import Sprint from './Sprint';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  currentStreak: number;
  yearGroup?: number;
  avatar?: string;
}

export default function Dashboard({ user }: { user: User }) {
  const [isSprintActive, setIsSprintActive] = useState(false);

  const handleSprintFinish = (score: number) => {
    setIsSprintActive(false);
  };

  if (isSprintActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/50 to-indigo-50/70 py-12 px-4">
        <Sprint onFinish={handleSprintFinish} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/50 to-indigo-50/70 py-12 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white/95 text-slate-900 p-6 rounded-2xl shadow-sm border-2 border-teal-100">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{user.avatar || '🐣'}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-teal-800">Welcome back, {user.name}! 🌟</h1>
              <p className="text-slate-600 font-medium">Year {user.yearGroup || 5} • Ready for your daily 20-minute math sprint?</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">🔥 {user.currentStreak} Day Streak</div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white/95 text-slate-900 p-8 rounded-3xl shadow-lg border-4 border-teal-300 flex flex-col items-center text-center space-y-6">
            <div className="text-6xl text-teal-500">⚡</div>
            <h2 className="text-2xl font-bold text-slate-800">The Daily Sprint</h2>
            <p className="text-slate-600 italic font-medium">"Can you beat your past self today?"</p>
            <button 
              onClick={() => setIsSprintActive(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-extrabold py-4 rounded-2xl text-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Start Sprint! 🚀
            </button>
          </section>

          <section className="bg-white/95 text-slate-900 p-8 rounded-3xl shadow-lg border-4 border-purple-300 flex flex-col items-center text-center space-y-6">
            <div className="text-6xl text-purple-500">🏆</div>
            <h2 className="text-2xl font-bold text-slate-800">Your Progress</h2>
            <p className="text-slate-600 font-medium">See how much you've learned this week.</p>
            <Link 
              href="/parent"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold py-4 rounded-2xl text-xl shadow-lg text-center transform transition hover:scale-[1.02] active:scale-95"
            >
              View Stats 📊
            </Link>
          </section>
        </div>

        <footer className="text-center pt-8">
          <Link href="/parent" className="text-teal-700 text-sm hover:underline font-extrabold">
            Parental Controls & Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
