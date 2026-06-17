'use client';

import { useState } from 'react';
import { addCustomTopic, deleteTopic } from '@/app/actions/user';

interface Topic {
  id: string;
  name: string;
  masteryLevel: number;
}

export default function TopicMasteryManager({ initialTopics }: { initialTopics: Topic[] }) {
  const [newTopicName, setNewTopicName] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTopicName.trim();
    if (!name) return;

    setIsMutating(true);
    setError(null);
    try {
      await addCustomTopic(name);
      setNewTopicName('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to add topic.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (topicId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"? This will delete all progress and history for this topic.`)) {
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      await deleteTopic(topicId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete topic.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="bg-theme-card text-slate-900 p-6 rounded-2xl border-2 border-theme-border shadow-sm space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold text-theme-title">Topic Mastery</h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-bold text-xs">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        {initialTopics.length === 0 && (
          <p className="text-sm text-slate-500 italic text-center py-4">No topics found. Add one below!</p>
        )}
        {initialTopics.map((t) => (
          <div key={t.id} className="space-y-1 group relative">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
              <span className="flex items-center gap-2">
                {t.name}
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.name)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 text-slate-400 font-bold text-xs p-1 cursor-pointer transition-opacity"
                  title="Remove Topic"
                  disabled={isMutating}
                >
                  🗑️
                </button>
              </span>
              <span>{Math.round(t.masteryLevel * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${t.masteryLevel * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="border-t pt-4 border-slate-100 space-y-2">
        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">Add Custom Maths Topic</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="flex-1 p-2.5 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-900 bg-white text-sm font-medium"
            placeholder="e.g. Roman Numerals, Long Division..."
            disabled={isMutating}
          />
          <button
            type="submit"
            disabled={isMutating || !newTopicName.trim()}
            className="bg-primary-bg hover:scale-[1.02] text-primary disabled:opacity-50 font-bold px-4 rounded-xl text-sm transition-all cursor-pointer"
          >
            Add Topic
          </button>
        </div>
      </form>
    </section>
  );
}
