'use server';

import prisma from '@/lib/prisma';

const TOPICS = [
  "Addition & Subtraction",
  "Multiplication & Division",
  "Fractions",
  "Decimals",
  "Percentages",
  "Ratio & Proportion",
  "Algebra",
  "Measurement",
  "Geometry: Properties of Shapes",
  "Geometry: Position & Direction",
  "Statistics"
];

export async function seedTopics() {
  console.log('Seeding topics...');
  try {
    for (const name of TOPICS) {
      await prisma.topic.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding topics:', error);
    throw error;
  }
}
