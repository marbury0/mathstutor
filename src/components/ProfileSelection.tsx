'use client';

import { useState, useEffect } from 'react';
import { switchUser, startNewProfileOnboarding } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import { UserPlus, Sparkles, GraduationCap } from 'lucide-react';

interface User {
  id: string;
  name: string;
  currentStreak: number;
  yearGroup?: number;
  avatar?: string;
  tutorName?: string;
}

export default function ProfileSelection({ allUsers }: { allUsers: User[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSelectUser = async (userId: string) => {
    setIsPending(true);
    try {
      await switchUser(userId);
      window.location.href = '/';
    } catch (err) {
      setIsPending(false);
      console.error(err);
    }
  };

  const handleCreateProfile = async () => {
    setIsPending(true);
    try {
      await startNewProfileOnboarding();
      window.location.href = '/';
    } catch (err) {
      setIsPending(false);
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 text-center">
      <header className="space-y-4">
        <div className="inline-flex p-3 bg-teal-50 rounded-full border border-teal-200 animate-bounce">
          <GraduationCap className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-teal-900 tracking-tight flex items-center justify-center gap-2">
          Who is learning today?
          <Sparkles className="w-8 h-8 text-yellow-500 fill-yellow-400 animate-pulse" />
        </h1>
        <p className="text-xl text-slate-700 font-medium max-w-md mx-auto">
          Choose your profile to jump back into your maths adventure!
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-4">
        {allUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => handleSelectUser(u.id)}
            disabled={isPending || !hydrated}
            className="group relative bg-white/95 backdrop-blur-sm p-8 rounded-3xl border-4 border-teal-100 hover:border-teal-400 hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-center text-center space-y-4 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:opacity-50"
          >
            {/* Avatar container */}
            <div className="w-24 h-24 bg-teal-50 rounded-full border-2 border-teal-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
              {u.avatar || '🐱'}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-teal-700 transition-colors">
                {u.name}
              </h3>
              <p className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100/50 inline-block">
                Year {u.yearGroup || 1}
              </p>
            </div>

            {u.currentStreak > 0 && (
              <div className="absolute top-2 right-4 text-sm font-extrabold text-orange-600 flex items-center gap-1">
                🔥 {u.currentStreak}d
              </div>
            )}
          </button>
        ))}

        {/* Add profile card */}
        <button
          onClick={handleCreateProfile}
          disabled={isPending || !hydrated}
          className="group bg-slate-50/80 hover:bg-white p-8 rounded-3xl border-4 border-dashed border-slate-300 hover:border-teal-400 hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-center text-center space-y-4 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:opacity-50 min-h-[250px]"
        >
          <div className="w-24 h-24 bg-slate-100 group-hover:bg-teal-50 rounded-full border-2 border-dashed border-slate-300 group-hover:border-teal-200 flex items-center justify-center text-slate-500 group-hover:text-teal-600 transition-all duration-300">
            <UserPlus className="w-10 h-10" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-600 group-hover:text-teal-700 transition-colors">
              Add Profile
            </h3>
            <p className="text-sm font-medium text-slate-500">
              Create a new maths tutor journey
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
