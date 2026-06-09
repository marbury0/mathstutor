'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { redirect } from 'next/navigation';

export async function createUser(data: { name: string; yearGroup: number; hobbies: string[]; petNames: string[] }) {
  console.log('Creating user with data:', data);
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        yearGroup: data.yearGroup,
        hobbies: JSON.stringify(data.hobbies),
        petNames: JSON.stringify(data.petNames),
      },
    });
    console.log('User created successfully:', user.id);
  } catch (error) {
    console.error('Prisma error in createUser:', error);
    throw error;
  }
  
  revalidatePath('/');
  redirect('/');
}

export async function getUser() {
  return await prisma.user.findFirst();
}

export async function getTopics() {
  return await prisma.topic.findMany({
    orderBy: {
      masteryLevel: 'desc'
    }
  });
}

export async function getSessionHistory() {
  return await prisma.session.findMany({
    orderBy: {
      date: 'desc'
    },
    take: 7 // Last week
  });
}
