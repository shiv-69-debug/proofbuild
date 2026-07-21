import { execFileSync } from "node:child_process";
import path from "node:path";
import { access } from "node:fs/promises";
import { privateKeyToAccount } from "viem/accounts";
import { CONFIG_FILE, loadConfig } from "../lib/config.js";
import { output } from "../lib/output.js";

function commandVersion(command: string, args: string[]): string | undefined {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

export async function doctorCommand(rootOption?: string): Promise<void> {
  const root = path.resolve(rootOption ?? process.cwd());
  output.heading("ProofBuild doctor");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor >= 22) output.success(`Node.js ${process.versions.node}`);
  else output.warning(`Node.js ${process.versions.node}; version 22+ is recommended`);

  const git = commandVersion("git", ["--version"]);
  if (git) output.success(git);
  else output.warning("Git is unavailable; snapshots will omit commit metadata");

  try {
    await access(path.join(root, CONFIG_FILE));
    const config = await loadConfig(root);
    output.success(`${CONFIG_FILE} is valid JSON`);
    output.detail("Network", config.network ?? "calibration");
    output.detail("Build command", config.buildCommand ?? "not configured");
  } catch (error) {
    output.warning(`${CONFIG_FILE} missing or invalid: ${(error as Error).message}`);
  }

  const configuredKey = process.env.PROOFBUILD_PRIVATE_KEY ?? process.env.FILECOIN_PRIVATE_KEY;
  if (configuredKey) {
    output.success("Filecoin private key environment variable is set");
    try {
      const normalized = configuredKey.startsWith("0x") ? configuredKey : `0x${configuredKey}`;
      output.detail("Wallet", privateKeyToAccount(normalized as `0x${string}`).address);
    } catch {
      output.warning("The configured Filecoin private key is not valid hexadecimal");
    }
  } else {
    output.warning("PROOFBUILD_PRIVATE_KEY is not set; local commands work, publish/remote restore will not");
  }
  output.detail("Local workflow", "ready");
}
