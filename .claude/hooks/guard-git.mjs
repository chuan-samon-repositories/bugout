#!/usr/bin/env node
// PreToolUse hook: protects the production (master) and test (develop) branches. See CLAUDE.md
// "Branches and releases". Reads the tool call as JSON on stdin and prints a permission decision:
// - deny: force-pushing, deleting or mirror-pushing master/develop;
// - ask:  any other push to master (a human confirms every production change);
// - nothing (allowed): everything else.
// It never blocks a tool call because of its own error.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PRODUCTION = "master";
export const PROTECTED = ["master", "develop"];

const FORCE_FLAGS = /^(-f|--force|--force-with-lease(=.*)?|--force-if-includes)$/;
const DELETE_FLAGS = /^(-d|--delete)$/;

/** Splits a shell command into simple commands and each into rough whitespace tokens (quotes stripped). */
function commands(command) {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map((part) => part.trim().split(/\s+/).map((token) => token.replace(/^['"]|['"]$/g, "")).filter(Boolean));
}

const branchOf = (ref, currentBranch) => {
  const name = ref.replace(/^refs\/heads\//, "");
  return name === "HEAD" || name === "@" ? currentBranch : name;
};

/** Git options that take a separate value (`git -C dir push`, `git -c key=value push`). */
const GIT_OPTIONS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);

/** Arguments after `push` in a `git … push …` command, or null when it is not a push. */
function pushArgs(tokens) {
  const git = tokens.findIndex((token) => token === "git" || token.endsWith("/git"));
  if (git === -1) return null;
  let i = git + 1;
  while (i < tokens.length && tokens[i].startsWith("-")) i += GIT_OPTIONS_WITH_VALUE.has(tokens[i]) ? 2 : 1;
  return tokens[i] === "push" ? tokens.slice(i + 1) : null;
}

/** What a `git push` does to each branch: [{ branch, force, remove }]. */
export function pushTargets(args, currentBranch) {
  const options = args.filter((arg) => arg.startsWith("-"));
  const positionals = args.filter((arg) => !arg.startsWith("-"));
  const force = options.some((option) => FORCE_FLAGS.test(option));
  const remove = options.some((option) => DELETE_FLAGS.test(option));
  if (options.includes("--mirror")) return PROTECTED.map((branch) => ({ branch, force: true, remove: true }));
  if (options.includes("--all")) return PROTECTED.map((branch) => ({ branch, force, remove: false }));

  const refspecs = positionals.slice(1); // the first positional is the remote
  if (refspecs.length === 0) return currentBranch ? [{ branch: currentBranch, force, remove }] : [];
  return refspecs.map((spec) => {
    const plus = spec.startsWith("+");
    const bare = plus ? spec.slice(1) : spec;
    const colon = bare.indexOf(":");
    const dest = colon === -1 ? bare : bare.slice(colon + 1);
    return { branch: branchOf(dest, currentBranch), force: force || plus, remove: remove || (colon === 0) };
  });
}

const deny = (reason) => ({ decision: "deny", reason });
const ask = (reason) => ({ decision: "ask", reason });

/** Decision for one tool call, or null to allow it. */
export function decide({ tool_name: tool = "", tool_input: input = {} }, currentBranch) {
  if (tool === "Bash" && typeof input.command === "string") {
    let result = null;
    for (const tokens of commands(input.command)) {
      const args = pushArgs(tokens);
      if (!args) continue;
      for (const { branch, force, remove } of pushTargets(args, currentBranch)) {
        if (!PROTECTED.includes(branch)) continue;
        if (remove) return deny(`Deleting ${branch} is not allowed (CLAUDE.md, "Branches and releases").`);
        if (force) return deny(`Force-pushing ${branch} rewrites shared history and is not allowed (CLAUDE.md, "Branches and releases").`);
        if (branch === PRODUCTION) {
          result = ask(
            "This pushes to master, the PRODUCTION branch (bugout.es). Confirm only if it is a confirmed hotfix, or a release of develop that a human checked on test.bugout.es.",
          );
        }
      }
    }
    return result;
  }
  if (/^mcp__.*github.*__(push_files|create_or_update_file|delete_file)$/.test(tool) && input.branch === PRODUCTION) {
    return ask("This commits directly to master, the PRODUCTION branch (bugout.es) on GitHub.");
  }
  if (/^mcp__.*github.*__merge_pull_request$/.test(tool)) {
    return ask("Merging a pull request can change master or develop. Confirm that its base branch and content are approved.");
  }
  return null;
}

function currentBranchIn(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);
  const result = decide(input, currentBranchIn(input.cwd || process.cwd()));
  if (!result) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: result.decision, permissionDecisionReason: result.reason },
    }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(() => process.exit(0));
}
