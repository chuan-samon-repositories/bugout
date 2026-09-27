#!/usr/bin/env node
// SessionStart hook: puts the branch rules (CLAUDE.md, "Branches and releases") and the current branch in front
// of every Claude Code session. Whatever it prints becomes session context.
import { execFileSync } from "node:child_process";

let branch = "unknown";
try {
  branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  // Not a git checkout: still print the rules.
}

const where =
  branch === "master"
    ? "master, the PRODUCTION branch (bugout.es)"
    : branch === "develop"
      ? "develop, the TEST branch (test.bugout.es)"
      : `${branch}, a temporary branch: merge it into the confirmed target and delete it before the session ends`;

process.stdout.write(`Bugout branch rules (CLAUDE.md, "Branches and releases"). This session is on ${where}.
- Before changing anything, confirm with the human whether the work targets master (a production hotfix) or develop (anything new). Ask unless their own message names the branch; a pre-selected session branch does not count.
- Work starts and ends on master or develop. Merge and delete any temporary branch before finishing.
- Nothing reaches master without passing develop and a human check on test.bugout.es, except a confirmed hotfix, which is then merged back into develop.
- Changes outside the code (env vars, Vercel, DNS, Shopify, GitHub settings) are Carlos Chuan's: list them under "Needs Carlos".
`);
