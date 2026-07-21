import path from "node:path";
import { access, readFile, writeFile } from "node:fs/promises";
import type { ProofBuildReceipt } from "../types.js";
import { stableJson } from "./hash.js";
import { getProofBuildPaths } from "./paths.js";

export async function writeReceipt(receiptPath: string, receipt: ProofBuildReceipt): Promise<void> {
  await writeFile(receiptPath, stableJson(receipt));
}

export async function resolveReceipt(reference: string, cwd: string): Promise<string> {
  const direct = path.resolve(cwd, reference);
  try {
    await access(direct);
    return direct;
  } catch {
    const candidate = path.join(getProofBuildPaths(cwd).receipts, `${reference}.json`);
    await access(candidate);
    return candidate;
  }
}

export async function readReceipt(receiptPath: string): Promise<ProofBuildReceipt> {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as ProofBuildReceipt;
  if (receipt.schema !== "proofbuild-receipt/v1") {
    throw new Error(`Unsupported receipt schema: ${String(receipt.schema)}`);
  }
  return receipt;
}

export function projectRootFromReceipt(receiptPath: string): string {
  return path.dirname(path.dirname(path.dirname(receiptPath)));
}
