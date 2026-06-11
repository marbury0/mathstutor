import { cookies } from 'next/headers';
import { getUser, getAllUsers } from './actions/user';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const user = await getUser();
  const allUsers = await getAllUsers();
  const cookieStore = await cookies();
  const isTestMode = cookieStore.get('testMode')?.value === 'true';

  if (!user) {
    return (
      <main className="min-h-screen py-12 px-4">
        <Onboarding />
      </main>
    );
  }

  return <Dashboard user={user} allUsers={allUsers} isTestMode={isTestMode} />;
}
