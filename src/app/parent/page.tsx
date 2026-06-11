import { getTopics, getSessionHistory, getUser } from '../actions/user';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/EditProfileForm';
import TopicMasteryManager from '@/components/TopicMasteryManager';
import RecentSprints from '@/components/RecentSprints';

export default async function ParentDashboard() {
  const user = await getUser();
  if (!user) {
    redirect('/');
  }

  const topics = await getTopics();
  const sessions = await getSessionHistory();

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/70 to-indigo-50/70 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white/95 p-6 rounded-2xl border-2 border-teal-100 shadow-sm">
          <h1 className="text-3xl font-extrabold text-teal-800">
            Parent Dashboard: {user.name} 📈
          </h1>
          <Link href="/" className="text-teal-700 font-extrabold hover:underline">
            Back to Tutor
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <TopicMasteryManager initialTopics={topics} />

            <section className="bg-white/95 text-slate-900 p-6 rounded-2xl border-2 border-teal-100 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-800 font-extrabold text-teal-900">Recent Sprints</h2>
              <RecentSprints sessions={sessions} />
            </section>
          </div>

          <div className="md:col-span-1">
            <EditProfileForm user={user} />
          </div>
        </div>
      </div>
    </main>
  );
}
