import { cookies } from 'next/headers';
import { getUser, getAllUsers } from './actions/user';
import { getRewards } from './actions/rewards';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';
import ProfileSelection from '@/components/ProfileSelection';

export default async function Home() {
  const user = await getUser();
  const allUsers = await getAllUsers();
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId')?.value;
  const isTestMode = cookieStore.get('testMode')?.value === 'true';

  const themeClass = user?.theme === 'peach' ? 'theme-peach' : 'theme-ocean';

  if (!user) {
    const showOnboarding = userIdCookie === 'new' || allUsers.length === 0;
    return (
      <main className="min-h-screen py-12 px-4 theme-ocean">
        {showOnboarding ? (
          <Onboarding />
        ) : (
          <ProfileSelection allUsers={allUsers} />
        )}
      </main>
    );
  }

  const rewards = await getRewards();

  return (
    <div className={themeClass}>
      <Dashboard user={user} allUsers={allUsers} isTestMode={isTestMode} initialRewards={rewards} />
    </div>
  );
}
