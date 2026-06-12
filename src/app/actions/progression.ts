'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { diagnoseError } from '@/lib/ai';
import { getUser } from './user';
import { recalculateRewardProgress } from './rewards';

export async function logQuestionResult(
  topicName: string, 
  isCorrect: boolean, 
  timeTaken: number,
  questionText: string,
  userAnswer: string,
  correctAnswer: string
) {
  const user = await getUser();
  if (!user) return;

  const topic = await prisma.topic.findUnique({ 
    where: { 
      name_yearGroup_userId: {
        name: topicName,
        yearGroup: user.yearGroup,
        userId: user.id
      }
    },
    include: {
      questionHistory: {
        orderBy: { answeredAt: 'desc' },
        take: 5 // Take 5 to evaluate longer streaks
      }
    }
  });
  
  if (!topic) return;

  // Simple SRS Logic
  let newMastery = topic.masteryLevel;
  const nextReview = new Date();
  let newDifficulty = topic.difficultyLevel;
  let misconception = null;
  let advice = null;

  // Calculate current streak from history (exclude current answer which isn't in DB yet)
  const history = topic.questionHistory;
  let consecutiveCorrect = 0;
  for (const record of history) {
    if (record.isCorrect) {
      consecutiveCorrect++;
    } else {
      break;
    }
  }

  if (isCorrect) {
    newMastery = Math.min(1.0, newMastery + 0.1);
    const daysToAdd = Math.ceil(newMastery * 14);
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    // --- ACCELERATED DIFFICULTY SCALING ---
    consecutiveCorrect += 1; // Include the current correct answer
    
    // 1. Speed Bonus: If answered under 15 seconds, jump +2 difficulty
    const isVeryFast = timeTaken < 15;
    
    if (isVeryFast && newDifficulty <= 8) {
      newDifficulty += 2;
    } 
    // 2. Streak Bonus: Bigger jumps for sustained streaks
    else if (consecutiveCorrect >= 5 && newDifficulty <= 7) {
      newDifficulty += 3; // Fast track to advanced
    } else if (consecutiveCorrect >= 3 && newDifficulty <= 8) {
      newDifficulty += 2;
    } else if (consecutiveCorrect >= 2 && newDifficulty < 10) {
      newDifficulty += 1;
    }
    
    // Ensure capped at 10
    newDifficulty = Math.min(10, newDifficulty);

    // --- CROSS-TOPIC LEVELING ---
    // If the child is mastering this topic, pull up the floor of other topics
    if (newDifficulty >= 5) {
      const minDifficultyFloor = Math.max(3, newDifficulty - 2);
      await prisma.topic.updateMany({
        where: {
          yearGroup: user.yearGroup,
          userId: user.id,
          difficultyLevel: { lt: minDifficultyFloor }
        },
        data: {
          difficultyLevel: minDifficultyFloor
        }
      });
    }
  } else {
    newMastery = Math.max(0.0, newMastery - 0.15);
    nextReview.setDate(nextReview.getDate() + 1);

    // --- TYPO & MISTAKE PROTECTION ---
    // Only decrease difficulty if they failed twice in a row, or if they took a long time (struggling)
    const lastAnswerWasIncorrect = history.length > 0 && !history[0].isCorrect;
    const isStruggling = timeTaken > 45 || lastAnswerWasIncorrect;

    if (isStruggling && newDifficulty > 1) {
      newDifficulty -= 1;
    }

    // BACKLOG: Error Type Analysis
    if (!isCorrect) {
      try {
        const cookieStore = await cookies();
        const headersList = await headers();
        const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';
        const diagnosis = await diagnoseError(questionText, userAnswer, correctAnswer, user.yearGroup, isTestMode);
        misconception = diagnosis.misconception;
        advice = diagnosis.advice;
      } catch (e) {
        console.error("Diagnosis failed:", e);
      }
    }
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: {
      masteryLevel: newMastery,
      nextReviewDate: nextReview,
      difficultyLevel: newDifficulty,
      questionHistory: {
        create: {
          isCorrect,
          timeTaken,
          questionText,
          userAnswer,
          correctAnswer,
          misconception,
          advice
        },
      },
    },
  });

  await recalculateRewardProgress(user.id);
}

export async function finishSession(score: number, duration: number) {
  const user = await getUser();
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastSprint = user.lastSprintDate ? new Date(user.lastSprintDate) : null;
  if (lastSprint) lastSprint.setHours(0, 0, 0, 0);

  let newStreak = user.currentStreak;

  // Always record the completed session to history
  await prisma.session.create({
    data: {
      userId: user.id,
      score,
      duration,
    },
  });
  
  if (!lastSprint || lastSprint.getTime() < today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastSprint && lastSprint.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: newStreak,
        lastSprintDate: today,
      },
    });
  }

  await recalculateRewardProgress(user.id);
  revalidatePath('/');
}
