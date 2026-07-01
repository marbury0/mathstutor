import { vi } from 'vitest';
import { execSync } from 'child_process';

// Redirect database URL to a dedicated test database
process.env.DATABASE_URL = 'file:./data/maths_tutor_test.db';

// Ensure the test database is synchronized with the schema
try {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./data/maths_tutor_test.db' }
  });
} catch (error) {
  console.error('Failed to push schema to test database:', error);
}


vi.mock('next/headers', () => {
  return {
    cookies: async () => {
      return {
        get: (key: string) => {
          if (key === 'userId') return { value: 'test-user' };
          if (key === 'testMode') return { value: 'true' };
          return undefined;
        },
        set: vi.fn(),
        delete: vi.fn(),
      };
    },
    headers: async () => {
      return {
        get: (key: string) => {
          if (key === 'x-e2e-test') return 'true';
          return null;
        },
      };
    },
  };
});

// Mock next/cache revalidatePath
vi.mock('next/cache', () => {
  return {
    revalidatePath: vi.fn(),
  };
});

// Mock next/navigation redirect
vi.mock('next/navigation', () => {
  return {
    redirect: vi.fn(),
  };
});
