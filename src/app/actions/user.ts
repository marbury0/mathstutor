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
}) {
  console.log('Creating user with data:', data);
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        age: data.age,
        yearGroup: data.yearGroup,
        hobbies: JSON.stringify(data.hobbies),
        pets: JSON.stringify(data.pets),
      },
    });
    console.log('User created successfully:', user.id);
    
    // Seed topics specifically for this user
    await seedTopics(user.id, data.yearGroup, data.startingDifficulty);

    // Set active profile cookie
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { path: '/' });
  } catch (error) {
    console.error('Prisma error in createUser:', error);
    throw error;
  }
  
  revalidatePath('/');
  redirect('/');
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
  // Fallback to first user in database
  return await prisma.user.findFirst();
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
  cookieStore.set('userId', userId, { path: '/' });
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
