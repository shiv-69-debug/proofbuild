#!/usr/bin/env node
import { Command, Option } from "commander";
import pc from "picocolors";
import type { NetworkName } from "./types.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { publishCommand } from "./commands/publish.js";
import { restoreCommand } from "./commands/restore.js";
import { snapshotCommand } from "./commands/snapshot.js";
import { verifyCommand } from "./commands/verify.js";
import { viewCommand } from "./commands/view.js";
import { createWalletCommand } from "./commands/wallet.js";
import { demoCommand } from "./commands/demo.js";

try {
  process.loadEnvFile(".env.proofbuild");
} catch {
  // The wallet file is optional; environment variables still work normally.
}

const program = new Command();
program
  .name("proofbuild")
  .description("Verifiable build capsules backed by Filecoin Onchain Cloud")
  .version("0.1.0")
  .showSuggestionAfterError();

program.command("init")
  .description("Initialize ProofBuild in a project")
  .option("--root <path>", "project directory")
  .action(async (options) => initCommand(options.root));

program.command("demo")
  .description("Download and verify ProofBuild's public Filecoin capsule")
  .action(async () => demoCommand());

program.command("snapshot")
  .description("Create a hashed, restorable build capsule")
  .option("--root <path>", "project directory")
  .option("--command <command>", "build or test command to record")
  .option("--no-build", "skip the configured build command")
  .option("--publish", "publish the capsule to Filecoin Onchain Cloud")
  .addOption(new Option("--network <network>", "Filecoin network").choices(["calibration", "mainnet"]))
  .option("--with-cdn", "enable Filecoin Beam retrieval")
  .option("--notes <text>", "human-readable snapshot notes")
  .option("--ai-log <path>", "attach an AI prompt or coding-session log to the capsule")
  .option("--allow-failed-build", "create a capsule even when the build command fails")
  .action(async (options) => {
    await snapshotCommand({
      root: options.root,
      command: options.command,
      noBuild: options.build === false,
      publish: options.publish,
      network: options.network as NetworkName | undefined,
      withCdn: options.withCdn,
      notes: options.notes,
      aiLog: options.aiLog,
      allowFailedBuild: options.allowFailedBuild,
    });
  });

program.command("publish")
  .description("Publish an existing local capsule to Filecoin")
  .argument("<receipt>", "receipt ID or JSON path")
  .addOption(new Option("--network <network>", "Filecoin network").choices(["calibration", "mainnet"]))
  .option("--with-cdn", "enable Filecoin Beam retrieval")
  .action(async (receipt, options) => publishCommand(receipt, {
    network: options.network as NetworkName | undefined,
    withCdn: options.withCdn,
  }));

program.command("verify")
  .description("Verify capsule integrity and optionally source or remote storage")
  .argument("<receipt>", "receipt ID or JSON path")
  .option("--remote", "download from Filecoin and compare its SHA-256")
  .option("--source", "compare the current source tree to the manifest")
  .action(async (receipt, options) => verifyCommand(receipt, options));

program.command("restore")
  .description("Verify and restore a capsule locally or from Filecoin")
  .argument("<receipt>", "receipt ID or JSON path")
  .option("--output <path>", "restore destination")
  .action(async (receipt, options) => restoreCommand(receipt, options.output));

program.command("list")
  .description("List project build receipts")
  .option("--root <path>", "project directory")
  .action(async (options) => listCommand(options.root));

program.command("view")
  .description("Open a receipt dashboard")
  .argument("[receipt]", "receipt ID or JSON path; defaults to latest")
  .action(async (receipt) => viewCommand(receipt));

program.command("doctor")
  .description("Check local and Filecoin publishing prerequisites")
  .option("--root <path>", "project directory")
  .action(async (options) => doctorCommand(options.root));

program.command("wallet")
  .description("Manage a local Filecoin test wallet")
  .command("create")
  .description("Create a private wallet file for Calibration testing")
  .option("--output <path>", "private environment file", ".env.proofbuild")
  .action(async (options) => createWalletCommand(options.output));

program.parseAsync().catch((error: unknown) => {
  console.error(`\n${pc.red(pc.bold("ProofBuild failed:"))} ${(error as Error).message}`);
  process.exitCode = 1;
});
