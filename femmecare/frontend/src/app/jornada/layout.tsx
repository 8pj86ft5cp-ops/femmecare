import { requirePapel } from '@/lib/session';
import { TabNav } from './TabNav';

export default async function JornadaLayout({ children }: { children: React.ReactNode }) {
  await requirePapel('PATIENT');

  return (
    <div className="space-y-6">
      <TabNav />
      <div>{children}</div>
    </div>
  );
}
