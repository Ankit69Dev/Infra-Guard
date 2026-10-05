// app/dashboard/layout.tsx
"use client";
import { useState } from "react";
import Sidebar from "@/components/SideBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar onCollapsedChange={setCollapsed} />
      <main className={`transition-[margin] duration-300 ${collapsed ? "ml-[76px]" : "ml-[260px]"}`}>
        {children}
      </main>
    </div>
  );
}