import test from "node:test";
import assert from "node:assert/strict";
import { buildTeamsAdaptiveCard, sendTeamsAdaptiveCard } from "../lib/integrations/teams.ts";

test("Microsoft Teams Integration - Adaptive Card Payload Construction", () => {
  const card = buildTeamsAdaptiveCard({
    title: "Enterprise Architecture Review",
    subtitle: "TwinOps Digital Twin",
    text: "Review completed with zero breaking dependencies.",
    accentColor: "Good",
    facts: [
      { title: "Status", value: "Approved" },
      { title: "Confidence", value: "98%" },
    ],
    actions: [
      { title: "View Architecture", url: "https://twinops.enterprise.internal/arch" },
    ],
  });

  assert.equal(card.type, "message");
  assert.equal(Array.isArray(card.attachments), true);
  assert.equal(card.attachments.length, 1);

  const attachment = card.attachments[0];
  assert.equal(attachment.contentType, "application/vnd.microsoft.card.adaptive");
  assert.equal(attachment.content.type, "AdaptiveCard");
  assert.equal(attachment.content.version, "1.4");

  // Verify card body components
  const body = attachment.content.body;
  assert.equal(body.length, 3); // ColumnSet, TextBlock, FactSet

  // FactSet verification
  const factSet = body.find((item) => item.type === "FactSet");
  assert.ok(factSet, "FactSet should be present");
  assert.equal(factSet.facts.length, 2);
  assert.equal(factSet.facts[0].title, "Status");
  assert.equal(factSet.facts[0].value, "Approved");

  // Actions verification
  const actions = attachment.content.actions;
  assert.ok(actions, "Actions should be present");
  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, "Action.OpenUrl");
  assert.equal(actions[0].url, "https://twinops.enterprise.internal/arch");
});

test("Microsoft Teams Integration - Webhook URL Validation", async () => {
  // Invalid webhook URL rejection
  const invalidResult = await sendTeamsAdaptiveCard("invalid-url", {
    title: "Test",
    text: "Test",
  });
  assert.equal(invalidResult.success, false);
  assert.match(invalidResult.error, /Invalid Microsoft Teams Webhook URL/i);

  // Empty webhook URL rejection
  const emptyResult = await sendTeamsAdaptiveCard("", {
    title: "Test",
    text: "Test",
  });
  assert.equal(emptyResult.success, false);
  assert.match(emptyResult.error, /Invalid Microsoft Teams Webhook URL/i);
});

test("Jira Integration - ADF description flattens to plain text", async () => {
  const { adfToText } = await import("../lib/integrations/jira.ts");
  const adf = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Migrate the " }, { type: "text", text: "auth service" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Add tests" }] }] }] },
    ],
  };
  const text = adfToText(adf);
  assert.match(text, /Migrate the auth service/);
  assert.match(text, /Add tests/);
  assert.equal(adfToText(null), "");
  assert.equal(adfToText("plain"), "plain");
});

test("Jira Integration - formatJiraIssue formats real-time webhook payload correctly", async () => {
  const { formatJiraIssue } = await import("../lib/integrations/jira.ts");
  const fields = {
    summary: "Refactor Authentication Middleware",
    status: { name: "In Progress" },
    issuetype: { name: "Task" },
    priority: { name: "Highest" },
    project: { key: "AUTH", name: "Authentication Pod" },
    assignee: { displayName: "Lead Architect" },
    description: "Ensure session tokens are validated against Supabase RLS boundaries.",
    comment: {
      comments: [
        { author: { displayName: "Security Officer" }, created: "2026-10-11", body: "Approved pending regression test." }
      ]
    }
  };

  const formatted = formatJiraIssue("AUTH-101", fields, "https://acme.atlassian.net");
  assert.match(formatted.content, /Jira issue AUTH-101: Refactor Authentication Middleware/);
  assert.match(formatted.content, /Status: In Progress/);
  assert.match(formatted.content, /Assignee: Lead Architect/);
  assert.match(formatted.content, /Security Officer/);
  assert.match(formatted.content, /https:\/\/acme\.atlassian\.net\/browse\/AUTH-101/);
  assert.equal(formatted.metadata.issue_key, "AUTH-101");
  assert.equal(formatted.metadata.status, "In Progress");
  assert.equal(formatted.metadata.source, "jira");
});

test("Slack Integration - postSlackMessage network failure handling", async () => {
  const { postSlackMessage } = await import("../lib/integrations/slack.ts");
  // Test invalid token call returns clean error rather than throwing
  const res = await postSlackMessage({
    token: "xoxb-invalid-token",
    channel: "C12345",
    text: "Test message"
  });
  assert.equal(res.ok, false);
  assert.ok(res.error, "Should report Slack error reason");
});

