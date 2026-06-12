'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { seedTopics } from './seed';

export async function createUser(data: {
  name: string;
  age: number;
  yearGroup: number;
  hobbies: string[];
  pets: { name: string; type: string }[];
  startingDifficulty: number;
  tutorName?: string;
  theme?: string;
  avatar?: string;
}) {
  console.log('Creating user with data:', data);
  try {
    // Default to recommended sprint duration in seconds:
    let defaultDuration = 900; // 15 mins for Year 5-6
    if (data.yearGroup <= 2) {
      defaultDuration = 300;   // 5 mins for Year 1-2
    } else if (data.yearGroup <= 4) {
      defaultDuration = 600;   // 10 mins for Year 3-4
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        age: data.age,
        yearGroup: data.yearGroup,
        tutorName: data.tutorName || "Maths Bot",
        theme: data.theme || "ocean",
        avatar: data.avatar || "🐱",
        hobbies: JSON.stringify(data.hobbies),
        pets: JSON.stringify(data.pets),
        sprintDuration: defaultDuration,
      },
    });
    console.log('User created successfully:', user.id);
    
    // Seed topics specifically for this user
    await seedTopics(user.id, data.yearGroup, data.startingDifficulty);

    // Set active profile cookie (persisted for 30 days)
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { 
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  } catch (error) {
    console.error('Prisma error in createUser:', error);
    throw error;
  }
  
  revalidatePath('/');
  return { success: true };
}

export async function getUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (userId === 'new') {
    return null;
  }
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) return user;
  }
  return null;
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}

export async function switchUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, { 
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  revalidatePath('/');
}

export async function startNewProfileOnboarding() {
  const cookieStore = await cookies();
  cookieStore.set('userId', 'new', { path: '/' });
  revalidatePath('/');
}

export async function clearActiveUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  revalidatePath('/');
}


export async function updateUser(data: {
  name: string;
  age: number;
  yearGroup: number;
  hobbies?: string[];
  pets?: { name: string; type: string }[];
  tutorName?: string;
  theme?: string;
  avatar?: string;
  sprintDuration?: number;
}) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const updateData: {
    name: string;
    age: number;
    yearGroup: number;
    hobbies?: string;
    pets?: string;
    tutorName?: string;
    theme?: string;
    avatar?: string;
    sprintDuration?: number;
  } = {
    name: data.name,
    age: data.age,
    yearGroup: data.yearGroup,
  };

  if (data.hobbies !== undefined) {
    updateData.hobbies = JSON.stringify(data.hobbies);
  }
  if (data.pets !== undefined) {
    updateData.pets = JSON.stringify(data.pets);
  }
  if (data.tutorName !== undefined) {
    updateData.tutorName = data.tutorName;
  }
  if (data.theme !== undefined) {
    updateData.theme = data.theme;
  }
  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar;
  }
  if (data.sprintDuration !== undefined) {
    updateData.sprintDuration = data.sprintDuration;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  // Seed new topics for the new year group if they don't exist yet
  await seedTopics(user.id, data.yearGroup, 3);

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function addCustomTopic(name: string, startingDifficulty: number = 3) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Topic name cannot be empty");

  await prisma.topic.upsert({
    where: {
      name_yearGroup_userId: {
        name: trimmedName,
        yearGroup: user.yearGroup,
        userId: user.id
      }
    },
    update: {},
    create: {
      name: trimmedName,
      yearGroup: user.yearGroup,
      userId: user.id,
      difficultyLevel: startingDifficulty
    }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function deleteTopic(topicId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  });

  if (!topic || topic.userId !== user.id) {
    throw new Error("Topic not found or unauthorized");
  }

  // Delete question history first to prevent foreign key errors
  await prisma.questionHistory.deleteMany({
    where: { topicId: topic.id }
  });

  await prisma.topic.delete({
    where: { id: topicId }
  });

  revalidatePath('/');
  revalidatePath('/parent');
}

export async function getTopics() {
  const user = await getUser();
  if (!user) return [];
  return await prisma.topic.findMany({
    where: { userId: user.id },
    orderBy: {
      masteryLevel: 'desc'
    }
  });
}

export async function getSessionHistory() {
  const user = await getUser();
  if (!user) return [];
  return await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: {
      date: 'desc'
    },
    take: 7 // Last week
  });
}

export async function getSessionQuestions(sessionId: string) {
  const user = await getUser();
  if (!user) throw new Error("No user found");

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== user.id) {
    throw new Error("Session not found or unauthorized");
  }

  // Calculate session start and end times
  const endTime = new Date(session.date);
  const startTime = new Date(endTime.getTime() - (session.duration * 1000) - 10000); // 10s grace period

  // Fetch all question history records for the user's topics that were answered within the session window
  const questions = await prisma.questionHistory.findMany({
    where: {
      topic: {
        userId: user.id,
      },
      answeredAt: {
        gte: startTime,
        lte: new Date(endTime.getTime() + 5000), // 5s grace period after session end
      },
    },
    include: {
      topic: true,
    },
    orderBy: {
      answeredAt: 'asc',
    },
  });

  return questions;
}
