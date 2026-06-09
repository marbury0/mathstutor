'use server';

import prisma from '@/lib/prisma';
import { generateQuestion, getAdaptiveHint } from '@/lib/ai';

export async function fetchNextQuestion() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  const hobbies = user.hobbies ? JSON.parse(user.hobbies) : [];
  const petNames = user.petNames ? JSON.parse(user.petNames) : [];

  // SRS Logic: Find topics due for review
  const now = new Date();
  let dueTopics = await prisma.topic.findMany({
    where: {
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
      orderBy: {
        masteryLevel: 'asc'
      },
      take: 5
    });
  }

  const selectedTopic = dueTopics[Math.floor(Math.random() * dueTopics.length)];

  return await generateQuestion(selectedTopic.name, {
    name: user.name,
    yearGroup: user.yearGroup,
    hobbies,
    petNames
  });
}

export async function fetchHint(question: string, wrongAnswer: string, correctAnswer: string) {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  return await getAdaptiveHint(question, wrongAnswer, correctAnswer, user.name);
}
