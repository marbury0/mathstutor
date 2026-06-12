'use server';

import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUser } from './user';
import { generateQuestion, getAdaptiveHint, getAlternativeExplanation } from '@/lib/ai';

export async function fetchNextQuestion() {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const cookieStore = await cookies();
  const headersList = await headers();
  const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';

  const hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
  const pets = user.pets ? JSON.parse(user.pets) : [];

  // 1. Fetch all topics for the user along with their question counts
  let topics = await prisma.topic.findMany({
    where: {
      userId: user.id,
      yearGroup: user.yearGroup,
    },
    include: {
      _count: {
        select: { questionHistory: true }
      }
    }
  });

  // 2. If empty, seed topics for this user and yearGroup, then fetch again
  if (topics.length === 0) {
    const { seedTopics } = await import('./seed');
    await seedTopics(user.id, user.yearGroup);
    topics = await prisma.topic.findMany({
      where: {
        userId: user.id,
        yearGroup: user.yearGroup,
      },
      include: {
        _count: {
          select: { questionHistory: true }
        }
      }
    });
  }

  if (topics.length === 0) {
    throw new Error("No topics available even after seeding.");
  }

  // 3. Map and calculate priority score for each topic
  const scoredTopics = topics.map(topic => {
    const questionsCount = topic._count.questionHistory;
    
    // Weakness component: lower mastery = higher score (Max 1.0)
    const weaknessScore = Math.max(0, 1.0 - topic.masteryLevel);
    
    // Novelty/Coverage component: fewer questions = higher score
    const noveltyScore = 1.0 / (questionsCount + 1);
    
    // Combined score (weights: 60% weakness, 40% novelty)
    const priorityScore = (weaknessScore * 0.6) + (noveltyScore * 0.4);
    
    return { topic, priorityScore };
  });

  // 4. Sort by priority score descending and pick from the top 3 to add variety
  scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);
  const topCandidates = scoredTopics.slice(0, 3);
  const selectedTopic = topCandidates[Math.floor(Math.random() * topCandidates.length)].topic;

  return await generateQuestion(selectedTopic.name, {
    name: user.name,
    age: user.age,
    yearGroup: user.yearGroup,
    hobbies,
    pets,
    difficultyLevel: selectedTopic.difficultyLevel,
    tutorName: user.tutorName || "Maths Bot"
  }, isTestMode);
}

export async function fetchHint(question: string, wrongAnswer: string, correctAnswer: string) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const cookieStore = await cookies();
  const headersList = await headers();
  const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';

  return await getAdaptiveHint(question, wrongAnswer, correctAnswer, user.name, user.yearGroup, user.tutorName || "Maths Bot", isTestMode);
}

export async function fetchAlternativeExplanation(question: string, explanation: string) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const cookieStore = await cookies();
  const headersList = await headers();
  const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';

  return await getAlternativeExplanation(question, explanation, user.name, user.tutorName || "Maths Bot", isTestMode);
}
