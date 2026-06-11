import { getTopics, getSessionHistory, getUser } from '../actions/user';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/EditProfileForm';
import TopicMasteryManager from '@/components/TopicMasteryManager';

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
              <h2 className="text-xl font-bold text-slate-800">Recent Sprints</h2>
              <div className="space-y-4">
                {sessions.length === 0 && <p className="text-slate-600 italic">No sessions recorded yet.</p>}
                {sessions.map((s: { id: string; date: Date; duration: number; score: number }) => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-lg border border-teal-50">
                    <div>
                      <div className="font-bold text-slate-800">{new Date(s.date).toLocaleDateString()}</div>
                      <div className="text-sm text-slate-600 font-medium">{Math.floor(s.duration / 60)} mins</div>
                    </div>
                    <div className="text-xl font-bold text-teal-600">
                      {s.score} pts
                    </div>
                  </div>
                ))}
              </div>
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
