import type { FilecoinRecord } from "../types.js";
import { downloadCapsule, verifyCapsuleOnchain } from "../lib/filecoin.js";
import { sha256Bytes } from "../lib/hash.js";
import { output } from "../lib/output.js";

const DEMO = {
  pieceCid: "bafkzcibeu3xbgd2arlsl5ydi42xcbaci554duvmxrjqiiqf7vltffd2wcmrv4bi2dq",
  sha256: "0fadc49a16189d55af95a6805c6fec03a2db74e0b9c0df8341487b1b84041ccc",
  bytes: 714_970,
  files: 122,
  providers: 2,
  filecoin: {
    network: "calibration",
    publisher: "0x4Ce9FD2D0C4bDB4Bbc4bC5A4cFf102476696dE59",
    pieceCid: "bafkzcibeu3xbgd2arlsl5ydi42xcbaci554duvmxrjqiiqf7vltffd2wcmrv4bi2dq",
    size: "714970",
    complete: true,
    copies: [
      {
        providerId: "4",
        dataSetId: "20893",
        pieceId: "1",
        transactionHash: "0xc132eec4974bb85290a31c2c71b75afc635289ee389bd9a4f0a9dfa3072579f9",
      },
      {
        providerId: "2",
        dataSetId: "20892",
        pieceId: "1",
        transactionHash: "0x88140981d7dd58c58723860ba7cb567e4a08b3b846dc6a6765fc4fc2899ecd7a",
      },
    ],
    failedAttempts: 0,
    uploadedAt: "2026-07-21T12:32:03.162Z",
    withCDN: false,
  } satisfies FilecoinRecord,
} as const;

export async function demoCommand(): Promise<void> {
  output.heading("ProofBuild live Filecoin demo");
  output.detail("Network", "Filecoin Calibration");
  output.detail("Piece CID", DEMO.pieceCid);
  output.detail("Providers", DEMO.providers);
  output.detail("Manifest", `${DEMO.files} files`);
  output.step("Downloading the public build capsule from Filecoin");
  const bytes = await downloadWithRetries();
  if (bytes.byteLength !== DEMO.bytes) {
    throw new Error(`Downloaded size mismatch: expected ${DEMO.bytes}, received ${bytes.byteLength}`);
  }
  const actualHash = sha256Bytes(bytes);
  if (actualHash !== DEMO.sha256) {
    throw new Error(`SHA-256 mismatch: expected ${DEMO.sha256}, received ${actualHash}`);
  }
  output.success("Downloaded capsule matches the published receipt");
  output.detail("Bytes", bytes.byteLength);
  output.detail("SHA-256", actualHash);
  output.step("Checking datasets, pieces, and PDP proof schedules on-chain");
  const statuses = await verifyCapsuleOnchain(DEMO.filecoin);
  for (const status of statuses) {
    output.detail(`Provider ${status.providerId}`, `dataset ${status.dataSetId}, piece ${status.pieceId}`);
    if (status.transactionHash) output.detail("Storage tx", status.transactionHash);
    if (status.transactionConfirmed !== undefined) output.detail("Tx status", "confirmed");
    output.detail("Last PDP proof", status.dataSetLastProven ?? "pending first proof");
    output.detail("Proof overdue", status.isProofOverdue);
  }
  output.success("Live Filecoin download and PDP verification passed");
}

async function downloadWithRetries(): Promise<Uint8Array> {
  const attempts = [false, false, true] as const;
  let lastError: unknown;
  for (let index = 0; index < attempts.length; index += 1) {
    const withCDN = attempts[index] ?? false;
    try {
      return await downloadCapsule(DEMO.pieceCid, "calibration", withCDN);
    } catch (error) {
      lastError = error;
      if (index < attempts.length - 1) {
        const nextMethod = (attempts[index + 1] ?? false) ? " with Filecoin Beam" : "";
        output.warning(`Retrieval attempt ${index + 1} failed; retrying${nextMethod}`);
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  }
  throw lastError;
}
