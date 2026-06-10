import { getUser } from './actions/user';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/50 to-indigo-50/70 py-12 px-4">
        <Onboarding />
      </main>
    );
  }

  return <Dashboard user={user} />;
}
