"use client";

import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title?: string;
  noBorder?: boolean;
  hasNotifications?: boolean;
}

export function Header({
  title = "TwinOps Enterprise",
  noBorder = false,
  hasNotifications = false,
}: HeaderProps) {

  return (
    <header
      className={`flex h-14 items-center justify-between bg-[#f1f5fa] px-6 shadow-[0_2px_8px_#cfd8e520] ${
        noBorder
          ? ""
          : "border-b border-[#d8e2ed]"
      }`}
    >
      <h1 className="text-[16px] font-bold text-slate-800">
        {title}
      </h1>

      <div className="flex items-center gap-2.5">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e2eaf3] text-slate-500 shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] transition-all hover:text-indigo-600 hover:shadow-[inset_1px_1px_3px_#cfd8e5]">
          <Search size={16} />
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e2eaf3] text-slate-500 shadow-[2px_2px_5px_#cfd8e5,-2px_-2px_5px_#ffffff] transition-all hover:text-indigo-600 hover:shadow-[inset_1px_1px_3px_#cfd8e5]">
          <Bell size={16} />
          {hasNotifications && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4f46e5] text-xs font-bold text-white shadow-[2px_2px_5px_#4f46e540]">
          SA
        </div>
      </div>
    </header>
  );
}
