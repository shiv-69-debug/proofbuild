import path from "node:path";
import type { NetworkName } from "../types.js";
import { archivePathFromReceipt } from "../lib/archive.js";
import { loadConfig } from "../lib/config.js";
import { uploadCapsule } from "../lib/filecoin.js";
import { output } from "../lib/output.js";
import { projectRootFromReceipt, readReceipt, resolveReceipt, writeReceipt } from "../lib/receipt.js";
import { writeReceiptViewer } from "../lib/viewer.js";

export async function publishCommand(
  reference: string,
  options: { network?: NetworkName; withCdn?: boolean },
): Promise<void> {
  const receiptPath = await resolveReceipt(reference, process.cwd());
  const root = projectRootFromReceipt(receiptPath);
  const receipt = await readReceipt(receiptPath);
  const config = await loadConfig(root);
  const network = options.network ?? config.network ?? "calibration";
  const withCDN = options.withCdn ?? config.withCDN ?? false;
  const archivePath = archivePathFromReceipt(root, receipt.capsule.archiveFile);
  output.heading(`Publishing ${receipt.id}`);
  receipt.filecoin = await uploadCapsule(archivePath, network, withCDN);
  await writeReceipt(receiptPath, receipt);
  await writeReceiptViewer(receiptPath, receipt);
  output.success("Capsule published to Filecoin Onchain Cloud");
  output.detail("Piece CID", receipt.filecoin.pieceCid);
  output.detail("Network", receipt.filecoin.network);
  output.detail("Copies", receipt.filecoin.copies.length);
}
