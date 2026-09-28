"use client";

import { useState, useCallback } from "react";
import { EmployeeSidebar, type EmployeeView } from "@/components/twinops/EmployeeSidebar";
import { EmployeeChatView } from "@/components/twinops/EmployeeChatView";
import { ClonesView } from "@/components/twinops/ClonesView";
import { KnowledgeView } from "@/components/twinops/KnowledgeView";
import { SlackSimulatorView } from "@/components/twinops/SlackSimulatorView";

export default function EmployeePage() {
  const [activeView, setActiveView] = useState<EmployeeView>("slack");
  const [demoTriggerChat, setDemoTriggerChat] = useState(0);
  const [demoTriggerCoworkers, setDemoTriggerCoworkers] = useState(0);
  const [demoTriggerKnowledge, setDemoTriggerKnowledge] = useState(0);

  const handleDemoMode = useCallback(() => {
    if (activeView === "chat") {
      setDemoTriggerChat((c) => c + 1);
    } else if (activeView === "coworkers") {
      setDemoTriggerCoworkers((c) => c + 1);
    } else {
      setDemoTriggerKnowledge((c) => c + 1);
    }
  }, [activeView]);

  return (
    <div className="flex h-screen bg-[#eaf0f6] text-slate-800">
      <EmployeeSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onDemoMode={handleDemoMode}
      />
      <main className="flex-1 overflow-hidden">
        <div className={activeView === "slack" ? "h-full" : "hidden"}>
          <SlackSimulatorView />
        </div>
        <div className={activeView === "chat" ? "h-full" : "hidden"}>
          <EmployeeChatView demoTrigger={demoTriggerChat} />
        </div>
        <div className={activeView === "coworkers" ? "h-full" : "hidden"}>
          <ClonesView demoTrigger={demoTriggerCoworkers} />
        </div>
        <div className={activeView === "knowledge" ? "h-full" : "hidden"}>
          <KnowledgeView demoTrigger={demoTriggerKnowledge} />
        </div>
      </main>
    </div>
  );
}
