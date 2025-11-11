import { ReactNode } from 'react';

interface PortalLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function PortalLayout({ children, sidebar }: PortalLayoutProps) {
  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">
      {/* Sidebar - fixed, full height */}
      {sidebar}
      
      {/* Main Content - scrollable */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
