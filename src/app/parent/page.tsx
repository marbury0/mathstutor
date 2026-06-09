import { getTopics, getSessionHistory } from '../actions/user';
import Link from 'next/link';

export default async function ParentDashboard() {
  const topics = await getTopics();
  const sessions = await getSessionHistory();

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard 📈</h1>
          <Link href="/" className="text-blue-500 font-bold hover:underline">
            Back to Tutor
          </Link>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-700">Topic Mastery</h2>
            <div className="space-y-4">
              {topics.map((t: { id: string; name: string; masteryLevel: number }) => (
                <div key={t.id} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{t.name}</span>
                    <span>{Math.round(t.masteryLevel * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${t.masteryLevel * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-700">Recent Sprints</h2>
            <div className="space-y-4">
              {sessions.length === 0 && <p className="text-gray-500 italic">No sessions recorded yet.</p>}
              {sessions.map((s: { id: string; date: Date; duration: number; score: number }) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-bold">{new Date(s.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{Math.floor(s.duration / 60)} mins</div>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
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
