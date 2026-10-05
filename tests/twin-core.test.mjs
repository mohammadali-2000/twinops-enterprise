import test from "node:test";
import assert from "node:assert/strict";
import { extractSearchTerms, extractIssueKeys } from "../backend/memory/index.ts";
import { parseCloneInput } from "../backend/memory/clone-repository.ts";

test("Search terms drop punctuation and filler words", () => {
  const terms = extractSearchTerms("What is the status of KAN-1? (auth-service)");
  assert.ok(terms.includes("kan-1"));
  assert.ok(terms.includes("auth-service"));
  assert.ok(!terms.includes("what"));
  assert.ok(!terms.includes("status"));
  assert.ok(terms.every((t) => /^[\p{L}\p{N}_-]+$/u.test(t)), "terms must be safe for PostgREST or() filters");
});

test("Jira issue keys are detected in questions", () => {
  assert.deepEqual(extractIssueKeys("Is kan-12 blocked by KAN-7?"), ["KAN-12", "KAN-7"]);
  assert.deepEqual(extractIssueKeys("no tickets here"), []);
});

test("Twin input validation", () => {
  assert.throws(() => parseCloneInput({}, true), /name is required/);
  assert.throws(() => parseCloneInput({ name: "A", github_username: "bad name!" }, true), /GitHub username/);
  assert.throws(() => parseCloneInput({ name: "A", communication_style: "loud" }, true), /communication_style/);
  const parsed = parseCloneInput({ name: " Syed Ali ", expertise_tags: "backend, , api", github_username: "syed-ali" }, true);
  assert.equal(parsed.name, "Syed Ali");
  assert.deepEqual(parsed.expertise_tags, ["backend", "api"]);
  assert.equal(parsed.github_username, "syed-ali");
});
