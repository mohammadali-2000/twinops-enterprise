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
