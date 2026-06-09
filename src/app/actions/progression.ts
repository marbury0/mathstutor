'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logQuestionResult(topicName: string, isCorrect: boolean, timeTaken: number) {
  const topic = await prisma.topic.findUnique({ where: { name: topicName } });
  if (!topic) return;

  // Simple SRS Logic
  let newMastery = topic.masteryLevel;
  let nextReview = new Date();

  if (isCorrect) {
    newMastery = Math.min(1.0, newMastery + 0.1);
    // Push review date based on mastery (1 day to 14 days)
    const daysToAdd = Math.ceil(newMastery * 14);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
  } else {
    newMastery = Math.max(0.0, newMastery - 0.15);
    // Review again tomorrow
    nextReview.setDate(nextReview.getDate() + 1);
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: {
      masteryLevel: newMastery,
      nextReviewDate: nextReview,
      questionHistory: {
        create: {
          isCorrect,
          timeTaken,
        },
      },
    },
  });
}

export async function finishSession(score: number, duration: number) {
  const user = await prisma.user.findFirst();
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastSprint = user.lastSprintDate ? new Date(user.lastSprintDate) : null;
  if (lastSprint) lastSprint.setHours(0, 0, 0, 0);

  let newStreak = user.currentStreak;
  
  if (!lastSprint || lastSprint.getTime() < today.getTime()) {
    // Check if it's exactly the next day to increment streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastSprint && lastSprint.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else if (!lastSprint || lastSprint.getTime() < yesterday.getTime()) {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: newStreak,
        lastSprintDate: today,
        sessions: {
          create: {
            score,
            duration,
          },
        },
      },
    });
  }

  revalidatePath('/');
}
