import { getUser } from './actions/user';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-blue-50 py-12 px-4">
        <Onboarding />
      </main>
    );
  }

  return <Dashboard user={user} />;
}
