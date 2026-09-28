"use client";

import { useState, useCallback } from "react";
import { CeoSidebar, type CeoView } from "@/components/twinops/CeoSidebar";
import { InsightsView } from "@/components/twinops/InsightsView";
import { ClonesView } from "@/components/twinops/ClonesView";
import { KnowledgeView } from "@/components/twinops/KnowledgeView";

export default function CeoPage() {
  const [activeView, setActiveView] = useState<CeoView>("insights");
  const [demoTriggerInsights, setDemoTriggerInsights] = useState(0);
  const [demoTriggerClones, setDemoTriggerClones] = useState(0);
  const [demoTriggerKnowledge, setDemoTriggerKnowledge] = useState(0);

  const handleDemoMode = useCallback(() => {
    if (activeView === "insights") {
      setDemoTriggerInsights((c) => c + 1);
    } else if (activeView === "clones") {
      setDemoTriggerClones((c) => c + 1);
    } else {
      setDemoTriggerKnowledge((c) => c + 1);
    }
  }, [activeView]);

  return (
    <div className="flex h-screen bg-[#eaf0f6] text-slate-800">
      <CeoSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onDemoMode={handleDemoMode}
      />
      <main className="flex-1 overflow-hidden">
        <div className={activeView === "insights" ? "h-full" : "hidden"}>
          <InsightsView demoTrigger={demoTriggerInsights} />
        </div>
        <div className={activeView === "clones" ? "h-full" : "hidden"}>
          <ClonesView demoTrigger={demoTriggerClones} />
        </div>
        <div className={activeView === "knowledge" ? "h-full" : "hidden"}>
          <KnowledgeView demoTrigger={demoTriggerKnowledge} />
        </div>
      </main>
    </div>
  );
}
