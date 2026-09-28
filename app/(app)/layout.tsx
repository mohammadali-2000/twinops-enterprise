"use client";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eaf0f6] text-slate-800">
      {children}
    </div>
  );
}
