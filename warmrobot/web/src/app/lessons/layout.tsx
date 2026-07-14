'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/stitch/app-shell';
import { LessonsAuthProvider } from '@/lib/lessons/auth-context';

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/lessons/login';

  return (
    <LessonsAuthProvider>
      {isLogin ? (
        children
      ) : (
        <AppShell headerVariant="centered" headerTitle="Розклад" showNav={false}>
          {children}
        </AppShell>
      )}
    </LessonsAuthProvider>
  );
}
