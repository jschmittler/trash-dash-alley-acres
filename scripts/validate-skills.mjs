import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const CANONICAL_SKILLS = Object.freeze([
  "sprite-art",
  "rendering-asset-integrity",
  "animation",
  "environment-placement",
  "overlap-prevention",
  "visual-qa",
  "conductor",
]);

export const REQUIRED_SKILL_REFERENCES = Object.freeze({
  "sprite-art": [
    "../rendering-asset-integrity/SKILL.md",
    "../animation/SKILL.md",
    "../visual-qa/SKILL.md",
  ],
  "rendering-asset-integrity": [
    "../sprite-art/SKILL.md",
    "../animation/SKILL.md",
    "../environment-placement/SKILL.md",
    "../overlap-prevention/SKILL.md",
    "../visual-qa/SKILL.md",
  ],
  animation: [
    "../sprite-art/SKILL.md",
    "../rendering-asset-integrity/SKILL.md",
    "../environment-placement/SKILL.md",
    "../visual-qa/SKILL.md",
  ],
  "environment-placement": [
    "../rendering-asset-integrity/SKILL.md",
    "../overlap-prevention/SKILL.md",
    "../visual-qa/SKILL.md",
  ],
  "overlap-prevention": [
    "../rendering-asset-integrity/SKILL.md",
    "../environment-placement/SKILL.md",
    "../visual-qa/SKILL.md",
  ],
  "visual-qa": [
    "../sprite-art/SKILL.md",
    "../rendering-asset-integrity/SKILL.md",
    "../animation/SKILL.md",
    "../environment-placement/SKILL.md",
    "../overlap-prevention/SKILL.md",
  ],
  conductor: ["../visual-qa/SKILL.md"],
});

const BANNED_CONVERSATION_REFERENCES = [
  "the skill we created earlier",
  "see previous conversation",
  "use the prompt from before",
  "see previous chat",
  "from our earlier conversation",
];

const SKIP_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".vinext",
  ".wrangler",
  ".worktrees",
  "dist",
  "dist-pages",
  "node_modules",
  "public",
]);

async function fileText(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

async function childDirectories(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function findExternalSkillFiles(root) {
  const found = [];
  async function walk(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name) || relative === ".skills") continue;
        await walk(absolute);
      } else if (/^(?:SKILL\.md|.+_SKILL\.md)$/i.test(entry.name)) {
        found.push(relative);
      }
    }
  }
  await walk(root);
  return found.sort();
}

async function findMarkdownFiles(directory) {
  const found = [];
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.name.toLowerCase().endsWith(".md")) found.push(absolute);
    }
  }
  await walk(directory);
  return found.sort();
}

function referencedSkillPaths(markdown) {
  const references = new Set();
  const pattern = /(?:\[[^\]]*\]\(|`)([^`\)\n]*SKILL\.md)(?:\)|`)/g;
  for (const match of markdown.matchAll(pattern)) {
    if (match[1].includes("/") || match[1].includes("\\")) references.add(match[1]);
  }
  return [...references];
}

function hasAbsoluteLocalPath(markdown) {
  return /(?:^|[\s(`])(?:\/Users\/|\/home\/|\/var\/folders\/|[A-Za-z]:\\Users\\)/m.test(markdown);
}

export async function validateSkillSystem(root = process.cwd()) {
  const errors = [];
  const skillsRoot = path.join(root, ".skills");
  const registryPath = path.join(skillsRoot, "README.md");
  const agentsPath = path.join(root, "AGENTS.md");
  const registry = await fileText(registryPath);
  const agents = await fileText(agentsPath);

  if (registry === null) errors.push("missing .skills/README.md");
  if (agents === null) errors.push("missing AGENTS.md");

  const actualDirectories = await childDirectories(skillsRoot);
  for (const directory of actualDirectories) {
    if (!CANONICAL_SKILLS.includes(directory)) {
      errors.push(`unexpected canonical skill directory .skills/${directory}`);
    }
  }

  for (const skill of CANONICAL_SKILLS) {
    const relativeSkillPath = `.skills/${skill}/SKILL.md`;
    const skillPath = path.join(root, relativeSkillPath);
    const metadataPath = path.join(root, `.skills/${skill}/agents/openai.yaml`);
    const source = await fileText(skillPath);
    const metadata = await fileText(metadataPath);

    if (source === null) {
      errors.push(`missing ${relativeSkillPath}`);
      continue;
    }
    if (source.trim().length < 120) errors.push(`${relativeSkillPath} is empty or incomplete`);

    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      errors.push(`${relativeSkillPath} lacks YAML frontmatter`);
    } else {
      const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
      const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
      if (name !== skill) errors.push(`${relativeSkillPath} frontmatter name must be ${skill}`);
      if (!description) errors.push(`${relativeSkillPath} requires a description`);
    }

    if (metadata === null) {
      errors.push(`missing .skills/${skill}/agents/openai.yaml`);
    } else {
      for (const marker of ["interface:", "display_name:", "short_description:", `Use $${skill}`]) {
        if (!metadata.includes(marker)) errors.push(`.skills/${skill}/agents/openai.yaml must contain ${marker}`);
      }
    }

    for (const reference of REQUIRED_SKILL_REFERENCES[skill]) {
      if (!source.includes(reference)) errors.push(`${relativeSkillPath} must reference ${reference}`);
    }
    for (const reference of referencedSkillPaths(source)) {
      if (path.isAbsolute(reference)) {
        errors.push(`${relativeSkillPath} contains absolute SKILL.md reference ${reference}`);
        continue;
      }
      if (!(await isFile(path.resolve(path.dirname(skillPath), reference)))) {
        errors.push(`${relativeSkillPath} has broken SKILL.md reference ${reference}`);
      }
    }
    if (hasAbsoluteLocalPath(source)) errors.push(`${relativeSkillPath} contains an absolute local-machine path`);
    const lower = source.toLowerCase();
    for (const phrase of BANNED_CONVERSATION_REFERENCES) {
      if (lower.includes(phrase)) errors.push(`${relativeSkillPath} contains conversation-dependent language: ${phrase}`);
    }
  }

  if (registry !== null) {
    if (!registry.includes("# Trash Dash Skills")) errors.push(".skills/README.md must be titled Trash Dash Skills");
    for (const skill of CANONICAL_SKILLS) {
      const registryReference = `${skill}/SKILL.md`;
      if (!registry.includes(registryReference)) errors.push(`.skills/README.md must list ${registryReference}`);
    }
    for (const reference of referencedSkillPaths(registry)) {
      if (!(await isFile(path.resolve(skillsRoot, reference)))) {
        errors.push(`.skills/README.md has broken SKILL.md reference ${reference}`);
      }
    }
  }

  for (const markdownPath of await findMarkdownFiles(skillsRoot)) {
    const source = (await fileText(markdownPath)) ?? "";
    const relative = path.relative(root, markdownPath);
    if (hasAbsoluteLocalPath(source)) errors.push(`${relative} contains an absolute local-machine path`);
    const lower = source.toLowerCase();
    for (const phrase of BANNED_CONVERSATION_REFERENCES) {
      if (lower.includes(phrase)) errors.push(`${relative} contains conversation-dependent language: ${phrase}`);
    }
    for (const reference of referencedSkillPaths(source)) {
      if (path.isAbsolute(reference)) {
        errors.push(`${relative} contains absolute SKILL.md reference ${reference}`);
      } else if (!(await isFile(path.resolve(path.dirname(markdownPath), reference)))) {
        errors.push(`${relative} has broken SKILL.md reference ${reference}`);
      }
    }
  }

  if (agents !== null) {
    for (const phrase of [
      ".skills/README.md",
      "Before substantial implementation work",
      "Any visual asset work",
      "MUST use Rendering / Asset Integrity",
      "After meaningful visual work",
      "MUST use Visual QA",
      "For music/audio work",
      "USE Conductor",
      "For rescoring",
      "Conductor + Visual QA",
    ]) {
      if (!agents.includes(phrase)) errors.push(`AGENTS.md must contain ${phrase}`);
    }
  }

  for (const relative of await findExternalSkillFiles(root)) {
    const source = (await fileText(path.join(root, relative))) ?? "";
    if (!/\b(?:DEPRECATED|HISTORICAL)\b/i.test(source) || /^---\n[\s\S]*?^name:/m.test(source)) {
      errors.push(`active skill-like file outside .skills: ${relative}`);
    }
  }

  return [...new Set(errors)].sort();
}

async function runCli() {
  const errors = await validateSkillSystem(process.cwd());
  if (errors.length) {
    console.error("Trash Dash skill validation failed:\n");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${CANONICAL_SKILLS.length} canonical Trash Dash skills and all repository skill references.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
