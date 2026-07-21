import { execFileSync } from "node:child_process";
import type { GitRecord } from "../types.js";

function git(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function inspectGit(root: string): GitRecord {
  try {
    const commit = git(root, ["rev-parse", "HEAD"]);
    const branch = git(root, ["branch", "--show-current"]) || "detached";
    const dirty = git(root, ["status", "--porcelain"]).length > 0;
    let remote: string | undefined;
    try {
      remote = git(root, ["config", "--get", "remote.origin.url"]) || undefined;
    } catch {
      remote = undefined;
    }
    return { available: true, commit, branch, dirty, remote };
  } catch {
    return { available: false };
  }
}
