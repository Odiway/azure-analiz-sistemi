import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen mesh-gradient relative">
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
      <Navbar />
      <main className="relative pt-[76px] pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
