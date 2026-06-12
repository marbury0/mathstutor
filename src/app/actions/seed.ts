'use server';

import prisma from '@/lib/prisma';

const CURRICULUM: Record<number, string[]> = {
  1: ["Number Bonds within 20", "Counting to 100", "Addition and Subtraction (within 20)", "Fractions (1/2 and 1/4)", "2D and 3D Shapes", "Time and Dates", "Ordering Numbers", "Halves and Doubles"],
  2: ["Multiplication Tables (2, 5, 10)", "Fractions (1/2, 1/3, 1/4, 3/4)", "Money & Change", "Tell the Time (to 5 minutes)", "Properties of 2D and 3D Shapes", "Place Value (tens and ones)", "Addition & Subtraction (2-digit)", "Measuring Length & Height"],
  3: ["Multiplication Tables (3, 4, 8)", "Column Addition & Subtraction (3-digit)", "Fractions of Amounts", "Perimeter of 2D Shapes", "Mass and Capacity", "Roman Numerals to 12"],
  4: ["All Multiplication Tables to 12x12", "Negative Numbers", "Equivalent Fractions & Decimals", "Area of Rectilinear Shapes", "Analogue & Digital Time (12/24 hour)", "Bar Charts and Pictograms"],
  5: ["Prime Numbers", "Multiplying & Dividing by 10, 100, 1000", "Adding Fractions (Related Denominators)", "Angles", "Volume", "Converting Units", "Square and Cube Numbers"],
  6: ["Algebra", "Ratio and Proportion", "Percentages", "Order of Operations (BODMAS)", "Pie Charts and Line Graphs", "Coordinates in four quadrants", "Multiplying & Dividing Decimals", "Adding Fractions (Different Denominators)"]
};

export async function seedTopics(userId: string, yearGroup: number, startingDifficulty: number = 3) {
  console.log(`Seeding topics for User ${userId}, Year ${yearGroup} with starting difficulty ${startingDifficulty}...`);
  const topics = CURRICULUM[yearGroup] || CURRICULUM[5];
  
  try {
    for (const name of topics) {
      await prisma.topic.upsert({
        where: { 
          name_yearGroup_userId: { name, yearGroup, userId } 
        },
        update: {},
        create: { 
          name, 
          yearGroup,
          userId,
          difficultyLevel: startingDifficulty
        },
      });
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding topics:', error);
    throw error;
  }
}
