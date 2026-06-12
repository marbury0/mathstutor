'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  getWeekRangesWithData, 
  getWeeklyInsight, 
  generateWeeklyInsightAction,
  deleteWeeklyInsightAction,
  WeekRangeInfo
} from '@/app/actions/insights';
import { 
  Brain, 
  Target, 
  Award, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Trophy, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Share2,
  Trash2
} from 'lucide-react';

interface WeeklyInsight {
  id: string;
  userId: string;
  weekStart: Date | string;
  weekEnd: Date | string;
  accuracy: number;
  questionsCount: number;
  pointsEarned: number;
  studyTime: number;
  aiAnalysis: string;
  recsPlan: string;
  encouragement: string;
  createdAt: Date | string;
}

export default function WeeklyInsights() {
  const [weeks, setWeeks] = useState<WeekRangeInfo[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'plan' | 'kid'>('analysis');
  const [isPending, startTransition] = useTransition();
  const [copySuccess, setCopySuccess] = useState(false);

  // Load week ranges initially
  useEffect(() => {
    async function loadWeeks() {
      try {
        const ranges = await getWeekRangesWithData();
        setWeeks(ranges);
        if (ranges.length > 0) {
          setSelectedWeekStart(ranges[0].weekStart);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load available weeks.");
      }
    }
    loadWeeks();
  }, []);

  // Fetch insight for the selected week
  useEffect(() => {
    if (!selectedWeekStart) return;

    async function loadInsight() {
      setLoading(true);
      setError(null);
      try {
        const data = await getWeeklyInsight(selectedWeekStart);
        setInsight(data as unknown as WeeklyInsight);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch insights for the selected week.");
      } finally {
        setLoading(false);
      }
    }

    loadInsight();
  }, [selectedWeekStart]);

  const activeWeekInfo = weeks.find(w => w.weekStart === selectedWeekStart);

  const handleGenerate = () => {
    if (!activeWeekInfo) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateWeeklyInsightAction(
          activeWeekInfo.weekStart,
          activeWeekInfo.weekEnd
        );
        setInsight(result as unknown as WeeklyInsight);
        
        // Update weeks list state to reflect that this week now has an insight
        setWeeks(prev => prev.map(w => 
          w.weekStart === activeWeekInfo.weekStart ? { ...w, hasInsight: true } : w
        ));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong while generating insights.");
      }
    });
  };

  const handleDelete = () => {
    if (!activeWeekInfo) return;
    if (!confirm("Are you sure you want to delete this weekly report? This will remove the AI analysis and recommendations for this week.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteWeeklyInsightAction(activeWeekInfo.weekStart);
        setInsight(null);
        
        // Update weeks list state to reflect that this week no longer has an insight
        setWeeks(prev => prev.map(w => 
          w.weekStart === activeWeekInfo.weekStart ? { ...w, hasInsight: false } : w
        ));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to delete weekly report.");
      }
    });
  };

  const handleCopyEncouragement = () => {
    if (!insight) return;
    navigator.clipboard.writeText(insight.encouragement);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDateLabel = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Check if it's the current week
    const now = new Date();
    const startOfWeek = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const isCurrentWeek = start.getTime() === startOfWeek.getTime();

    const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    return isCurrentWeek ? `This Week (${startLabel} - ${endLabel})` : `${startLabel} - ${endLabel}`;
  };

  // Helper to parse markdown
  const parseMarkdown = (md: string) => {
    return md.split('\n').map((line, i) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <div key={i} className="h-2" />;

      if (cleanLine.startsWith('###')) {
        return (
          <h4 key={i} className="text-base font-extrabold text-theme-title mt-4 mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="w-4.5 h-4.5 text-primary" /> {renderTextWithBold(cleanLine.replace('###', '').trim())}
          </h4>
        );
      }
      if (cleanLine.startsWith('##')) {
        return (
          <h3 key={i} className="text-lg font-extrabold text-theme-title mt-5 mb-2.5">
            {renderTextWithBold(cleanLine.replace('##', '').trim())}
          </h3>
        );
      }
      if (cleanLine.startsWith('#')) {
        return (
          <h2 key={i} className="text-xl font-black text-theme-title mt-6 mb-3">
            {renderTextWithBold(cleanLine.replace('#', '').trim())}
          </h2>
        );
      }

      if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
        return (
          <li key={i} className="ml-5 list-disc text-sm text-slate-700 leading-relaxed my-1 font-medium">
            {renderTextWithBold(cleanLine.substring(1).trim())}
          </li>
        );
      }

      return (
        <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3 font-medium">
          {renderTextWithBold(cleanLine)}
        </p>
      );
    });
  };

  const renderTextWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <section className="bg-theme-card text-slate-900 p-6 rounded-2xl border-2 border-theme-border shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-extrabold text-theme-title">Weekly AI Insights</h2>
        </div>
        
        {insight && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isPending || loading}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-bold hover:underline cursor-pointer transition-all disabled:opacity-50"
              title="Refresh weekly report"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} /> Update Report
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending || loading}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer transition-all disabled:opacity-50"
              title="Delete weekly report"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Report
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div>{error}</div>
        </div>
      )}

      {/* Week Selector tabs */}
      {weeks.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
          {weeks.map((w) => {
            const isSelected = selectedWeekStart === w.weekStart;
            return (
              <button
                key={w.weekStart}
                onClick={() => setSelectedWeekStart(w.weekStart)}
                className={`py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap border-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-600 border-slate-150 hover:bg-slate-50'
                }`}
              >
                {formatDateLabel(w.weekStart, w.weekEnd)}
                {w.hasInsight && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-2 text-slate-400 text-xs font-medium italic">Loading week lists...</div>
      )}

      {/* Main Container */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-4 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <div className="font-extrabold text-primary animate-pulse text-sm">Loading weekly details...</div>
        </div>
      ) : isPending ? (
        <div className="py-16 flex flex-col items-center justify-center gap-4 text-slate-500 max-w-md mx-auto text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500 fill-yellow-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="font-black text-slate-800 text-base">Gemini is at work! 🪄</div>
            <p className="text-xs text-slate-500 leading-relaxed font-bold animate-pulse">
              Analyzing practice logs, diagnosing misconception categories, and curating home practice recommendations...
            </p>
          </div>
        </div>
      ) : insight ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy</div>
              <div className={`text-2xl font-black mt-1 flex items-center justify-center gap-1 ${
                insight.accuracy >= 80 ? 'text-emerald-600' : insight.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                <TrendingUp className="w-5 h-5" />
                {Math.round(insight.accuracy)}%
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Practice Time</div>
              <div className="text-2xl font-black text-slate-800 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-5 h-5 text-slate-400" />
                {Math.round(insight.studyTime / 60)} min
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sprints Run</div>
              <div className="text-2xl font-black text-primary mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                {insight.questionsCount}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points Earned</div>
              <div className="text-2xl font-black text-secondary mt-1 flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-100" />
                {insight.pointsEarned}
              </div>
            </div>
          </div>

          {/* Interactive tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-150">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-3 px-4 text-xs font-extrabold cursor-pointer border-b-3 transition-all flex items-center gap-1.5 ${
                  activeTab === 'analysis'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Brain className="w-4 h-4" /> Parent Report
              </button>
              <button
                onClick={() => setActiveTab('plan')}
                className={`py-3 px-4 text-xs font-extrabold cursor-pointer border-b-3 transition-all flex items-center gap-1.5 ${
                  activeTab === 'plan'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Target className="w-4 h-4" /> Home Action Plan
              </button>
              <button
                onClick={() => setActiveTab('kid')}
                className={`py-3 px-4 text-xs font-extrabold cursor-pointer border-b-3 transition-all flex items-center gap-1.5 ${
                  activeTab === 'kid'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Award className="w-4 h-4" /> Student Praise Card
              </button>
            </div>

            {/* Tab content displays */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
              {activeTab === 'analysis' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  {parseMarkdown(insight.aiAnalysis)}
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  {parseMarkdown(insight.recsPlan)}
                </div>
              )}

              {activeTab === 'kid' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Tutor Praise Bubble */}
                  <div className="bg-gradient-to-r from-primary-bg to-secondary-bg p-5 rounded-3xl border-2 border-primary/20 relative overflow-hidden shadow-inner">
                    <div className="absolute -right-8 -bottom-8 opacity-15">
                      <Sparkles className="w-28 h-28 text-primary fill-primary-bg" />
                    </div>
                    
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="text-3xl p-2 bg-white rounded-2xl shadow-md border border-primary/10">🐱</div>
                      <div className="space-y-2 flex-1">
                        <div className="text-xs font-black text-primary uppercase tracking-wider">A Special Message from Tutor AI:</div>
                        <blockquote className="text-slate-800 font-extrabold italic text-sm leading-relaxed">
                          &ldquo;{insight.encouragement}&rdquo;
                        </blockquote>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCopyEncouragement}
                      className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-[1.01] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" /> 
                      {copySuccess ? 'Copied! ✅' : 'Copy Message for Child'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Ready to Generate State */
        <div className="bg-slate-50/40 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-5 animate-in fade-in duration-200">
          <div className="p-3.5 bg-primary-bg inline-block rounded-full border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary fill-primary-bg" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-base font-extrabold text-slate-800">Weekly AI Report Ready!</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              We have activity recorded for this week range. Let Gemini compile detailed insights, strengths, and actionable learning advice for you.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-6 rounded-xl text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            Generate Report <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
