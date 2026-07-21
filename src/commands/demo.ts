import { downloadCapsule } from "../lib/filecoin.js";
import { sha256Bytes } from "../lib/hash.js";
import { output } from "../lib/output.js";

const DEMO = {
  pieceCid: "bafkzcibe4oxagdb6aazxaflnd47kkym73pv3tvgh7sg34gbvcuhnhxunwobudilade",
  sha256: "3f51d6160f66e450a69943b014829077f08bcf0064347d0e38b715c6999edd14",
  bytes: 74_909,
  files: 116,
  providers: 2,
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
  output.success("Live Filecoin verification passed");
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
