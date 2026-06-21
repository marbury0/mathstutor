'use client';

import { useState, useTransition } from 'react';
import { createReward, deleteReward, claimReward, approveTaskProgress, rejectTaskApproval } from '@/app/actions/rewards';
import { Trophy, Plus, Trash2, CheckCircle2, Flame, Zap, BarChart2, Star, Clock, BookOpen, AlertCircle } from 'lucide-react';

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

export default function ParentRewardsManager({ initialRewards }: { initialRewards: Reward[] }) {
  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState('QUESTIONS_ANSWERED');
  const [targetValue, setTargetValue] = useState(10);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const metricOptions = [
    { value: 'QUESTIONS_ANSWERED', label: 'Correct Questions Answered', icon: CheckCircle2, unit: 'questions' },
    { value: 'STREAK', label: 'Streak Days', icon: Flame, unit: 'days' },
    { value: 'SPRINTS_COMPLETED', label: 'Sprints Completed', icon: Zap, unit: 'sprints' },
    { value: 'TOPICS_MASTERED', label: 'Topics Mastered (80%+)', icon: Trophy, unit: 'topics' },
    { value: 'TIME_SPENT', label: 'Total Sprint Time (Minutes)', icon: Clock, unit: 'minutes' },
    { value: 'HIGH_SCORE', label: 'Sprint High Score', icon: Star, unit: 'points' },
    { value: 'CUSTOM_TASK', label: 'Outside Activity / Task (Tidying room, practicing, etc.)', icon: BookOpen, unit: 'times' },
  ];

  const currentOption = metricOptions.find(opt => opt.value === targetType) || metricOptions[0];

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    if (targetValue <= 0) {
      setError('Target value must be greater than 0.');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createReward({
          title: trimmedTitle,
          targetType,
          targetValue: Number(targetValue),
        });
        setTitle('');
        setTargetValue(10);
      } catch (err) {
        console.error(err);
        setError('Failed to create reward. Please try again.');
      }
    });
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward goal?')) return;
    startTransition(async () => {
      try {
        await deleteReward(id);
      } catch (err) {
        console.error(err);
        setError('Failed to delete reward.');
      }
    });
  };

  const handleClaimReward = async (id: string) => {
    startTransition(async () => {
      try {
        await claimReward(id);
      } catch (err) {
        console.error(err);
        setError('Failed to claim reward.');
      }
    });
  };

  const handleApproveProgress = async (id: string) => {
    startTransition(async () => {
      try {
        await approveTaskProgress(id);
      } catch (err) {
        console.error(err);
        setError('Failed to approve progress.');
      }
    });
  };

  const handleRejectApproval = async (id: string) => {
    startTransition(async () => {
      try {
        await rejectTaskApproval(id);
      } catch (err) {
        console.error(err);
        setError('Failed to clear approval request.');
      }
    });
  };

  return (
    <section className="bg-theme-card text-slate-900 p-6 rounded-2xl border-2 border-theme-border shadow-sm space-y-6">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-400" />
        <h2 className="text-xl font-extrabold text-theme-title">Parent-Set Rewards</h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-bold text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Reward Form */}
      <form onSubmit={handleAddReward} className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-700">Set a New Reward Goal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Reward Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 mins Screen Time, Practice Piano"
              className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-900 bg-white text-sm font-medium"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Based On Metric</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-900 bg-white text-sm font-semibold cursor-pointer"
              disabled={isPending}
            >
              {metricOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="w-32">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Target Value</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-slate-900 bg-white text-sm font-bold text-center"
              min="1"
              required
              disabled={isPending}
            />
          </div>
          <div className="flex-1 text-xs text-slate-500 font-medium mb-3 italic">
            Child must achieve {targetValue} {currentOption.unit} to unlock this reward.
          </div>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="bg-primary hover:bg-primary-hover text-white disabled:opacity-50 font-bold py-2.5 px-4 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Reward
          </button>
        </div>
      </form>

      {/* Rewards List */}
      <div className="space-y-4">
        {(() => {
          const activeRewards = initialRewards.filter((r) => !r.claimed);
          const archivedRewards = initialRewards.filter((r) => r.claimed);

          return (
            <>
              <h3 className="text-sm font-extrabold text-slate-700">
                Active Reward Goals ({activeRewards.length})
              </h3>
              {activeRewards.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/20 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-sm">
                  No active rewards. Use the form above to motivate your child!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRewards.map((reward) => {
                    const option =
                      metricOptions.find((opt) => opt.value === reward.targetType) ||
                      metricOptions[0];
                    const Icon = option.icon;
                    const percentage = Math.min(
                      100,
                      Math.round((reward.currentValue / reward.targetValue) * 100)
                    );

                    return (
                      <div key={reward.id} className="space-y-2">
                        <div
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                            reward.unlocked
                              ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-350'
                          }`}
                        >
                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex items-start md:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-base flex flex-wrap items-center gap-1.5">
                                  {reward.title}
                                  {reward.unlocked && (
                                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-bounce">
                                      Unlocked! 🌟
                                    </span>
                                  )}
                                  {reward.pendingApproval && !reward.unlocked && (
                                    <span className="bg-yellow-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Needs Check
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    Goal: {reward.targetValue} {option.unit} ({option.label})
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-xs font-bold text-slate-700 whitespace-nowrap">
                                {reward.currentValue} / {reward.targetValue} ({percentage}%)
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  reward.unlocked ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            {reward.targetType === 'CUSTOM_TASK' && !reward.unlocked && (
                              <button
                                onClick={() => handleApproveProgress(reward.id)}
                                disabled={isPending}
                                className="bg-primary-bg hover:bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-xl border border-primary/20 transition-all cursor-pointer shadow-sm"
                                title="Add 1 Progress Manually"
                              >
                                +1 Progress
                              </button>
                            )}
                            {reward.unlocked && (
                              <button
                                onClick={() => handleClaimReward(reward.id)}
                                disabled={isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md hover:scale-[1.02] active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Mark Claimed
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReward(reward.id)}
                              disabled={isPending}
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>

                        {/* Pending Approval Panel */}
                        {reward.pendingApproval && !reward.unlocked && (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 animate-in slide-in-from-top-2">
                            <div className="text-xs font-bold text-yellow-800 flex items-center gap-1.5">
                              <AlertCircle className="w-4.5 h-4.5 text-yellow-600 fill-yellow-100" />
                              <span>Child marked this task as done and requested a progress check!</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveProgress(reward.id)}
                                disabled={isPending}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow cursor-pointer transition-all hover:scale-[1.01]"
                              >
                                Confirm (+1 Progress)
                              </button>
                              <button
                                onClick={() => handleRejectApproval(reward.id)}
                                disabled={isPending}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                Ignore
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Archived Rewards Toggle & List */}
              <div className="pt-4 border-t border-slate-200 space-y-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{showArchived ? '▼' : '▶'} Archived & Claimed Rewards ({archivedRewards.length})</span>
                </button>

                {showArchived && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    {archivedRewards.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/20 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-sm">
                        No claimed rewards yet.
                      </div>
                    ) : (
                      archivedRewards.map((reward) => {
                        const option =
                          metricOptions.find((opt) => opt.value === reward.targetType) ||
                          metricOptions[0];
                        const Icon = option.icon;
                        const percentage = Math.min(
                          100,
                          Math.round((reward.currentValue / reward.targetValue) * 100)
                        );

                        return (
                          <div key={reward.id} className="space-y-2">
                            <div
                              className="p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border-slate-200 opacity-70"
                            >
                              <div className="flex-1 space-y-2 w-full">
                                <div className="flex items-start md:items-center justify-between gap-2">
                                  <div>
                                    <h4 className="font-extrabold text-slate-700 text-base flex flex-wrap items-center gap-1.5 line-through">
                                      {reward.title}
                                      <span className="bg-slate-200 text-slate-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider no-underline">
                                        Claimed
                                      </span>
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        Goal: {reward.targetValue} {option.unit} ({option.label})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs font-bold text-slate-650 whitespace-nowrap">
                                    {reward.currentValue} / {reward.targetValue} ({percentage}%)
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500 bg-slate-400"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-center">
                                <button
                                  onClick={() => handleDeleteReward(reward.id)}
                                  disabled={isPending}
                                  className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Delete Goal"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}
