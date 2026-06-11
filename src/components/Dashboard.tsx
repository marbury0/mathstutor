'use client';

import { useState, useTransition } from 'react';
import Sprint from './Sprint';
import Link from 'next/link';
import { switchUser, startNewProfileOnboarding } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import { Zap, Trophy, Flame, BarChart2, Sparkles } from 'lucide-react';

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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-theme-card text-slate-900 p-6 rounded-2xl shadow-sm border-2 border-theme-border gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{user.avatar || '🐣'}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-theme-title flex items-center gap-2">
                Welcome back, {user.name}!
                <Sparkles className="w-7 h-7 text-yellow-500 fill-yellow-400" />
              </h1>
              <p className="text-slate-600 font-medium">Year {user.yearGroup || 5} • {user.tutorName || "Maths Bot"} is ready for your daily 20-minute math sprint!</p>
            </div>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="text-xl md:text-2xl font-bold text-orange-600 whitespace-nowrap flex items-center gap-2">
              <Flame className="w-7 h-7 fill-orange-500 text-orange-600" /> {user.currentStreak} Day Streak
            </div>
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
                <option value="new" className="text-primary font-bold">➕ Add Profile...</option>
              </select>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-theme-card text-slate-900 p-8 rounded-3xl shadow-lg border-4 border-primary/40 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-primary-bg rounded-full border border-primary/20">
              <Zap className="w-16 h-16 text-primary fill-primary-bg" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">The Daily Sprint</h2>
            <p className="text-slate-600 italic font-medium">&ldquo;Can you beat your past self today with {user.tutorName || "Maths Bot"}&apos;s help?&rdquo;</p>
            <button 
              onClick={() => setIsSprintActive(true)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-4 rounded-2xl text-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-auto"
            >
              Start Sprint! 🚀
            </button>
          </section>

          <section className="bg-theme-card text-slate-900 p-8 rounded-3xl shadow-lg border-4 border-secondary/40 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-secondary-bg rounded-full border border-secondary/20">
              <Trophy className="w-16 h-16 text-secondary fill-secondary-bg" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Your Progress</h2>
            <p className="text-slate-600 font-medium">See how much you&apos;ve learned this week.</p>
            <Link 
              href="/parent"
              className="w-full bg-secondary hover:bg-secondary-hover text-white font-extrabold py-4 rounded-2xl text-xl shadow-lg text-center transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-auto"
            >
              View Stats <BarChart2 className="w-6 h-6" />
            </Link>
          </section>
        </div>

        <footer className="text-center pt-8">
          <Link href="/parent" className="text-primary text-sm hover:underline font-extrabold">
            Parental Controls & Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
