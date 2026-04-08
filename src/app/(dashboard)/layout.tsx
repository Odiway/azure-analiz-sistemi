import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen tech-bg relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
      {/* Floating particles */}
      <div className="fixed top-20 left-[10%] w-2 h-2 rounded-full bg-azure-400/20 float-particle pointer-events-none" />
      <div className="fixed top-40 right-[15%] w-1.5 h-1.5 rounded-full bg-purple-400/20 float-particle animation-delay-2000 pointer-events-none" />
      <div className="fixed bottom-32 left-[25%] w-1 h-1 rounded-full bg-emerald-400/25 float-particle animation-delay-4000 pointer-events-none" />
      <div className="fixed top-[60%] right-[8%] w-2.5 h-2.5 rounded-full bg-amber-400/15 float-particle pointer-events-none" />
      <Navbar />
      <main className="relative pt-[76px] pb-10 px-4 sm:px-6 lg:px-8 z-[1]">
        {children}
      </main>
    </div>
  );
}
