import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '@/lib/prisma';
import { createReward, deleteReward, claimReward, recalculateRewardProgress, getRewards } from './rewards';
import { logQuestionResult, finishSession } from './progression';

describe('Rewards Server Actions', () => {
  const testUserId = 'test-user';
  const testTopicName = 'Addition Test';

  beforeEach(async () => {
    // Clean up
    await prisma.reward.deleteMany();
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user
    await prisma.user.create({
      data: {
        id: testUserId,
        name: 'Tim',
        age: 10,
        yearGroup: 6,
        currentStreak: 3, // Initial streak
        hobbies: JSON.stringify(['Gaming']),
        pets: JSON.stringify([]),
      },
    });

    // Create a test topic for user
    await prisma.topic.create({
      data: {
        id: 'test-topic-id',
        userId: testUserId,
        name: testTopicName,
        yearGroup: 6,
        masteryLevel: 0.1,
        difficultyLevel: 3,
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.reward.deleteMany();
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create a reward goal and initialize progress', async () => {
    const reward = await createReward({
      title: 'iPad Time',
      targetType: 'QUESTIONS_ANSWERED',
      targetValue: 5,
    });

    expect(reward).toBeDefined();
    expect(reward.title).toBe('iPad Time');
    expect(reward.targetType).toBe('QUESTIONS_ANSWERED');
    expect(reward.targetValue).toBe(5);
    expect(reward.currentValue).toBe(0);
    expect(reward.unlocked).toBe(false);
  });

  it('should unlock a streak reward based on the user streak', async () => {
    const reward = await createReward({
      title: 'Get Ice Cream',
      targetType: 'STREAK',
      targetValue: 3,
    });

    // Check rewards
    const rewards = await getRewards();
    const streakReward = rewards.find((r) => r.id === reward.id);
    expect(streakReward).toBeDefined();
    expect(streakReward!.currentValue).toBe(3);
    expect(streakReward!.unlocked).toBe(true);
  });

  it('should update correct questions progress and unlock once target is met', async () => {
    const reward = await createReward({
      title: 'Get Lego Set',
      targetType: 'QUESTIONS_ANSWERED',
      targetValue: 2,
    });

    // Answer 1 question correctly
    await logQuestionResult(
      testTopicName,
      true, // isCorrect
      10,   // timeTaken
      'What is 5 + 5?',
      '10', // userAnswer
      '10'  // correctAnswer
    );

    await recalculateRewardProgress(testUserId);
    let rewards = await getRewards();
    let currentReward = rewards.find((r) => r.id === reward.id);
    expect(currentReward!.currentValue).toBe(1);
    expect(currentReward!.unlocked).toBe(false);

    // Answer 2nd question correctly
    await logQuestionResult(
      testTopicName,
      true, // isCorrect
      8,    // timeTaken
      'What is 2 + 3?',
      '5',  // userAnswer
      '5'   // correctAnswer
    );

    await recalculateRewardProgress(testUserId);
    rewards = await getRewards();
    currentReward = rewards.find((r) => r.id === reward.id);
    expect(currentReward!.currentValue).toBe(2);
    expect(currentReward!.unlocked).toBe(true);
  });

  it('should track session-based metrics (sprints, time spent, high score)', async () => {
    // Sprints Completed Reward
    const sprintReward = await createReward({
      title: 'New Game',
      targetType: 'SPRINTS_COMPLETED',
      targetValue: 2,
    });

    // High Score Reward
    const highScoreReward = await createReward({
      title: 'Pocket Money Bonus',
      targetType: 'HIGH_SCORE',
      targetValue: 8,
    });

    // Time Spent Reward (2 minutes)
    const timeSpentReward = await createReward({
      title: 'Park Trip',
      targetType: 'TIME_SPENT',
      targetValue: 2,
    });

    // Finish first session with score 5 and duration 60s
    await finishSession(5, 60);

    let rewards = await getRewards();
    expect(rewards.find((r) => r.id === sprintReward.id)!.currentValue).toBe(1);
    expect(rewards.find((r) => r.id === sprintReward.id)!.unlocked).toBe(false);
    expect(rewards.find((r) => r.id === highScoreReward.id)!.currentValue).toBe(5);
    expect(rewards.find((r) => r.id === highScoreReward.id)!.unlocked).toBe(false);
    expect(rewards.find((r) => r.id === timeSpentReward.id)!.currentValue).toBe(1); // 1 minute (60s / 60)

    // Finish second session with score 9 and duration 70s
    await finishSession(9, 70);

    rewards = await getRewards();
    expect(rewards.find((r) => r.id === sprintReward.id)!.currentValue).toBe(2);
    expect(rewards.find((r) => r.id === sprintReward.id)!.unlocked).toBe(true);
    expect(rewards.find((r) => r.id === highScoreReward.id)!.currentValue).toBe(9);
    expect(rewards.find((r) => r.id === highScoreReward.id)!.unlocked).toBe(true);
    expect(rewards.find((r) => r.id === timeSpentReward.id)!.currentValue).toBe(2); // 2 minutes (130s / 60 round to 2)
    expect(rewards.find((r) => r.id === timeSpentReward.id)!.unlocked).toBe(true);
  });

  it('should track topics mastered', async () => {
    const reward = await createReward({
      title: 'Cake Time',
      targetType: 'TOPICS_MASTERED',
      targetValue: 1,
    });

    // Check initially (0 mastered)
    let rewards = await getRewards();
    expect(rewards.find((r) => r.id === reward.id)!.currentValue).toBe(0);
    expect(rewards.find((r) => r.id === reward.id)!.unlocked).toBe(false);

    // Update topic to mastery level 0.8
    await prisma.topic.update({
      where: { id: 'test-topic-id' },
      data: { masteryLevel: 0.8 },
    });

    await recalculateRewardProgress(testUserId);

    rewards = await getRewards();
    expect(rewards.find((r) => r.id === reward.id)!.currentValue).toBe(1);
    expect(rewards.find((r) => r.id === reward.id)!.unlocked).toBe(true);
  });

  it('should claim a reward and keep it unlocked', async () => {
    const reward = await createReward({
      title: 'iPad Time',
      targetType: 'STREAK',
      targetValue: 2,
    });

    await claimReward(reward.id);

    const rewards = await prisma.reward.findMany({
      where: { id: reward.id },
    });

    expect(rewards.length).toBe(1);
    expect(rewards[0].claimed).toBe(true);
    expect(rewards[0].unlocked).toBe(true);
  });

  it('should delete a reward goal', async () => {
    const reward = await createReward({
      title: 'iPad Time',
      targetType: 'STREAK',
      targetValue: 2,
    });

    await deleteReward(reward.id);

    const rewards = await prisma.reward.findMany({
      where: { id: reward.id },
    });

    expect(rewards.length).toBe(0);
  });
});
