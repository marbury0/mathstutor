import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('E2E Reset: Clearing database...');
  try {
    await prisma.questionHistory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
