import { cookies } from 'next/headers';
import { getUser, getAllUsers } from './actions/user';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const user = await getUser();
  const allUsers = await getAllUsers();
  const cookieStore = await cookies();
  const isTestMode = cookieStore.get('testMode')?.value === 'true';

  const themeClass = user?.theme === 'peach' ? 'theme-peach' : 'theme-ocean';

  if (!user) {
    return (
      <main className="min-h-screen py-12 px-4 theme-ocean">
        <Onboarding />
      </main>
    );
  }

  return (
    <div className={themeClass}>
      <Dashboard user={user} allUsers={allUsers} isTestMode={isTestMode} />
    </div>
  );
}
