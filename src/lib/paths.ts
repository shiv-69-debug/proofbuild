import path from "node:path";
import { mkdir } from "node:fs/promises";

export interface ProofBuildPaths {
  base: string;
  capsules: string;
  receipts: string;
  logs: string;
}

export function getProofBuildPaths(root: string): ProofBuildPaths {
  const base = path.join(root, ".proofbuild");
  return {
    base,
    capsules: path.join(base, "capsules"),
    receipts: path.join(base, "receipts"),
    logs: path.join(base, "logs"),
  };
}

export async function ensureProofBuildPaths(root: string): Promise<ProofBuildPaths> {
  const paths = getProofBuildPaths(root);
  await Promise.all([
    mkdir(paths.capsules, { recursive: true }),
    mkdir(paths.receipts, { recursive: true }),
    mkdir(paths.logs, { recursive: true }),
  ]);
  return paths;
}
