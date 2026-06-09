'use client';

import { useState } from 'react';
import Sprint from './Sprint';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  currentStreak: number;
}

export default function Dashboard({ user }: { user: User }) {
  const [isSprintActive, setIsSprintActive] = useState(false);

  const handleSprintFinish = (score: number) => {
    setIsSprintActive(false);
  };

  if (isSprintActive) {
    return (
      <div className="min-h-screen bg-blue-50 py-12 px-4">
        <Sprint onFinish={handleSprintFinish} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 py-12 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-100">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Welcome back, {user.name}! 🌟</h1>
            <p className="text-gray-600">Ready for your daily 20-minute math sprint?</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-500">🔥 {user.currentStreak} Day Streak</div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white p-8 rounded-3xl shadow-lg border-4 border-blue-400 flex flex-col items-center text-center space-y-6">
            <div className="text-6xl text-blue-500">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800">The Daily Sprint</h2>
            <p className="text-gray-600 italic">"Can you beat your past self today?"</p>
            <button 
              onClick={() => setIsSprintActive(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transform transition active:scale-95"
            >
              Start Sprint! 🚀
            </button>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-lg border-4 border-purple-400 flex flex-col items-center text-center space-y-6">
            <div className="text-6xl text-purple-500">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">Your Progress</h2>
            <p className="text-gray-600">See how much you've learned this week.</p>
            <Link 
              href="/parent"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-2xl text-xl shadow-lg text-center transform transition active:scale-95"
            >
              View Stats 📊
            </Link>
          </section>
        </div>

        <footer className="text-center pt-8">
          <Link href="/parent" className="text-gray-400 text-sm hover:underline">
            Parental Controls & Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
