import { getTopics, getSessionHistory, getUser } from '../actions/user';
import { getRewards } from '../actions/rewards';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/EditProfileForm';
import TopicMasteryManager from '@/components/TopicMasteryManager';
import RecentSprints from '@/components/RecentSprints';
import ParentRewardsManager from '@/components/ParentRewardsManager';
import WeeklyInsights from '@/components/WeeklyInsights';

export default async function ParentDashboard() {
  const user = await getUser();
  if (!user) {
    redirect('/');
  }

  const topics = await getTopics();
  const sessions = await getSessionHistory();
  const rewards = await getRewards();
  const themeClass = user.theme === 'peach' ? 'theme-peach' : 'theme-ocean';

  return (
    <div className={themeClass}>
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-theme-card p-6 rounded-2xl border-2 border-theme-border shadow-sm">
            <h1 className="text-3xl font-extrabold text-theme-title">
              Parent Dashboard: {user.name} 📈
            </h1>
            <Link href="/" className="text-primary font-extrabold hover:underline">
              Back to Tutor
            </Link>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <ParentRewardsManager initialRewards={rewards} />

              <TopicMasteryManager initialTopics={topics} />

              <WeeklyInsights />

              <section className="bg-theme-card text-slate-900 p-6 rounded-2xl border-2 border-theme-border shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-800 font-extrabold text-theme-title">Recent Sprints</h2>
                <RecentSprints sessions={sessions} />
              </section>

              <section className="bg-theme-card text-slate-900 p-6 rounded-2xl border-2 border-theme-border shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-theme-title font-extrabold">Parent Guide & Advice 📚</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Learn how to set healthy study limits, configure reward incentives, and support your child when they skip or struggle with questions.
                </p>
                <Link 
                  href="/parent/guide" 
                  className="inline-block bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-6 rounded-xl shadow transition-colors cursor-pointer text-sm"
                >
                  Read Parent Guide
                </Link>
              </section>
            </div>

            <div className="md:col-span-1">
              <EditProfileForm user={user} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
