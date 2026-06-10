import { getTopics, getSessionHistory } from '../actions/user';
import Link from 'next/link';

export default async function ParentDashboard() {
  const topics = await getTopics();
  const sessions = await getSessionHistory();

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/50 to-indigo-50/70 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white/95 p-6 rounded-2xl border-2 border-teal-100 shadow-sm">
          <h1 className="text-3xl font-extrabold text-teal-800">Parent Dashboard 📈</h1>
          <Link href="/" className="text-teal-700 font-extrabold hover:underline">
            Back to Tutor
          </Link>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white/95 text-slate-900 p-6 rounded-2xl border-2 border-teal-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Topic Mastery</h2>
            <div className="space-y-4">
              {topics.map((t: { id: string; name: string; masteryLevel: number }) => (
                <div key={t.id} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>{t.name}</span>
                    <span>{Math.round(t.masteryLevel * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-teal-500 h-2 rounded-full transition-all" 
                      style={{ width: `${t.masteryLevel * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

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
      </div>
    </main>
  );
}
