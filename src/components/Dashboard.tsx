'use client';

import { useState, useTransition } from 'react';
import Sprint from './Sprint';
import Link from 'next/link';
import { clearActiveUser } from '@/app/actions/user';
import { requestTaskApproval } from '@/app/actions/rewards';
import { useRouter } from 'next/navigation';
import { Zap, Trophy, Flame, BarChart2, Sparkles, Gift, LogOut } from 'lucide-react';

interface User {
  id: string;
  name: string;
  currentStreak: number;
  yearGroup?: number;
  avatar?: string;
  tutorName?: string;
  sprintDuration?: number | null;
}

interface Reward {
  id: string;
  title: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
  unlocked: boolean;
  claimed: boolean;
  pendingApproval: boolean;
}

export default function Dashboard({
  user,
  allUsers = [],
  isTestMode = false,
  initialRewards = []
}: {
  user: User;
  allUsers?: User[];
  isTestMode?: boolean;
  initialRewards?: Reward[];
}) {
  const [isSprintActive, setIsSprintActive] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSprintFinish = () => {
    setIsSprintActive(false);
  };

  const handleRequestApproval = (rewardId: string) => {
    startTransition(async () => {
      try {
        await requestTaskApproval(rewardId);
      } catch (err) {
        console.error(err);
      }
    });
  };

  if (isSprintActive) {
    return (
      <div className="min-h-screen py-12 px-4">
        <Sprint onFinish={handleSprintFinish} isTestMode={isTestMode} tutorName={user.tutorName || "Maths Bot"} sprintDuration={user.sprintDuration || 900} />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-theme-card text-slate-900 p-6 rounded-2xl shadow-sm border-2 border-theme-border gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{user.avatar || '🐱'}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-theme-title flex items-center gap-2">
                Welcome back, {user.name}!
                <Sparkles className="w-7 h-7 text-yellow-500 fill-yellow-400" />
              </h1>
              <p className="text-slate-600 font-medium">Year {user.yearGroup || 5} • {user.tutorName || "Maths Bot"} is ready for your daily 20-minute maths sprint!</p>
            </div>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="text-xl md:text-2xl font-bold text-orange-600 whitespace-nowrap flex items-center gap-2">
              <Flame className="w-7 h-7 fill-orange-500 text-orange-600" /> {user.currentStreak} Day Streak
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 bg-slate-100/90 px-3 py-2 rounded-2xl border border-slate-200 shadow-inner text-sm font-extrabold text-slate-800">
                <span className="text-slate-500 font-bold">Profile:</span>
                <span>{user.name}</span>
              </div>
              <button
                onClick={async () => {
                  setIsSwitching(true);
                  try {
                    await clearActiveUser();
                    window.location.href = '/';
                  } catch (err) {
                    setIsSwitching(false);
                    console.error(err);
                  }
                }}
                disabled={isPending || isSwitching}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 p-2.5 rounded-2xl border border-slate-200 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold"
                title="Switch Profile"
              >
                <LogOut className="w-4 h-4" /> Switch Profile
              </button>
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

        {initialRewards.filter(r => !r.claimed).length > 0 && (
          <section className="bg-theme-card text-slate-900 p-6 rounded-3xl shadow-lg border-4 border-yellow-400/40 space-y-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Gift className="w-7 h-7 text-yellow-500 fill-yellow-100" /> Goals & Rewards from Parents!
            </h2>
            <p className="text-sm text-slate-600 font-medium">Complete these learning goals set by your parents to unlock real-life rewards!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {initialRewards.filter(r => !r.claimed).map((reward) => {
                const percentage = Math.min(100, Math.round((reward.currentValue / reward.targetValue) * 100));
                
                // Get metric label
                let metricLabel = '';
                let unit = '';
                switch (reward.targetType) {
                  case 'QUESTIONS_ANSWERED':
                    metricLabel = 'Correct Answers';
                    unit = 'questions';
                    break;
                  case 'STREAK':
                    metricLabel = 'Streak';
                    unit = 'days';
                    break;
                  case 'SPRINTS_COMPLETED':
                    metricLabel = 'Sprints Done';
                    unit = 'sprints';
                    break;
                  case 'TOPICS_MASTERED':
                    metricLabel = 'Mastered Topics';
                    unit = 'topics';
                                     case 'TIME_SPENT':
                    metricLabel = 'Learning Time';
                    unit = 'mins';
                    break;
                  case 'HIGH_SCORE':
                    metricLabel = 'Best Sprint Score';
                    unit = 'points';
                    break;
                  case 'CUSTOM_TASK':
                    metricLabel = 'Outside Task';
                    unit = 'times';
                    break;
                  default:
                    metricLabel = 'Progress';
                    unit = 'units';
                }

                return (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                      reward.unlocked
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-md animate-pulse-subtle'
                        : 'bg-white border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    {reward.unlocked && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-xl tracking-wider">
                        Ready! 🌟
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5 pr-8">
                        {reward.title}
                      </h4>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>{metricLabel}:</span>
                        <span className="text-slate-800">
                          {reward.currentValue} / {reward.targetValue} {unit}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            reward.unlocked ? 'bg-emerald-500 animate-pulse' : 'bg-primary'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {reward.unlocked ? (
                        <p className="text-[11px] font-bold text-emerald-700 italic flex items-center gap-1 pt-1">
                          🎉 Complete! Ask your parent for your reward!
                        </p>
                      ) : reward.targetType === 'CUSTOM_TASK' ? (
                        reward.pendingApproval ? (
                          <p className="text-[11px] font-semibold text-yellow-600 italic pt-1 flex items-center gap-1">
                            ⏳ Waiting for parent to verify...
                          </p>
                        ) : (
                          <div className="pt-2">
                            <button
                              onClick={() => handleRequestApproval(reward.id)}
                              disabled={isPending}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold py-1.5 px-2.5 rounded-lg border border-slate-250 transition-all cursor-pointer text-center active:scale-95"
                            >
                              🙋‍♂️ I did this today! (Ask parent to verify)
                            </button>
                          </div>
                        )
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-400 italic pt-1">
                          Keep going! Only {Math.max(0, reward.targetValue - reward.currentValue)} {unit} left.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="text-center pt-8">
          <Link href="/parent" className="text-primary text-sm hover:underline font-extrabold">
            Parental Controls & Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}

