import path from "node:path";
import { access } from "node:fs/promises";
import { archivePathFromReceipt } from "../lib/archive.js";
import { downloadCapsule, verifyCapsuleOnchain } from "../lib/filecoin.js";
import { sha256Bytes, sha256File } from "../lib/hash.js";
import { output } from "../lib/output.js";
import { projectRootFromReceipt, readReceipt, resolveReceipt } from "../lib/receipt.js";

export async function verifyCommand(
  reference: string,
  options: { remote?: boolean; source?: boolean; onchain?: boolean },
): Promise<void> {
  const receiptPath = await resolveReceipt(reference, process.cwd());
  const root = projectRootFromReceipt(receiptPath);
  const receipt = await readReceipt(receiptPath);
  const archivePath = archivePathFromReceipt(root, receipt.capsule.archiveFile);
  output.heading(`Verifying ${receipt.id}`);

  let localAvailable = true;
  try {
    await access(archivePath);
  } catch {
    localAvailable = false;
  }
  if (localAvailable) {
    const actual = await sha256File(archivePath);
    if (actual !== receipt.capsule.sha256) throw new Error(`Local capsule hash mismatch: ${actual}`);
    output.success("Local capsule hash matches receipt");
  } else {
    output.warning("Local capsule is not available");
  }

  if (options.remote) {
    if (!receipt.filecoin) throw new Error("Receipt has no Filecoin storage record.");
    output.step(`Downloading ${receipt.filecoin.pieceCid} from Filecoin`);
    const bytes = await downloadCapsule(receipt.filecoin.pieceCid, receipt.filecoin.network, receipt.filecoin.withCDN);
    const remoteHash = sha256Bytes(bytes);
    if (remoteHash !== receipt.capsule.sha256) throw new Error(`Remote capsule hash mismatch: ${remoteHash}`);
    output.success("Remote Filecoin capsule matches receipt");
  }

  if (options.onchain) {
    if (!receipt.filecoin) throw new Error("Receipt has no Filecoin storage record.");
    output.step(`Checking ${receipt.filecoin.copies.length} storage copies on the PDP verifier`);
    const statuses = await verifyCapsuleOnchain(receipt.filecoin);
    for (const status of statuses) {
      output.detail(`Provider ${status.providerId}`, `dataset ${status.dataSetId}, piece ${status.pieceId}`);
      output.detail("Dataset live", status.dataSetLive);
      output.detail("Active pieces", status.activePieceCount);
      if (status.transactionHash) output.detail("Storage tx", status.transactionHash);
      if (status.transactionConfirmed !== undefined) output.detail("Tx status", "confirmed");
      if (status.dataSetLastProven) output.detail("Last PDP proof", status.dataSetLastProven);
      if (status.dataSetNextProofDue) output.detail("Next PDP proof", status.dataSetNextProofDue);
      if (status.isProofOverdue !== undefined) output.detail("Proof overdue", status.isProofOverdue);
    }
    output.success("On-chain PDP records match the receipt");
  }

  if (options.source) {
    let matches = 0;
    const changed: string[] = [];
    const missing: string[] = [];
    for (const file of receipt.files) {
      const sourcePath = path.join(root, file.path);
      try {
        const actual = await sha256File(sourcePath);
        if (actual === file.sha256) matches += 1;
        else changed.push(file.path);
      } catch {
        missing.push(file.path);
      }
    }
    output.detail("Files matched", `${matches}/${receipt.files.length}`);
    if (changed.length) output.warning(`Changed: ${changed.slice(0, 10).join(", ")}`);
    if (missing.length) output.warning(`Missing: ${missing.slice(0, 10).join(", ")}`);
    if (changed.length || missing.length) throw new Error("Current source tree does not match the receipt.");
    output.success("Current source tree matches manifest");
  }
}
