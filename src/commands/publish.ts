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
  receipt.filecoin = await uploadCapsule(archivePath, network, withCDN, {
    proofbuildReceiptId: receipt.id,
    capsuleSha256: receipt.capsule.sha256,
    project: receipt.project.name,
  });
  await writeReceipt(receiptPath, receipt);
  await writeReceiptViewer(receiptPath, receipt);
  output.success("Capsule published to Filecoin Onchain Cloud");
  output.detail("Piece CID", receipt.filecoin.pieceCid);
  output.detail("Network", receipt.filecoin.network);
  output.detail("Publisher", receipt.filecoin.publisher);
  if (receipt.filecoin.preparationTransactionHash) {
    output.detail("Funding tx", receipt.filecoin.preparationTransactionHash);
  }
  output.detail("Copies", receipt.filecoin.copies.length);
  for (const copy of receipt.filecoin.copies) {
    output.detail(`Provider ${copy.providerId}`, `dataset ${copy.dataSetId}, piece ${copy.pieceId}`);
    if (copy.transactionHash) output.detail("Storage tx", copy.transactionHash);
  }
}
