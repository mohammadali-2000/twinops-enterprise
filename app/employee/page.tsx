"use client";

import { useState } from "react";
import { EmployeeSidebar, type EmployeeView } from "@/components/twinops/EmployeeSidebar";
import { EmployeeChatView } from "@/components/twinops/EmployeeChatView";
import { ClonesView } from "@/components/twinops/ClonesView";
import { KnowledgeView } from "@/components/twinops/KnowledgeView";

export default function EmployeePage() {
  const [activeView, setActiveView] = useState<EmployeeView>("chat");

  return (
    <div className="flex h-screen bg-[#eaf0f6] text-slate-800">
      <EmployeeSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        <div className={activeView === "chat" ? "h-full" : "hidden"}>
          <EmployeeChatView />
        </div>
        <div className={activeView === "coworkers" ? "h-full" : "hidden"}>
          <ClonesView />
        </div>
        <div className={activeView === "knowledge" ? "h-full" : "hidden"}>
          <KnowledgeView />
        </div>
      </main>
    </div>
  );
}
