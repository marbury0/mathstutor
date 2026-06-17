'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUser } from './user';
import { generateWeeklyInsights } from '@/lib/ai';

export async function getUTCWeekRange(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
  
  return { start, end };
}

export interface WeekRangeInfo {
  weekStart: string; // ISO string
  weekEnd: string;   // ISO string
  hasInsight: boolean;
}

export async function getWeekRangesWithData(): Promise<WeekRangeInfo[]> {
  const user = await getUser();
  if (!user) return [];

  // Query all sessions for this user
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
  });

  // Query all existing weekly insights
  const existingInsights = await prisma.weeklyInsight.findMany({
    where: { userId: user.id },
    orderBy: { weekStart: 'asc' },
  });

  const weeksMap = new Map<string, { weekStart: Date; weekEnd: Date; hasInsight: boolean }>();

  // Add existing insights first
  for (const insight of existingInsights) {
    const key = insight.weekStart.toISOString();
    weeksMap.set(key, {
      weekStart: insight.weekStart,
      weekEnd: insight.weekEnd,
      hasInsight: true,
    });
  }

  // Add weeks that have session data
  for (const session of sessions) {
    const { start, end } = await getUTCWeekRange(session.date);
    const key = start.toISOString();
    if (!weeksMap.has(key)) {
      weeksMap.set(key, {
        weekStart: start,
        weekEnd: end,
        hasInsight: false,
      });
    }
  }

  // Always include the current week if not present, so the user can see/generate it
  const currentWeek = await getUTCWeekRange(new Date());
  const currentKey = currentWeek.start.toISOString();
  if (!weeksMap.has(currentKey)) {
    weeksMap.set(currentKey, {
      weekStart: currentWeek.start,
      weekEnd: currentWeek.end,
      hasInsight: false,
    });
  }

  // Sort weeks descending (most recent first)
  const sortedWeeks = Array.from(weeksMap.values()).sort(
    (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
  );

  return sortedWeeks.map(w => ({
    weekStart: w.weekStart.toISOString(),
    weekEnd: w.weekEnd.toISOString(),
    hasInsight: w.hasInsight,
  }));
}

export async function getWeeklyInsight(weekStartStr: string) {
  const user = await getUser();
  if (!user) return null;

  const weekStart = new Date(weekStartStr);
  return await prisma.weeklyInsight.findUnique({
    where: {
      userId_weekStart: {
        userId: user.id,
        weekStart,
      },
    },
  });
}

export async function generateWeeklyInsightAction(weekStartStr: string, weekEndStr: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const weekStart = new Date(weekStartStr);
  const weekEnd = new Date(weekEndStr);

  // Fetch sessions within the range
  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  // Fetch questions answered within the range
  const questions = await prisma.questionHistory.findMany({
    where: {
      topic: {
        userId: user.id,
      },
      answeredAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      topic: true,
    },
  });

  if (questions.length === 0) {
    throw new Error("No maths questions were answered in this week range. Complete some sprints first!");
  }

  // Calculate metrics
  const totalCount = questions.length;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const accuracy = (correctCount / totalCount) * 100;
  const pointsEarned = sessions.reduce((sum, s) => sum + s.score, 0);
  const studyTime = sessions.reduce((sum, s) => sum + s.duration, 0);

  // Map to format required by generateWeeklyInsights
  const questionsList = questions.map(q => ({
    topic: q.topic.name,
    isCorrect: q.isCorrect,
    questionText: q.questionText || "",
    userAnswer: q.userAnswer || "",
    correctAnswer: q.correctAnswer || "",
    misconception: q.misconception,
    advice: q.advice,
  }));

  const aiInsights = await generateWeeklyInsights(
    {
      name: user.name,
      age: user.age,
      yearGroup: user.yearGroup,
      tutorName: user.tutorName || "Maths Bot",
    },
    {
      questionsCount: totalCount,
      accuracy,
      pointsEarned,
      studyTime,
    },
    questionsList
  );

  const insight = await prisma.weeklyInsight.upsert({
    where: {
      userId_weekStart: {
        userId: user.id,
        weekStart,
      },
    },
    update: {
      accuracy,
      questionsCount: totalCount,
      pointsEarned,
      studyTime,
      aiAnalysis: aiInsights.aiAnalysis,
      recsPlan: aiInsights.recsPlan,
      encouragement: aiInsights.encouragement,
    },
    create: {
      userId: user.id,
      weekStart,
      weekEnd,
      accuracy,
      questionsCount: totalCount,
      pointsEarned,
      studyTime,
      aiAnalysis: aiInsights.aiAnalysis,
      recsPlan: aiInsights.recsPlan,
      encouragement: aiInsights.encouragement,
    },
  });

  revalidatePath('/parent');
  return insight;
}

export async function deleteWeeklyInsightAction(weekStartStr: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const weekStart = new Date(weekStartStr);

  await prisma.weeklyInsight.delete({
    where: {
      userId_weekStart: {
        userId: user.id,
        weekStart,
      },
    },
  });

  revalidatePath('/parent');
  return { success: true };
}

