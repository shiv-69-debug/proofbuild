import path from "node:path";
import { readdir } from "node:fs/promises";
import open from "open";
import { getProofBuildPaths } from "../lib/paths.js";
import { output } from "../lib/output.js";
import { readReceipt, resolveReceipt } from "../lib/receipt.js";
import { writeReceiptViewer } from "../lib/viewer.js";

export async function viewCommand(reference?: string): Promise<void> {
  let receiptPath: string;
  if (reference) {
    receiptPath = await resolveReceipt(reference, process.cwd());
  } else {
    const directory = getProofBuildPaths(process.cwd()).receipts;
    const latest = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort().at(-1);
    if (!latest) throw new Error("No receipts found.");
    receiptPath = path.join(directory, latest);
  }
  const viewerPath = await writeReceiptViewer(receiptPath, await readReceipt(receiptPath));
  await open(viewerPath);
  output.success(`Opened ${viewerPath}`);
}
