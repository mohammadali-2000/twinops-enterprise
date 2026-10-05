#!/usr/bin/env node
// End-to-end check against a RUNNING TwinOps server with real keys.
// Usage: npm run e2e            (defaults to http://localhost:3000)
//        E2E_BASE_URL=https://xxxx.devtunnels.ms npm run e2e
// Requires at least one twin with a GitHub username and/or Jira JQL set in Settings.

import fs from "node:fs";

const BASE = (process.env.E2E_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const results = [];

function readEnvLocal(key) {
  if (process.env[key]) return process.env[key];
  try {
    const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim() : "";
  } catch {
    return "";
  }
}

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  -  ${detail}` : ""}`);
}

async function json(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON
  }
  return { status: res.status, body };
}

async function sse(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { status: res.status, events: [] };
  const text = await res.text();
  const events = text
    .split("\n")
    .filter((l) => l.startsWith("data: ") && l !== "data: [DONE]")
    .map((l) => {
      try {
        return JSON.parse(l.slice(6));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return { status: res.status, events };
}

async function main() {
  console.log(`TwinOps end-to-end check against ${BASE}\n`);

  // 1. Live connection health
  const health = await json("/api/health?live=1");
  if (health.status !== 200 || !health.body) {
    record("Server reachable", false, `GET /api/health returned ${health.status}. Is the app running?`);
    return;
  }
  for (const [key, c] of Object.entries(health.body.checks)) {
    if (key === "teamsOutbound") continue;
    record(`Health: ${key}`, c.ok, c.detail);
  }
  if (!health.body.ok) {
    console.log("\nFix the failing connections above (keys in .env.local), restart the server, and re-run.");
    return;
  }

  // 2. Pick a twin with sources
  const { body: cloneList } = await json("/api/clones");
  const twins = cloneList?.clones ?? [];
  const twin = twins.find((t) => t.personality?.sources?.github_username || t.personality?.sources?.jira_jql);
  record("At least one twin with GitHub/Jira configured", Boolean(twin), twin ? twin.name : "Create one in Settings");
  if (!twin) return;

  // 3. Sync, then re-sync to prove no duplicates
  const countChunks = async () => {
    const h = await json("/api/health");
    return h.body?.checks?.database?.detail ?? "";
  };
  const sync1 = await json(`/api/clones/${twin.id}/sync`, { method: "POST" });
  const r = sync1.body?.results ?? {};
  for (const src of ["github", "jira"]) {
    if (r[src]?.status === "skipped") continue;
    record(`Sync ${src}`, r[src]?.status === "synced" && !/\b0 searchable/.test(r[src]?.summary ?? ""), r[src]?.summary);
  }
  const afterFirst = await countChunks();
  await json(`/api/clones/${twin.id}/sync`, { method: "POST" });
  const afterSecond = await countChunks();
  record("Re-sync does not duplicate data", afterFirst === afterSecond, afterSecond);

  // 4. Find a real Jira ticket and ask about it
  const { body: docs } = await json("/api/twinops/documents?type=semantic");
  const items = docs?.items ?? [];
  const jiraItem = items.find((i) => /^[A-Z][A-Z0-9]+-\d+:/.test(i.title));
  if (jiraItem) {
    const key = jiraItem.title.split(":")[0];
    const chat = await sse("/api/twinops/chat", { cloneId: twin.id, question: `What is the status of ${key}?` });
    const answer = chat.events.filter((e) => e.type === "chunk").map((e) => e.text).join("");
    const cites = chat.events.find((e) => e.type === "citations")?.citations ?? [];
    record("Chat answers a real Jira ticket", answer.includes(key), answer.slice(0, 160).replace(/\s+/g, " "));
    record("Chat cites the Jira ticket", cites.some((c) => `${c.snippet}`.includes(key)), `${cites.length} citation(s)`);
  } else {
    record("Jira ticket available to ask about", false, "No synced Jira tickets found (check the twin's JQL)");
  }

  // 5. GitHub question
  const ghItem = items.find((i) => i.title.startsWith("GitHub Snapshot:"));
  if (ghItem) {
    const repo = ghItem.title.replace("GitHub Snapshot: ", "");
    const chat = await sse("/api/twinops/chat", { cloneId: twin.id, question: `What changed recently in ${repo}?` });
    const cites = chat.events.find((e) => e.type === "citations")?.citations ?? [];
    record("Chat cites GitHub for a repo question", cites.some((c) => /github/i.test(c.source)), `${cites.length} citation(s)`);
  }

  // 6. No hardcoded demo data leaks into answers
  const probe = await sse("/api/twinops/chat", { cloneId: twin.id, question: "Tell me about the database migration ticket" });
  const probeText = JSON.stringify(probe.events);
  record("No hardcoded fake tickets in answers", !/PROJ-104|David Kim|Elena Rostova|HLS-402/.test(probeText));

  // 7. Teams endpoint
  const noSecret = await json("/api/teams/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "twin: hello" }),
  });
  record("Teams endpoint rejects requests without secret", noSecret.status === 401, `HTTP ${noSecret.status}`);

  const secret = readEnvLocal("TEAMS_FLOW_SECRET");
  const teams = await json("/api/teams/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-twinops-secret": secret },
    body: JSON.stringify({ question: "<p>twin: what am I working on right now?</p>", sender: "E2E Test", cloneId: twin.id }),
  });
  record(
    "Teams endpoint returns a grounded answer",
    teams.status === 200 && Boolean(teams.body?.answer) && (teams.body?.sources?.length ?? 0) > 0,
    teams.body?.error || `${teams.body?.sources?.length ?? 0} source(s)`
  );

  // 8. Leadership insights across all twins
  const insights = await sse("/api/twinops/insights", { question: "What are the biggest risks this sprint?", filters: { teams: [] } });
  const responses = insights.events.filter((e) => e.type === "employee_response");
  const agg = insights.events.find((e) => e.type === "aggregation");
  record("Insights: every active twin responds", responses.length === twins.filter((t) => t.status === "active").length, `${responses.length} response(s)`);
  record("Insights: aggregation produced", Boolean(agg), agg ? `confidence ${Math.round(agg.data.overallConfidence * 100)}%` : "missing");

  // 9. Onboarding + handoff briefs
  const opts = await json("/api/twinops/onboarding");
  const opt = opts.body?.options?.[0];
  if (opt) {
    const brief = await json("/api/twinops/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opt),
    });
    record("Onboarding brief generated", brief.status === 200 && (brief.body?.brief?.keyDocs?.length ?? 0) > 0, `${brief.body?.brief?.keyDocs?.length ?? 0} docs`);
  }
  const pack = await json("/api/twinops/offboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: twin.id }),
  });
  record("Handoff pack generated", pack.status === 200 && Boolean(pack.body?.pack), `${pack.body?.pack?.keyLinks?.length ?? 0} links`);
}

main()
  .catch((err) => record("Unexpected error", false, err.message))
  .finally(() => {
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed.`);
    process.exitCode = failed > 0 ? 1 : 0;
  });
