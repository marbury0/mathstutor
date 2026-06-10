'use server';

import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUser } from './user';
import { generateQuestion, getAdaptiveHint } from '@/lib/ai';

export async function fetchNextQuestion() {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const cookieStore = await cookies();
  const headersList = await headers();
  const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';

  const hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
  const pets = user.pets ? JSON.parse(user.pets) : [];

  // SRS Logic: Find topics due for review
  const now = new Date();
  let dueTopics = await prisma.topic.findMany({
    where: {
      userId: user.id,
      yearGroup: user.yearGroup,
      nextReviewDate: {
        lte: now
      }
    },
    orderBy: {
      masteryLevel: 'asc'
    }
  });

  // If no topics are strictly due, just pick the ones with lowest mastery
  if (dueTopics.length === 0) {
    dueTopics = await prisma.topic.findMany({
      where: { 
        userId: user.id,
        yearGroup: user.yearGroup 
      },
      orderBy: {
        masteryLevel: 'asc'
      },
      take: 5
    });
  }

  const selectedTopic = dueTopics[Math.floor(Math.random() * dueTopics.length)];

  return await generateQuestion(selectedTopic.name, {
    name: user.name,
    age: user.age,
    yearGroup: user.yearGroup,
    hobbies,
    pets,
    difficultyLevel: selectedTopic.difficultyLevel
  }, isTestMode);
}

export async function fetchHint(question: string, wrongAnswer: string, correctAnswer: string) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const cookieStore = await cookies();
  const headersList = await headers();
  const isTestMode = cookieStore.get('testMode')?.value === 'true' || headersList.get('x-e2e-test') === 'true';

  return await getAdaptiveHint(question, wrongAnswer, correctAnswer, user.name, isTestMode);
}
