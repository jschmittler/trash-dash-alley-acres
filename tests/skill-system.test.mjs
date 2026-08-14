import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CANONICAL_SKILLS,
  REQUIRED_SKILL_REFERENCES,
  validateSkillSystem,
} from "../scripts/validate-skills.mjs";

async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "trash-dash-skills-"));
  await mkdir(path.join(root, ".skills"), { recursive: true });

  const registryRows = [];
  for (const skill of CANONICAL_SKILLS) {
    const directory = path.join(root, ".skills", skill);
    await mkdir(path.join(directory, "agents"), { recursive: true });
    const references = REQUIRED_SKILL_REFERENCES[skill]
      .map((reference) => `- Also apply [${reference}](${reference}) when applicable.`)
      .join("\n");
    await writeFile(
      path.join(directory, "SKILL.md"),
      `---\nname: ${skill}\ndescription: Canonical ${skill} instructions used for tests.\n---\n\n# ${skill}\n\n${references}\n\nThis canonical skill contains complete repository-local instructions.\n`,
    );
    await writeFile(
      path.join(directory, "agents", "openai.yaml"),
      `interface:\n  display_name: "${skill}"\n  short_description: "Canonical project workflow guidance."\n  default_prompt: "Use $${skill} for this Trash Dash task."\n`,
    );
    registryRows.push(`| ${skill} | \`${skill}/SKILL.md\` | domain | applicable work | related |`);
  }

  await writeFile(
    path.join(root, ".skills", "README.md"),
    `# Trash Dash Skills\n\nThese are mandatory project instructions.\n\n| Skill | Location | Governs | Mandatory When | Related Skills |\n|---|---|---|---|---|\n${registryRows.join("\n")}\n\nRendering / Asset Integrity is the mandatory middle layer. Visual QA is the final verification gate.\n`,
  );
  await writeFile(
    path.join(root, "AGENTS.md"),
    `# Project\n\n## Trash Dash Skills\n\nRead .skills/README.md. Before substantial implementation work, read every applicable SKILL.md. Any visual asset work MUST use Rendering / Asset Integrity. After meaningful visual work MUST use Visual QA. For music/audio work USE Conductor. For rescoring USE Conductor + Visual QA.\n`,
  );
  return root;
}

test("a complete self-contained canonical skill system validates", async () => {
  const root = await makeFixture();
  assert.deepEqual(await validateSkillSystem(root), []);
});

test("missing skills and broken relative skill links fail validation", async () => {
  const root = await makeFixture();
  const file = path.join(root, ".skills", "animation", "SKILL.md");
  await writeFile(file, `${await readFile(file, "utf8")}\n[Missing](../missing/SKILL.md)\n`);
  const errors = await validateSkillSystem(root);
  assert.ok(errors.some((error) => error.includes("broken SKILL.md reference")), errors.join("\n"));
});

test("canonical skills reject local-machine and conversation-only references", async () => {
  const root = await makeFixture();
  const file = path.join(root, ".skills", "sprite-art", "SKILL.md");
  await writeFile(file, `${await readFile(file, "utf8")}\nSee previous conversation at /Users/example/Desktop/art.png.\n`);
  const errors = await validateSkillSystem(root);
  assert.ok(errors.some((error) => error.includes("absolute local-machine path")), errors.join("\n"));
  assert.ok(errors.some((error) => error.includes("conversation-dependent language")), errors.join("\n"));
});

test("canonical reference files are self-contained too", async () => {
  const root = await makeFixture();
  const reference = path.join(root, ".skills", "sprite-art", "references", "contract.md");
  await mkdir(path.dirname(reference), { recursive: true });
  await writeFile(reference, "See previous chat and /Users/example/Desktop/source.png.\n");
  const errors = await validateSkillSystem(root);
  assert.ok(errors.some((error) => error.includes("references/contract.md contains an absolute local-machine path")), errors.join("\n"));
  assert.ok(errors.some((error) => error.includes("references/contract.md contains conversation-dependent language")), errors.join("\n"));
});

test("active skill files outside .skills are rejected while deprecated history is allowed", async () => {
  const root = await makeFixture();
  await mkdir(path.join(root, "skills"), { recursive: true });
  const legacy = path.join(root, "skills", "legacy_SKILL.md");
  await writeFile(legacy, "---\nname: legacy\ndescription: active duplicate\n---\n# Legacy\n");
  let errors = await validateSkillSystem(root);
  assert.ok(errors.some((error) => error.includes("active skill-like file outside .skills")), errors.join("\n"));

  await writeFile(legacy, "# DEPRECATED / HISTORICAL\n\nUse `.skills/README.md`. This file is not an active skill.\n");
  errors = await validateSkillSystem(root);
  assert.deepEqual(errors, []);
});

test("linked Git worktrees are excluded from the active project skill scan", async () => {
  const root = await makeFixture();
  const worktreeSkill = path.join(root, ".worktrees", "feature", ".skills", "animation", "SKILL.md");
  await mkdir(path.dirname(worktreeSkill), { recursive: true });
  await writeFile(worktreeSkill, "---\nname: animation\ndescription: Canonical skill in another worktree.\n---\n");
  assert.deepEqual(await validateSkillSystem(root), []);
});
