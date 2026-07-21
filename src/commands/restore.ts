import os from "node:os";
import path from "node:path";
import { access, mkdir, writeFile } from "node:fs/promises";
import { archivePathFromReceipt, extractCapsule } from "../lib/archive.js";
import { downloadCapsule } from "../lib/filecoin.js";
import { sha256File } from "../lib/hash.js";
import { output } from "../lib/output.js";
import { projectRootFromReceipt, readReceipt, resolveReceipt } from "../lib/receipt.js";

export async function restoreCommand(reference: string, outputOption?: string): Promise<void> {
  const receiptPath = await resolveReceipt(reference, process.cwd());
  const root = projectRootFromReceipt(receiptPath);
  const receipt = await readReceipt(receiptPath);
  let archivePath = archivePathFromReceipt(root, receipt.capsule.archiveFile);
  try {
    await access(archivePath);
  } catch {
    if (!receipt.filecoin) throw new Error("Local capsule is missing and the receipt has no Filecoin record.");
    const tempDir = path.join(os.tmpdir(), "proofbuild");
    await mkdir(tempDir, { recursive: true });
    archivePath = path.join(tempDir, `${receipt.id}.tgz`);
    output.step("Local capsule missing; downloading from Filecoin");
    const bytes = await downloadCapsule(receipt.filecoin.pieceCid, receipt.filecoin.network, receipt.filecoin.withCDN);
    await writeFile(archivePath, bytes);
  }
  const actual = await sha256File(archivePath);
  if (actual !== receipt.capsule.sha256) throw new Error("Capsule failed SHA-256 verification; refusing to restore.");
  const outputPath = path.resolve(outputOption ?? path.join(process.cwd(), `restored-${receipt.id}`));
  await extractCapsule(archivePath, outputPath);
  output.success("Capsule verified and restored");
  output.detail("Output", outputPath);
}
