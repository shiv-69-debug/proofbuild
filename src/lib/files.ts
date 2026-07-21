import path from "node:path";
import { stat } from "node:fs/promises";
import fg from "fast-glob";
import type { FileRecord, ProofBuildConfig } from "../types.js";
import { sha256File } from "./hash.js";

const DEFAULT_EXCLUDES = [
  "node_modules/**",
  ".git/**",
  ".proofbuild/**",
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  ".DS_Store",
  "Thumbs.db",
];

export async function collectFiles(root: string, config: ProofBuildConfig): Promise<FileRecord[]> {
  const matches = await fg(config.include?.length ? config.include : ["**/*"], {
    cwd: root,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
    unique: true,
    ignore: [...DEFAULT_EXCLUDES, ...(config.exclude ?? [])],
  });

  const files = matches.sort((left, right) => left.localeCompare(right));
  return Promise.all(
    files.map(async (relativePath) => {
      const absolutePath = path.join(root, relativePath);
      const fileStat = await stat(absolutePath);
      return {
        path: relativePath.replaceAll("\\", "/"),
        bytes: fileStat.size,
        sha256: await sha256File(absolutePath),
      };
    }),
  );
}
