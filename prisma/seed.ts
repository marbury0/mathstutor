import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter } as any);

const CURRICULUM: Record<number, string[]> = {
  1: ["Number Bonds to 10", "Counting to 100", "Basic Addition (within 20)", "Basic Subtraction (within 20)", "2D Shapes", "Days of the Week"],
  2: ["Multiplication Tables (2, 5, 10)", "Fractions (1/2, 1/4)", "Money & Change", "Time (Quarter past/to)", "3D Shapes", "Place Value (tens and ones)"],
  3: ["Multiplication Tables (3, 4, 8)", "Adding 3-digit numbers", "Fractions of amounts", "Perimeter", "Mass and Capacity", "Roman Numerals to 12"],
  4: ["All Multiplication Tables to 12x12", "Negative Numbers", "Equivalent Fractions", "Area", "Analogue & Digital Time", "Line Graphs"],
  5: ["Prime Numbers", "Multiplying Decimals", "Adding Fractions with different denominators", "Angles", "Volume", "Converting Units"],
  6: ["Algebra", "Ratio and Proportion", "Percentages", "Order of Operations (BODMAS)", "Pie Charts", "Coordinates in four quadrants"]
};

async function main() {
  console.log('Start seeding topics...');
  for (const [yearGroupStr, topics] of Object.entries(CURRICULUM)) {
    const yearGroup = parseInt(yearGroupStr, 10);
    for (const name of topics) {
      await prisma.topic.upsert({
        where: {
          name_yearGroup: { name, yearGroup }
        },
        update: {},
        create: {
          name,
          yearGroup,
          difficultyLevel: 3
        }
      });
    }
  }
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
