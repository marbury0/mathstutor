import { getUser } from '../../actions/user';
import { redirect } from 'next/navigation';
import ParentGuideContent from '@/components/ParentGuideContent';

export default async function ParentGuidePage() {
  const user = await getUser();
  if (!user) {
    redirect('/');
  }

  const themeClass = user.theme === 'peach' ? 'theme-peach' : 'theme-ocean';
  const userYearGroup = user.yearGroup || 5;

  return (
    <ParentGuideContent themeClass={themeClass} userYearGroup={userYearGroup} />
  );
}
