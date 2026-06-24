'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Timer, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle, 
  Trophy, 
  HeartHandshake, 
  CheckCircle2, 
  Flame,
  ChevronRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface ParentGuideContentProps {
  themeClass: string;
  userYearGroup: number;
}

export default function ParentGuideContent({ themeClass, userYearGroup }: ParentGuideContentProps) {
  // Determine default tab based on child's year group
  let defaultTab = 'general';
  if (userYearGroup === 1 || userYearGroup === 2) defaultTab = 'y1-2';
  else if (userYearGroup === 3 || userYearGroup === 4) defaultTab = 'y3-4';
  else if (userYearGroup === 5 || userYearGroup === 6) defaultTab = 'y5-6';

  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = [
    { id: 'general', label: 'General Guide 📚' },
    { id: 'y1-2', label: 'Year 1–2 (Ages 5–7) 🐣' },
    { id: 'y3-4', label: 'Year 3–4 (Ages 7–9) 🚀' },
    { id: 'y5-6', label: 'Year 5–6 (Ages 9–11) 🎓' },
    { id: 'frustration', label: 'Frustration & Resistance 💔' },
  ];

  return (
    <div className={themeClass}>
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex items-center gap-4 bg-theme-card p-6 rounded-2xl border-2 border-theme-border shadow-sm">
            <Link 
              href="/parent" 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-title">
                Parent Guide & Advice 📚
              </h1>
              <p className="text-slate-500 text-sm">
                Pedagogical guidance and tips tailored for your child&apos;s stage of learning.
              </p>
            </div>
          </header>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-theme-border/60 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-theme-card hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GENERAL GUIDE */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Section 1: Weekly Sprints Schedule */}
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-bg rounded-2xl border border-primary/20">
                    <Timer className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">General Recommendations</h2>
                </div>
                
                <p className="text-slate-600 leading-relaxed font-medium">
                  The core philosophy of the Maths Tutor is <span className="text-primary font-bold">&quot;little and often.&quot;</span> Regular, shorter sessions build stronger memory pathways and prevent maths fatigue.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-2">
                    <div className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Frequency</div>
                    <div className="text-xl font-bold text-slate-800">3 to 5 days / week</div>
                    <div className="text-xs text-slate-500">Regular habits are much more effective than single weekend study blocks.</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-2">
                    <div className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Rest Days</div>
                    <div className="text-xl font-bold text-slate-800">2 to 3 rest days</div>
                    <div className="text-xs text-slate-500">Crucial for recovery, assimilation of rules, and preventing screen fatigue.</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-2">
                    <div className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Time Limit</div>
                    <div className="text-xl font-bold text-slate-800">Adaptive Limits</div>
                    <div className="text-xs text-slate-500">Shorter sprints (5–10 mins) for younger kids, longer (15–20 mins) for older kids.</div>
                  </div>
                </div>

                <div className="bg-primary-bg/50 p-5 rounded-2xl border border-primary/20 flex gap-4">
                  <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                    <strong className="text-primary">Tip:</strong> Sleeping between study sessions helps the brain compile new maths logic. Try to avoid doing sprints right before bed, as screen time can interfere with restful sleep.
                  </p>
                </div>
              </section>

              {/* Section 2: Handling Skipping */}
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-secondary-bg rounded-2xl border border-secondary/20">
                    <HelpCircle className="w-6 h-6 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">Handling Skipping & Speed-Running</h2>
                </div>

                <p className="text-slate-600 leading-relaxed font-medium">
                  When a child gets stuck, they might submit wrong answers twice just to bypass a problem. Here is how the system responds and how you can manage this:
                </p>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" /> Automatic Downward Calibration
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    If a child fails a question twice (or takes a long time), the app flags them as struggling. It decreases the topic&apos;s difficulty level (usually by 1) and schedules it to reappear tomorrow. 
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    While this difficulty drop is helpful, doing it repeatedly (speed-running) will push the tutor into serving tasks that are far below their level, resulting in boredom later.
                  </p>
                </div>

                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 flex gap-4">
                  <Flame className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-rose-950 text-sm">Aligning Incentives</h4>
                    <p className="text-xs text-rose-900 leading-relaxed font-semibold">
                      If you set goals based only on **Sprints Completed** (like the Weekend TV goal), children are incentivized to finish quickly by skipping. Balance this by setting secondary goals for **Accuracy** or **Streaks** (like getting 3 correct answers in a row).
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: YEAR 1-2 */}
          {activeTab === 'y1-2' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200">
                    <GraduationCap className="w-6 h-6 text-teal-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">Year 1–2 (Ages 5–7) Guidance</h2>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Recommended Sprint Duration</h3>
                    <p className="text-slate-600 text-sm font-medium">**5 minutes per session** (Maximum 10 minutes). Their attention span is short, and fatigue sets in rapidly.</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Focus Areas at this Stage</h3>
                    <p className="text-slate-600 text-sm font-medium">Place value (tens and ones), basic addition & subtraction, reading analog clock times to hours/half-hours, identifying simple 2D and 3D shapes.</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-primary" /> Key Support Strategies for Parents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" /> Co-Regulation is Key
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        At this age, children need your physical presence. Sit with them, read the questions aloud, and celebrate correct answers together. Avoid letting them practice completely unsupervised.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" /> Use Real-World Objects
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        If they struggle with subtraction or grouping, bring in physical objects (like Lego bricks, pasta shapes, or coins) to help them count and manipulate quantities next to the screen.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" /> Use the Visual Emojis
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        The tutor generates dynamic emoji hints for Year 1–2 (e.g. 🍎🍎 + 🍎 = ?). Point these out to your child and count the emojis together to find the answer.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" /> Treat Mistakes as Play
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Children at this stage can be highly sensitive to incorrect feedback. Keep the tone warm and humorous. Say things like, &quot;Whoops, let&apos;s see what the silly robot says instead!&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: YEAR 3-4 */}
          {activeTab === 'y3-4' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">Year 3–4 (Ages 7–9) Guidance</h2>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-secondary pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Recommended Sprint Duration</h3>
                    <p className="text-slate-600 text-sm font-medium">**10 minutes per session** (Up to 15 minutes). This balances focus and skill development.</p>
                  </div>
                  <div className="border-l-4 border-secondary pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Focus Areas at this Stage</h3>
                    <p className="text-slate-600 text-sm font-medium">Multiplication tables up to 12×12, simple fractions, telling the time to minutes, columns for addition/subtraction, reading measurements (kg, ml, cm).</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-secondary" /> Key Support Strategies for Parents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" /> Foster Independent Reading
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Encourage them to read the questions on their own. If they ask for help, don&apos;t give them the answer; instead, ask them to explain the problem to you in their own words.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" /> Guide Mistakes to Hints
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        If they fail their first attempt, the tutor gives a short hint. Encourage them to read the hint out loud. This teaches them to self-correct rather than guess blindly on their second try.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" /> Anchor Times Tables
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Multiplication table recall is crucial in Year 4. If they struggle with divisions or larger fractions, review their times tables separately with card games or chants.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" /> Set Streak Goals
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Children at this stage love gamification. Try setting a small reward for a correct answer streak of 3 or 5. This slows down their pace and encourages precision.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: YEAR 5-6 */}
          {activeTab === 'y5-6' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-250">
                    <GraduationCap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">Year 5–6 (Ages 9–11) Guidance</h2>
                </div>

                <div className="space-y-4">
                  <div className="border-l-4 border-yellow-500 pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Recommended Sprint Duration</h3>
                    <p className="text-slate-600 text-sm font-medium">**15 to 20 minutes per session** (Neve is currently configured for 20 minutes). This builds concentration levels needed for secondary school.</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4 py-1 space-y-1">
                    <h3 className="font-bold text-slate-800">Focus Areas at this Stage</h3>
                    <p className="text-slate-600 text-sm font-medium">Decimals, percentages, equivalent fractions, area & perimeter of composite shapes, multi-step word problems, coordinates, converting units.</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-yellow-600" /> Key Support Strategies for Parents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-yellow-600" /> Tackle Math Anxiety Directly
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Year 5-6 concepts can feel intimidating. If they encounter a topic they don&apos;t know, they will skip it. Reframe incorrect answers: explain that getting a question wrong is the only way to unlock the step-by-step tutorial.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-yellow-600" /> Read Explanations Together
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        If they fail a question twice, sit down and click &quot;Explain in another way!&quot; (powered by AI). Have them read the alternative explanation and show you how to do it. Teaching you is a highly effective way to solidify their understanding.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-yellow-600" /> Emphasize Working Out on Paper
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Year 5-6 word problems and area calculations are very difficult to solve purely in one&apos;s head. Keep a notepad and pencil next to the computer. Encourage them to draw shapes and write intermediate numbers down.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-yellow-600" /> Structure Weekly Rewards
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Set up a parent-approved goal (like Neve&apos;s Weekend TV goal) that tracks sprints completed across the week. Consistency is key, and clear milestones keep them motivated.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: FRUSTRATION & RESISTANCE */}
          {activeTab === 'frustration' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <section className="bg-theme-card text-slate-900 p-8 rounded-3xl border-2 border-theme-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                    <HeartHandshake className="w-6 h-6 text-rose-600 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-theme-title">Handling Frustration & Resistance</h2>
                </div>

                <p className="text-slate-600 leading-relaxed font-medium">
                  It is completely normal for children to feel overwhelmed, cross, or emotional when learning maths. When this happens, it is often a sign of maths anxiety rather than misbehavior. Here is how to navigate these moments:
                </p>

                <div className="space-y-6">
                  {/* Point 1 */}
                  <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">Recognize the &quot;Amygdala Hijack&quot;</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        When a child gets cross or upset, their brain enters a fight-or-flight threat response. The logical, calculations-based parts of their brain literally go offline. **Trying to force them to &quot;slow down and walk through the working&quot; in this state is biochemically impossible for them.**
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed font-semibold text-rose-700">
                        <strong>Action:</strong> Immediately hit the <strong>Pause</strong> button or close the app. Never force a crying or angry child to push through. Let them calm down first.
                      </p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex gap-4">
                    <Timer className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">The 3-Minute Win (Lowering the Bar)</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        If a child resists starting because they anticipate a battle, shorten the sessions. Go to their profile settings and set the sprint duration to **3 minutes (Quick Test)** or **5 minutes**.
                      </p>
                      <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                        <strong>Why:</strong> Completing a short, easy 3-minute session without tears builds a memory of success. Success builds confidence, which naturally reduces resistance next time.
                      </p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex gap-4">
                    <BookOpen className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">Be their &quot;Scribe&quot; to Reduce Load</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        Tackling a sprint requires multiple cognitive tasks: reading the text, understanding the question, calculating, typing on the keyboard, and fighting the timer. This is highly stressful.
                      </p>
                      <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                        <strong>Action:</strong> Sit with them and say: *&quot;You tell me what to do, and I will do the writing and typing.&quot;* You handle the screen while they think out loud, removing the physical pressure.
                      </p>
                    </div>
                  </div>

                  {/* Point 4 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex gap-4">
                    <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">Pair with a Low-Friction Routine</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        Needing constant reminders to do sessions creates a nagging dynamic. Shift the responsibility by creating a regular &quot;after-habit&quot; anchor.
                      </p>
                      <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                        <strong>Action:</strong> Pair it with something they already do or look forward to (e.g. *&quot;After breakfast, we do our 5-minute math sprint, and then we have 30 minutes of tablet time/go to the park.&quot;*). Once it is part of the morning/afternoon flow, reminders are rarely needed.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Back Button Footer */}
          <footer className="text-center">
            <Link 
              href="/parent"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-8 rounded-2xl shadow-lg transition-transform active:scale-95 text-base"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Parent Dashboard
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
