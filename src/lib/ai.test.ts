import { describe, it, expect } from 'vitest';
import { generateQuestion, getAdaptiveHint, getAlternativeExplanation } from './ai';

describe('AI Tutor Personalization (tutorName)', () => {
  const testProfile = {
    name: 'Sarah',
    age: 8,
    yearGroup: 3,
    hobbies: ['Drawing'],
    pets: [{ name: 'Bubbles', type: 'Goldfish' }],
    difficultyLevel: 3,
    tutorName: 'Professor Math'
  };

  it('should include custom tutorName in generateQuestion mock explanation when isTestMode is true', async () => {
    const question = await generateQuestion('Addition', testProfile, true);
    expect(question.explanation).toContain('explains Professor Math');
  });

  it('should include custom tutorName in getAdaptiveHint mock output when isTestMode is true', async () => {
    const hint = await getAdaptiveHint('What is 2 + 2?', '5', '4', 'Sarah', 3, 'Professor Math', true);
    expect(hint).toContain('Professor Math thinks you should think');
  });

  it('should include custom tutorName in getAlternativeExplanation mock output when isTestMode is true', async () => {
    const explanation = await getAlternativeExplanation('What is 2 + 2?', 'Since 2 and 2 is 4', 'Sarah', 'Professor Math', true);
    expect(explanation).toContain('explains Professor Math');
  });

  it('should include acceptableAnswers array in generateQuestion output when isTestMode is true', async () => {
    const question = await generateQuestion('Addition', testProfile, true);
    expect(question.acceptableAnswers).toBeDefined();
    expect(Array.isArray(question.acceptableAnswers)).toBe(true);
    expect(question.acceptableAnswers).toContain('4');
  });
});
