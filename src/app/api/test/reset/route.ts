import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('E2E Reset: Clearing database...');
  try {
    const cookieStore = await cookies();
    cookieStore.delete('userId');
    cookieStore.delete('testMode');

    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
