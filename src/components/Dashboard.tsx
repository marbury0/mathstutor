'use client';

import { useState, useTransition } from 'react';
import Sprint from './Sprint';
import Link from 'next/link';
import { switchUser, startNewProfileOnboarding } from '@/app/actions/user';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  currentStreak: number;
  yearGroup?: number;
  avatar?: string;
  tutorName?: string;
}

export default function Dashboard({ user, allUsers = [], isTestMode = false }: { user: User; allUsers?: User[]; isTestMode?: boolean }) {
  const [isSprintActive, setIsSprintActive] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSprintFinish = () => {
    setIsSprintActive(false);
  };

  if (isSprintActive) {
    return (
      <div className="min-h-screen py-12 px-4">
        <Sprint onFinish={handleSprintFinish} isTestMode={isTestMode} tutorName={user.tutorName || "Maths Bot"} />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/95 text-slate-900 p-6 rounded-2xl shadow-sm border-2 border-teal-100 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{user.avatar || '🐣'}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-teal-800">Welcome back, {user.name}! 🌟</h1>
              <p className="text-slate-600 font-medium">Year {user.yearGroup || 5} • {user.tutorName || "Maths Bot"} is ready for your daily 20-minute math sprint!</p>
            </div>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="text-xl md:text-2xl font-bold text-orange-600 whitespace-nowrap">🔥 {user.currentStreak} Day Streak</div>
            <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-2 rounded-2xl border border-slate-200 shadow-inner">
              <span className="text-sm font-bold text-slate-500">Profile:</span>
              <select
                value={user.id}
                disabled={isPending}
                onChange={(e) => {
                  const val = e.target.value;
                  startTransition(async () => {
                    if (val === 'new') {
                      await startNewProfileOnboarding();
                    } else {
                      await switchUser(val);
                    }
                    router.refresh();
                  });
                }}
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer text-sm md:text-base pr-4"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (Yr {u.yearGroup})
                  </option>
                ))}
                <option value="new" className="text-teal-600 font-bold">➕ Add Profile...</option>
              </select>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white/95 text-slate-900 p-8 rounded-3xl shadow-lg border-4 border-teal-300 flex flex-col items-center text-center space-y-6">
            <div className="text-6xl text-teal-500">⚡</div>
            <h2 className="text-2xl font-bold text-slate-800">The Daily Sprint</h2>
            <p className="text-slate-600 italic font-medium">&ldquo;Can you beat your past self today with {user.tutorName || "Maths Bot"}&apos;s help?&rdquo;</p>
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
            <p className="text-slate-600 font-medium">See how much you&apos;ve learned this week.</p>
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
