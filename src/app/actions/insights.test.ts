import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { getWeekRangesWithData, getWeeklyInsight, generateWeeklyInsightAction, getUTCWeekRange, deleteWeeklyInsightAction } from './insights';

describe('Insights Server Actions', () => {
  const testUserId = 'test-user';
  const testTopicId = 'test-topic-insight-id';

  beforeEach(async () => {
    // Clear the DB tables
    await prisma.weeklyInsight.deleteMany();
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();

    // Create user
    await prisma.user.create({
      data: {
        id: testUserId,
        name: 'Timmy',
        age: 8,
        yearGroup: 3,
        currentStreak: 1,
        hobbies: JSON.stringify(['Lego']),
        pets: JSON.stringify([]),
      },
    });

    // Create a topic
    await prisma.topic.create({
      data: {
        id: testTopicId,
        userId: testUserId,
        name: 'Addition',
        yearGroup: 3,
        masteryLevel: 0.2,
        difficultyLevel: 3,
      },
    });
  });

  afterEach(async () => {
    await prisma.weeklyInsight.deleteMany();
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should calculate the correct UTC Monday to Sunday week range', async () => {
    // 2026-06-12 is a Friday
    const date = new Date(Date.UTC(2026, 5, 12, 12, 0, 0)); 
    const { start, end } = await getUTCWeekRange(date);

    // Monday should be 2026-06-08
    expect(start.getUTCFullYear()).toBe(2026);
    expect(start.getUTCMonth()).toBe(5); // June is 5 (0-indexed)
    expect(start.getUTCDate()).toBe(8);

    // Sunday should be 2026-06-14
    expect(end.getUTCFullYear()).toBe(2026);
    expect(end.getUTCMonth()).toBe(5);
    expect(end.getUTCDate()).toBe(14);
  });

  it('should list week ranges with activity including the current week', async () => {
    const weeks = await getWeekRangesWithData();
    expect(weeks.length).toBe(1); // Only current week initially

    // Let's insert a session in the previous week (e.g. 10 days ago)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    await prisma.session.create({
      data: {
        userId: testUserId,
        score: 10,
        duration: 300,
        date: tenDaysAgo,
      },
    });

    const weeksWithSession = await getWeekRangesWithData();
    expect(weeksWithSession.length).toBe(2);
  });

  it('should fail to generate insights when there is no question history', async () => {
    const currentWeek = await getUTCWeekRange(new Date());
    await expect(
      generateWeeklyInsightAction(currentWeek.start.toISOString(), currentWeek.end.toISOString())
    ).rejects.toThrow("No maths questions were answered in this week range.");
  });

  it('should successfully generate and save weekly insights when data exists', async () => {
    const currentWeek = await getUTCWeekRange(new Date());

    // Create session in the current week range
    await prisma.session.create({
      data: {
        userId: testUserId,
        score: 15,
        duration: 600,
        date: new Date(),
      },
    });

    // Create question history in the current week range
    await prisma.questionHistory.create({
      data: {
        topicId: testTopicId,
        isCorrect: true,
        timeTaken: 10,
        questionText: 'What is 10 + 5?',
        userAnswer: '15',
        correctAnswer: '15',
        answeredAt: new Date(),
      },
    });

    const result = await generateWeeklyInsightAction(
      currentWeek.start.toISOString(),
      currentWeek.end.toISOString()
    );

    expect(result).toBeDefined();
    expect(result.questionsCount).toBe(1);
    expect(result.accuracy).toBe(100);
    expect(result.pointsEarned).toBe(15);
    expect(result.studyTime).toBe(600);
    expect(result.aiAnalysis).toContain('Timmy');
    expect(result.encouragement).toContain('Timmy');

    // Retrieve from DB
    const stored = await getWeeklyInsight(currentWeek.start.toISOString());
    expect(stored).toBeDefined();
    expect(stored!.accuracy).toBe(100);

    // Now delete it
    await deleteWeeklyInsightAction(currentWeek.start.toISOString());
    const deleted = await getWeeklyInsight(currentWeek.start.toISOString());
    expect(deleted).toBeNull();
  });
});

