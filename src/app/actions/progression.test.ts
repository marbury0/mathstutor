import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '@/lib/prisma';
import { logQuestionResult, finishSession } from './progression';
import { normalizeAnswer } from '../../components/Sprint';

describe('Progression Server Actions', () => {
  const testUserId = 'test-user';
  const testTopicName = 'Addition Test';

  beforeEach(async () => {
    // Clean up
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
        hobbies: JSON.stringify(['Gaming']),
        pets: JSON.stringify([]),
      },
    });

    // Create a test topic for user
    await prisma.topic.create({
      data: {
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
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should save correct answer details and apply speed difficulty scaling', async () => {
    // Call logQuestionResult with a correct answer and fast time (10s)
    await logQuestionResult(
      testTopicName,
      true, // isCorrect
      10,   // timeTaken (seconds)
      'What is 5 + 5?',
      '10', // userAnswer
      '10'  // correctAnswer
    );

    // Fetch the updated topic
    const topic = await prisma.topic.findFirst({
      where: { userId: testUserId, name: testTopicName },
      include: { questionHistory: true },
    });

    expect(topic).toBeDefined();
    // Mastery should increase from 0.1 to 0.2
    expect(topic!.masteryLevel).toBeCloseTo(0.2);
    // Difficulty should jump from 3 to 5 (speed bonus +2)
    expect(topic!.difficultyLevel).toBe(5);

    // Verify history entry
    expect(topic!.questionHistory.length).toBe(1);
    const history = topic!.questionHistory[0];
    expect(history.isCorrect).toBe(true);
    expect(history.timeTaken).toBe(10);
    expect(history.questionText).toBe('What is 5 + 5?');
    expect(history.userAnswer).toBe('10');
    expect(history.correctAnswer).toBe('10');
    expect(history.misconception).toBeNull();
    expect(history.advice).toBeNull();
  });

  it('should save incorrect answer details, apply error diagnosis, and reduce difficulty', async () => {
    // Call logQuestionResult with incorrect answer
    await logQuestionResult(
      testTopicName,
      false, // isCorrect
      50,    // timeTaken
      'What is 2 + 2?',
      '5',   // userAnswer
      '4'    // correctAnswer
    );

    const topic = await prisma.topic.findFirst({
      where: { userId: testUserId, name: testTopicName },
      include: { questionHistory: true },
    });

    expect(topic).toBeDefined();
    // Mastery should decrease from 0.1 by 0.15, clamped at 0
    expect(topic!.masteryLevel).toBe(0);
    // Difficulty should reduce from 3 to 2 (-1 for mistake)
    expect(topic!.difficultyLevel).toBe(2);

    // Verify history entry
    expect(topic!.questionHistory.length).toBe(1);
    const history = topic!.questionHistory[0];
    expect(history.isCorrect).toBe(false);
    expect(history.timeTaken).toBe(50);
    expect(history.questionText).toBe('What is 2 + 2?');
    expect(history.userAnswer).toBe('5');
    expect(history.correctAnswer).toBe('4');
    
    // In test mode (with MOCK_AI=true), AI diagnosis should write mock values
    expect(history.misconception).toBe('Calculation error');
    expect(history.advice).toBe('Double check your simple arithmetic adding 2 and 2.');
  });

  it('should save completed session details in finishSession', async () => {
    // Finish session
    await finishSession(5, 60); // 5 score, 60 seconds

    const sessions = await prisma.session.findMany({
      where: { userId: testUserId },
    });

    expect(sessions.length).toBe(1);
    expect(sessions[0].score).toBe(5);
    expect(sessions[0].duration).toBe(60);
  });
});

describe('Answer Normalization Helper', () => {
  it('should normalize spaces and casing', () => {
    expect(normalizeAnswer('  Hello World  ')).toBe('helloworld');
    expect(normalizeAnswer('FIVE')).toBe('five');
  });

  it('should strip currency symbols', () => {
    expect(normalizeAnswer('£5')).toBe('5');
    expect(normalizeAnswer('$12.50')).toBe('12.5');
    expect(normalizeAnswer('€ 100')).toBe('100');
  });

  it('should normalize numeric strings', () => {
    expect(normalizeAnswer('5.0')).toBe('5');
    expect(normalizeAnswer('5.00')).toBe('5');
    expect(normalizeAnswer('12.5')).toBe('12.5');
  });

  it('should keep non-numeric complex strings intact except lowercased and spaceless', () => {
    expect(normalizeAnswer('5/8')).toBe('5/8');
    expect(normalizeAnswer('half')).toBe('half');
  });

  it('should normalize and require units consistently', () => {
    expect(normalizeAnswer('5 cm')).toBe('5cm');
    expect(normalizeAnswer('5.0 centimeters')).toBe('5cm');
    expect(normalizeAnswer('5.0 centimetres')).toBe('5cm');
    expect(normalizeAnswer('45 degrees')).toBe('45°');
    expect(normalizeAnswer('45°')).toBe('45°');
    expect(normalizeAnswer('45 deg')).toBe('45°');
    expect(normalizeAnswer('1.50 m')).toBe('1.5m');
    expect(normalizeAnswer('1.50 metres')).toBe('1.5m');
    expect(normalizeAnswer('20 percent')).toBe('20%');
    expect(normalizeAnswer('5cm')).toBe('5cm');
    expect(normalizeAnswer('200 millilitres')).toBe('200ml');
    expect(normalizeAnswer('1.5 litres')).toBe('1.5l');
    expect(normalizeAnswer('23 pence')).toBe('23p');
    expect(normalizeAnswer('23p')).toBe('23p');
    expect(normalizeAnswer('1 penny')).toBe('1p');
    // Ensure unit-less answer doesn't match unit-ed answer
    expect(normalizeAnswer('5')).not.toBe(normalizeAnswer('5 cm'));
  });
});
