import path from "node:path";
import { writeFile } from "node:fs/promises";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { output } from "../lib/output.js";

export async function createWalletCommand(outputOption?: string): Promise<void> {
  const outputPath = path.resolve(outputOption ?? ".env.proofbuild");
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const content = [
    "# Local ProofBuild wallet. Never commit or share this file.",
    `PROOFBUILD_PRIVATE_KEY=${privateKey}`,
    "",
  ].join("\n");
  await writeFile(outputPath, content, { flag: "wx", mode: 0o600 });
  output.success("Created a local ProofBuild wallet");
  output.detail("Address", account.address);
  output.detail("Key file", outputPath);
  output.detail("Network", "Calibration testnet recommended");
  output.warning("Fund this address with Calibration tFIL and tUSDFC before publishing.");
}
