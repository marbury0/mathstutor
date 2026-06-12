import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./maths_tutor.db'
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const CURRICULUM: Record<number, string[]> = {
  1: ["Number Bonds within 20", "Counting to 100", "Addition and Subtraction (within 20)", "Fractions (1/2 and 1/4)", "2D and 3D Shapes", "Time and Dates"],
  2: ["Multiplication Tables (2, 5, 10)", "Fractions (1/2, 1/3, 1/4, 3/4)", "Money & Change", "Tell the Time (to 5 minutes)", "Properties of 2D and 3D Shapes", "Place Value (tens and ones)"],
  3: ["Multiplication Tables (3, 4, 8)", "Column Addition & Subtraction (3-digit)", "Fractions of Amounts", "Perimeter of 2D Shapes", "Mass and Capacity", "Roman Numerals to 12"],
  4: ["All Multiplication Tables to 12x12", "Negative Numbers", "Equivalent Fractions & Decimals", "Area of Rectilinear Shapes", "Analogue & Digital Time (12/24 hour)", "Bar Charts and Pictograms"],
  5: ["Prime Numbers", "Multiplying & Dividing by 10, 100, 1000", "Adding Fractions (Related Denominators)", "Angles", "Volume", "Converting Units", "Square and Cube Numbers"],
  6: ["Algebra", "Ratio and Proportion", "Percentages", "Order of Operations (BODMAS)", "Pie Charts and Line Graphs", "Coordinates in four quadrants", "Multiplying & Dividing Decimals", "Adding Fractions (Different Denominators)"]
};

async function main() {
  console.log('Start seeding...');
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {
      avatar: '🦖'
    },
    create: {
      id: 'default-user',
      name: 'Tim',
      age: 10,
      yearGroup: 6,
      avatar: '🦖',
      hobbies: JSON.stringify(['Painting']),
      pets: JSON.stringify([{ name: 'Bunny', type: 'Rabbit' }])
    }
  });
  for (const [yearGroupStr, topics] of Object.entries(CURRICULUM)) {
    const yearGroup = parseInt(yearGroupStr, 10);
    for (const name of topics) {
      await prisma.topic.upsert({
        where: {
          name_yearGroup_userId: { name, yearGroup, userId: user.id }
        },
        update: {},
        create: {
          name,
          yearGroup,
          userId: user.id,
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
