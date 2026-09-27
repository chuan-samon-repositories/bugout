import { describe, expect, it } from "vitest";
import { decide } from "./guard-git.mjs";

const bash = (command, branch = "develop") => decide({ tool_name: "Bash", tool_input: { command } }, branch)?.decision ?? "allow";

describe("guard-git hook", () => {
  it("asks before any push that lands on master", () => {
    expect(bash("git push origin master")).toBe("ask");
    expect(bash("git push -u origin master")).toBe("ask");
    expect(bash("git push origin HEAD:master")).toBe("ask");
    expect(bash("git push origin develop:refs/heads/master")).toBe("ask");
    expect(bash("git push", "master")).toBe("ask");
    expect(bash("git push origin HEAD", "master")).toBe("ask");
    expect(bash("npm test && git -C /repo push origin master")).toBe("ask");
  });

  it("allows pushes to develop and to temporary branches", () => {
    expect(bash("git push origin develop")).toBe("allow");
    expect(bash("git push origin HEAD:develop", "claude/fix-x")).toBe("allow");
    expect(bash("git push -u origin claude/fix-x", "claude/fix-x")).toBe("allow");
    expect(bash("git push origin --delete claude/fix-x")).toBe("allow");
    expect(bash("git push origin :claude/fix-x")).toBe("allow");
    expect(bash("git status && git log --oneline -3")).toBe("allow");
  });

  it("denies force-pushing, deleting or mirroring master and develop", () => {
    expect(bash("git push --force origin develop")).toBe("deny");
    expect(bash("git push -f origin master")).toBe("deny");
    expect(bash("git push --force-with-lease origin HEAD:develop")).toBe("deny");
    expect(bash("git push origin +HEAD:master")).toBe("deny");
    expect(bash("git push origin --delete develop")).toBe("deny");
    expect(bash("git push origin :master")).toBe("deny");
    expect(bash("git push --mirror origin")).toBe("deny");
    expect(bash("git push --force", "develop")).toBe("deny");
  });

  it("allows force-pushing a temporary branch", () => {
    expect(bash("git push --force-with-lease origin claude/fix-x", "claude/fix-x")).toBe("allow");
  });

  it("asks before GitHub API commits to master and before merging pull requests", () => {
    const github = (tool, input) => decide({ tool_name: tool, tool_input: input }, "develop")?.decision ?? "allow";
    expect(github("mcp__github__push_files", { branch: "master" })).toBe("ask");
    expect(github("mcp__github__create_or_update_file", { branch: "master" })).toBe("ask");
    expect(github("mcp__github__push_files", { branch: "develop" })).toBe("allow");
    expect(github("mcp__github__merge_pull_request", { pullNumber: 3 })).toBe("ask");
    expect(github("mcp__github__list_branches", {})).toBe("allow");
  });
});
