"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/", icon: MessageSquare, label: "Twin Portal" },
  { href: "/employee", icon: Users, label: "My Twin Pod" },
  { href: "/ceo", icon: LayoutDashboard, label: "Executive Mesh" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-[#d8e2ed] bg-[#f1f5fa] py-4 shadow-[2px_0_8px_#cfd8e515] lg:w-56 lg:items-stretch lg:px-3">
      {/* Logo */}
      <Link
        href="/"
        className="mb-6 flex items-center justify-center gap-2.5 lg:justify-start lg:px-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#4f46e5] text-white shadow-[3px_3px_7px_#4f46e540]">
          <Sparkles size={16} />
        </div>
        <div className="hidden lg:block">
          <span className="text-sm font-extrabold text-slate-800">
            TwinOps
          </span>
          <span className="block text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
            Enterprise
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all lg:justify-start ${
                isActive
                  ? "bg-[#e2eaf3] text-indigo-900 shadow-[inset_2px_2px_4px_#cfd8e5,inset_-2px_-2px_4px_#ffffff] border-l-4 border-indigo-600"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 shadow-[1px_1px_3px_#cfd8e5,-1px_-1px_3px_#ffffff]"
              }`}
            >
              <Icon size={17} className={isActive ? "text-indigo-600" : "text-slate-400"} />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <Link
        href="/settings"
        className="flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-600 transition-all hover:bg-white hover:text-indigo-600 shadow-[1px_1px_3px_#cfd8e5,-1px_-1px_3px_#ffffff] lg:justify-start"
      >
        <Settings size={17} className="text-slate-400" />
        <span className="hidden lg:block">Integrations</span>
      </Link>
    </aside>
  );
}
