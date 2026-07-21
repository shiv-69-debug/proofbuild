import path from "node:path";
import { readdir } from "node:fs/promises";
import { getProofBuildPaths } from "../lib/paths.js";
import { output } from "../lib/output.js";
import { readReceipt } from "../lib/receipt.js";

export async function listCommand(rootOption?: string): Promise<void> {
  const root = path.resolve(rootOption ?? process.cwd());
  const receiptDirectory = getProofBuildPaths(root).receipts;
  let names: string[];
  try {
    names = (await readdir(receiptDirectory)).filter((name) => name.endsWith(".json")).sort().reverse();
  } catch {
    names = [];
  }
  output.heading("ProofBuild receipts");
  if (!names.length) {
    output.warning("No receipts found. Run proofbuild snapshot first.");
    return;
  }
  for (const name of names) {
    const receipt = await readReceipt(path.join(receiptDirectory, name));
    const storage = receipt.filecoin ? `Filecoin ${receipt.filecoin.network}` : "local";
    console.log(`${receipt.id}  ${receipt.project.name}  ${storage}  ${receipt.capsule.fileCount} files`);
  }
}
