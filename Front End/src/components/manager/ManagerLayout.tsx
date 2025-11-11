import { ManagerSidebar } from './ManagerSidebar'

interface ManagerLayoutProps {
  children: React.ReactNode
}

export function ManagerLayout({ children }: ManagerLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}