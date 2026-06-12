'use server';

import prisma from '@/lib/prisma';
import { getUser } from './user';
import { revalidatePath } from 'next/cache';

export async function getRewards() {
  const user = await getUser();
  if (!user) return [];

  // Always recalculate progress on fetch to ensure it's up to date!
  await recalculateRewardProgress(user.id);

  return await prisma.reward.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createReward(data: {
  title: string;
  targetType: string;
  targetValue: number;
}) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  const reward = await prisma.reward.create({
    data: {
      userId: user.id,
      title: data.title,
      targetType: data.targetType,
      targetValue: data.targetValue,
      currentValue: 0,
      unlocked: false,
    }
  });

  await recalculateRewardProgress(user.id);

  revalidatePath('/');
  revalidatePath('/parent');
  return reward;
}

export async function deleteReward(rewardId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  await prisma.reward.delete({
    where: { id: rewardId }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function claimReward(rewardId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  await prisma.reward.update({
    where: { id: rewardId },
    data: { claimed: true }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function requestTaskApproval(rewardId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  await prisma.reward.update({
    where: { id: rewardId },
    data: { pendingApproval: true }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function approveTaskProgress(rewardId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) throw new Error("Reward not found");

  const newVal = Math.min(reward.targetValue, reward.currentValue + 1);
  const isUnlockedNow = newVal >= reward.targetValue;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    currentValue: newVal,
    pendingApproval: false,
  };

  if (isUnlockedNow && !reward.unlocked) {
    updateData.unlocked = true;
    updateData.unlockedAt = new Date();
  }

  await prisma.reward.update({
    where: { id: rewardId },
    data: updateData
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function rejectTaskApproval(rewardId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user logged in");

  await prisma.reward.update({
    where: { id: rewardId },
    data: { pendingApproval: false }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function recalculateRewardProgress(userId: string) {
  const rewards = await prisma.reward.findMany({
    where: { userId, claimed: false }
  });

  if (rewards.length === 0) return;

  // Gather stats
  const correctCount = await prisma.questionHistory.count({
    where: {
      topic: { userId },
      isCorrect: true
    }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  const currentStreak = user?.currentStreak || 0;

  const sprintsCount = await prisma.session.count({
    where: { userId }
  });

  const masteredCount = await prisma.topic.count({
    where: { userId, masteryLevel: { gte: 0.8 } }
  });

  const totalDuration = await prisma.session.aggregate({
    where: { userId },
    _sum: { duration: true }
  });
  const timeSpentMinutes = Math.round((totalDuration._sum.duration || 0) / 60);

  const maxScore = await prisma.session.aggregate({
    where: { userId },
    _max: { score: true }
  });
  const highScore = maxScore._max.score || 0;

  for (const reward of rewards) {
    let currentVal = 0;
    switch (reward.targetType) {
      case 'QUESTIONS_ANSWERED':
        currentVal = correctCount;
        break;
      case 'STREAK':
        currentVal = currentStreak;
        break;
      case 'SPRINTS_COMPLETED':
        currentVal = sprintsCount;
        break;
      case 'TOPICS_MASTERED':
        currentVal = masteredCount;
        break;
      case 'TIME_SPENT':
        currentVal = timeSpentMinutes;
        break;
      case 'HIGH_SCORE':
        currentVal = highScore;
        break;
      case 'CUSTOM_TASK':
        currentVal = reward.currentValue;
        break;
      default:
        currentVal = 0;
    }

    const isUnlockedNow = currentVal >= reward.targetValue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      currentValue: currentVal,
    };

    if (isUnlockedNow && !reward.unlocked) {
      updateData.unlocked = true;
      updateData.unlockedAt = new Date();
    }

    await prisma.reward.update({
      where: { id: reward.id },
      data: updateData
    });
  }
}
