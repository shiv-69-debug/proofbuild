import path from "node:path";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import type { BuildRecord } from "../types.js";
import { sha256Bytes } from "./hash.js";

export async function runBuildCommand(root: string, command: string, logPath: string): Promise<BuildRecord> {
  const startedAt = Date.now();
  const chunks: Buffer[] = [];
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      env: process.env,
    });
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
  const output = Buffer.concat(chunks);
  await writeFile(logPath, output);
  return {
    command,
    status: exitCode === 0 ? "passed" : "failed",
    exitCode,
    durationMs: Date.now() - startedAt,
    logFile: path.basename(logPath),
    logSha256: sha256Bytes(output),
  };
}
