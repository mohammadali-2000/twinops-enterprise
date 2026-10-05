"use client";

import { useState } from "react";
import { CeoSidebar, type CeoView } from "@/components/twinops/CeoSidebar";
import { InsightsView } from "@/components/twinops/InsightsView";
import { ClonesView } from "@/components/twinops/ClonesView";
import { KnowledgeView } from "@/components/twinops/KnowledgeView";

export default function CeoPage() {
  const [activeView, setActiveView] = useState<CeoView>("insights");

  return (
    <div className="flex h-screen bg-[#eaf0f6] text-slate-800">
      <CeoSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        <div className={activeView === "insights" ? "h-full" : "hidden"}>
          <InsightsView />
        </div>
        <div className={activeView === "clones" ? "h-full" : "hidden"}>
          <ClonesView />
        </div>
        <div className={activeView === "knowledge" ? "h-full" : "hidden"}>
          <KnowledgeView />
        </div>
      </main>
    </div>
  );
}
