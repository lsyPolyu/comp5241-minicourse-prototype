import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as publicActivity from "@/content/activities/client-interview";
import { clientInterview, clientInterviewIntroduction } from "@/content/activities/client-interview";
import { courseRegistry } from "@/content/courses/registry";
import { summaryFieldIds } from "@/domain/course";

vi.mock("server-only", () => ({}));
import { factIdSchema, factIds, scenarioSchema } from "@/server/scenarios/schema";
import { clubSignupScenario } from "@/server/scenarios/club-signup";

const document = readFileSync(new URL("../../docs/SCENARIO.md", import.meta.url), "utf8");
function tableRows(section: number) {
  return document.split(new RegExp(`^## ${section}\\.`, "m"))[1].split(/^## /m)[0]
    .split(/\r?\n/).filter((line) => line.startsWith("| "))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter(([cell]) => !/^:?-+:?$/.test(cell));
}

function nodeImport(path: string, printExports = false) {
  const url = new URL(`../../${path}`, import.meta.url).href;
  return spawnSync(process.execPath, ["--import=tsx", "--input-type=module", "-e",
    `const module = await import(${JSON.stringify(url)});${printExports ? "console.log(JSON.stringify(module));" : ""}`,
  ], { encoding: "utf8", timeout: 10000, env: { ...process.env, NODE_OPTIONS: "" } });
}

describe("fixed scenario identity and public introduction", () => {
  it("registers the public activity without private data", () => {
    expect(courseRegistry[clientInterview.courseId].activities).toEqual([clientInterview]);
    expect(clientInterview.scenarioId).toBe(clientInterviewIntroduction.scenarioId);
    expect(Object.keys(clientInterviewIntroduction)).toEqual(["scenarioId", "version", "client", "initialRequest"]);
    expect(clientInterviewIntroduction.client).toEqual({ name: "Maya", role: "university board-game club organizer" });
    expect(clientInterviewIntroduction.version).toBe(1);
  });

  it("allows exactly the ten frozen fact IDs", () => {
    expect(factIds).toHaveLength(10);
    for (const id of factIds) expect(factIdSchema.parse(id)).toBe(id);
    for (const id of ["F00", "F11", "F1", "users", "toString"]) {
      expect(factIdSchema.safeParse(id).success).toBe(false);
    }
  });

  it("keeps the public prompt seed identical to the frozen opening", () => {
    expect(clientInterviewIntroduction.initialRequest).toBe(document.match(/^> (.+)$/m)![1].trim());
    expect(clubSignupScenario.scenarioId).toBe(clientInterviewIntroduction.scenarioId);
    expect(clubSignupScenario.version).toBe(clientInterviewIntroduction.version);
  });

  it("serializes only public metadata without hidden wording, values or answers", () => {
    expect(Object.keys(publicActivity).sort()).toEqual(["clientInterview", "clientInterviewIntroduction"]);
    const serialized = JSON.stringify({ publicActivity, courseRegistry });
    for (const [id, fact] of Object.entries(clubSignupScenario.facts)) {
      expect(serialized).not.toContain(id);
      expect(serialized).not.toContain(fact.clientWording);
      expect(serialized).not.toContain(fact.disclosureConstraint);
    }
    expect(serialized).not.toMatch(/20 places|two weeks|CSV download|university email|waiting list|SC-AC-|rubric|clientWording/);
    for (const reference of Object.values(clubSignupScenario.rubric)) {
      expect(serialized).not.toContain(reference.strong);
      expect(serialized).not.toContain(reference.partialOrMissing);
    }
  });

  it("imports the entire public activity dependency graph without server privileges", () => {
    const result = nodeImport("src/content/activities/client-interview.ts", true);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ clientInterview, clientInterviewIntroduction });
  });
});

describe("private versioned scenario reference", () => {
  it("matches all ten frozen fact groups, disclosure guidance and wording exactly", () => {
    const rows = tableRows(3).filter(([id]) => /^F\d{2} /.test(id));
    expect(rows).toHaveLength(10);
    expect(Object.keys(clubSignupScenario.facts)).toEqual(factIds);
    for (const [identity, wording, elicitedBy, disclosureConstraint] of rows) {
      const [id, topic] = identity.split(" ");
      expect(clubSignupScenario.facts[factIdSchema.parse(id)]).toEqual({
        topic, clientWording: wording.slice(1, -1), elicitedBy, disclosureConstraint,
      });
    }
    expect(document).toContain(clubSignupScenario.background);
    expect(document).toContain(clubSignupScenario.referenceUserFlow.description);
    expect(document).toContain(clubSignupScenario.outOfScope.description);
  });

  it("preserves Must / Should / Could and their reasons without promoting optional work", () => {
    for (const [label, description, reason] of tableRows(5).filter(([label]) => ["Must", "Should", "Could"].includes(label))) {
      const key = label.toLowerCase() as keyof typeof clubSignupScenario.priorities;
      expect(clubSignupScenario.priorities[key]).toEqual([expect.objectContaining({ description, reason })]);
    }
    expect(clubSignupScenario.priorities.should[0].factIds).toEqual(["F09"]);
    expect(clubSignupScenario.priorities.could[0].factIds).toEqual(["F09"]);
  });

  it("retains all seven case acceptance criteria and valid fact references", () => {
    const rows = tableRows(7).filter(([id]) => id.startsWith("SC-AC-"));
    expect(rows).toHaveLength(7);
    expect(Object.entries(clubSignupScenario.acceptanceCriteria).map(([id, { description }]) => [id, description])).toEqual(rows);
    expect(scenarioSchema.safeParse(clubSignupScenario).success).toBe(true);
  });

  it("provides a separate questioning rubric and all eight summary references from the frozen document", () => {
    const keys = ["questioning", ...summaryFieldIds] as const;
    const rows = tableRows(10).slice(1);
    expect(rows).toHaveLength(9);
    expect(Object.keys(clubSignupScenario.rubric)).toEqual(keys);
    rows.forEach(([, strong, partialOrMissing], index) => {
      expect(clubSignupScenario.rubric[keys[index]]).toMatchObject({ strong, partialOrMissing });
    });
    expect(Object.fromEntries(summaryFieldIds.map((key) => [key, clubSignupScenario.rubric[key].factIds]))).toEqual({
      targetUser: ["F01"], userGoal: ["F02"], coreRequirements: ["F03", "F04", "F05", "F06", "F07"],
      constraints: ["F08"], priorities: ["F09"], userFlow: ["F03", "F04", "F05", "F06", "F07"],
      acceptanceCriteria: ["F03", "F04", "F05", "F06", "F07", "F08"], outOfScope: ["F10"],
    });
  });

  it.each([
    ["unknown scenario", { ...clubSignupScenario, scenarioId: "other-v1" }],
    ["unsupported version", { ...clubSignupScenario, version: 2 }],
    ["missing fact", { ...clubSignupScenario, facts: { ...clubSignupScenario.facts, F10: undefined } }],
    ["unknown fact", { ...clubSignupScenario, facts: { ...clubSignupScenario.facts, F11: clubSignupScenario.facts.F01 } }],
    ["blank wording", { ...clubSignupScenario, facts: { ...clubSignupScenario.facts, F01: { ...clubSignupScenario.facts.F01, clientWording: "  " } } }],
    ["missing rubric dimension", { ...clubSignupScenario, rubric: { ...clubSignupScenario.rubric, constraints: undefined } }],
    ["extra rubric dimension", { ...clubSignupScenario, rubric: { ...clubSignupScenario.rubric, totalScore: clubSignupScenario.rubric.questioning } }],
    ["invalid rubric reference", { ...clubSignupScenario, rubric: { ...clubSignupScenario.rubric, constraints: { ...clubSignupScenario.rubric.constraints, factIds: ["F11"] } } }],
    ["missing case criterion", { ...clubSignupScenario, acceptanceCriteria: { ...clubSignupScenario.acceptanceCriteria, "SC-AC-07": undefined } }],
    ["invalid priority reference", { ...clubSignupScenario, priorities: { ...clubSignupScenario.priorities, should: [{ ...clubSignupScenario.priorities.should[0], factIds: ["F00"] }] } }],
    ["empty scope references", { ...clubSignupScenario, outOfScope: { ...clubSignupScenario.outOfScope, factIds: [] } }],
    ["duplicate references", { ...clubSignupScenario, referenceUserFlow: { ...clubSignupScenario.referenceUserFlow, factIds: ["F03", "F03"] } }],
  ])("rejects %s before a consumer can use the reference", (_, candidate) => {
    expect(scenarioSchema.safeParse(candidate).success).toBe(false);
  });

  it("freezes facts and rubric references against mutation between requests", () => {
    expect(Object.isFrozen(clubSignupScenario)).toBe(true);
    expect(Object.isFrozen(clubSignupScenario.facts)).toBe(true);
    expect(Object.isFrozen(clubSignupScenario.facts.F04)).toBe(true);
    expect(Object.isFrozen(clubSignupScenario.rubric.constraints)).toBe(true);
    expect(Object.isFrozen(clubSignupScenario.rubric.constraints.factIds)).toBe(true);
    expect(Reflect.set(clubSignupScenario.facts.F04, "clientWording", "30 places")).toBe(false);
  });

  it.each(["schema.ts", "club-signup.ts"])("rejects ordinary Node import of the private %s entry", (file) => {
    const result = nodeImport(`src/server/scenarios/${file}`);
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("This module cannot be imported from a Client Component module");
  });
});
