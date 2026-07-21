import path from "node:path";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import type { NetworkName, ProofBuildReceipt } from "../types.js";
import { createCapsule } from "../lib/archive.js";
import { runBuildCommand } from "../lib/build.js";
import { loadConfig } from "../lib/config.js";
import { collectFiles } from "../lib/files.js";
import { uploadCapsule } from "../lib/filecoin.js";
import { inspectGit } from "../lib/git.js";
import { sha256Bytes, sha256File, stableJson } from "../lib/hash.js";
import { createReceiptId } from "../lib/id.js";
import { output } from "../lib/output.js";
import { ensureProofBuildPaths } from "../lib/paths.js";
import { detectProjectName } from "../lib/project.js";
import { writeReceipt } from "../lib/receipt.js";
import { writeReceiptViewer } from "../lib/viewer.js";

export interface SnapshotOptions {
  root?: string;
  command?: string;
  noBuild?: boolean;
  publish?: boolean;
  network?: NetworkName;
  withCdn?: boolean;
  notes?: string;
  aiLog?: string;
  allowFailedBuild?: boolean;
}

export async function snapshotCommand(options: SnapshotOptions): Promise<ProofBuildReceipt> {
  const root = path.resolve(options.root ?? process.cwd());
  const config = await loadConfig(root);
  const paths = await ensureProofBuildPaths(root);
  const id = createReceiptId();
  const projectName = config.projectName ?? (await detectProjectName(root));
  const logPath = path.join(paths.logs, `${id}.log`);
  const command = options.noBuild ? undefined : options.command ?? config.buildCommand;

  output.heading(`ProofBuild snapshot: ${projectName}`);
  let build;
  if (command) {
    output.step(`Running build check: ${command}`);
    build = await runBuildCommand(root, command, logPath);
    if (build.status === "failed" && !options.allowFailedBuild) {
      throw new Error(`Build command failed with exit code ${build.exitCode}. See ${logPath}`);
    }
    output[build.status === "passed" ? "success" : "warning"](`Build ${build.status}`);
  }

  output.step("Hashing project files");
  const files = await collectFiles(root, config);
  if (files.length === 0) throw new Error("No files matched the configured include patterns.");
  const git = inspectGit(root);
  const manifest = {
    schema: "proofbuild-manifest/v1",
    id,
    project: projectName,
    createdAt: new Date().toISOString(),
    git,
    build,
    notes: options.notes,
    files,
  };
  const manifestSha256 = sha256Bytes(stableJson(manifest));
  const evidenceDirectory = path.join(paths.base, "evidence", id);
  await mkdir(evidenceDirectory, { recursive: true });
  const manifestPath = path.join(evidenceDirectory, "proofbuild-manifest.json");
  await writeFile(manifestPath, stableJson(manifest));
  let aiLogPath: string | undefined;
  let aiLogSha256: string | undefined;
  if (options.aiLog) {
    const source = path.resolve(root, options.aiLog);
    aiLogPath = path.join(evidenceDirectory, `ai-session${path.extname(source) || ".log"}`);
    await copyFile(source, aiLogPath);
    aiLogSha256 = await sha256File(aiLogPath);
  }
  const archivePath = path.join(paths.capsules, `${id}.tgz`);
  output.step(`Packing ${files.length} files`);
  const evidenceFiles = [manifestPath, ...(build ? [logPath] : []), ...(aiLogPath ? [aiLogPath] : [])]
    .map((filePath) => path.relative(root, filePath).replaceAll("\\", "/"));
  await createCapsule(root, archivePath, [...files.map((file) => file.path), ...evidenceFiles]);
  const archiveStat = await stat(archivePath);

  const receiptPath = path.join(paths.receipts, `${id}.json`);
  const receipt: ProofBuildReceipt = {
    schema: "proofbuild-receipt/v1",
    id,
    createdAt: manifest.createdAt,
    project: { name: projectName, rootName: path.basename(root) },
    git,
    build,
    capsule: {
      archiveFile: path.relative(root, archivePath).replaceAll("\\", "/"),
      sha256: await sha256File(archivePath),
      bytes: archiveStat.size,
      fileCount: files.length,
      manifestSha256,
    },
    files,
    evidence: {
      manifestFile: path.relative(root, manifestPath).replaceAll("\\", "/"),
      buildLogFile: build ? path.relative(root, logPath).replaceAll("\\", "/") : undefined,
      aiLogFile: aiLogPath ? path.relative(root, aiLogPath).replaceAll("\\", "/") : undefined,
      aiLogSha256,
    },
    notes: options.notes,
  };

  if (options.publish) {
    const network = options.network ?? config.network ?? "calibration";
    const withCDN = options.withCdn ?? config.withCDN ?? false;
    output.step(`Publishing capsule to Filecoin ${network}`);
    receipt.filecoin = await uploadCapsule(archivePath, network, withCDN);
    output.success(`Stored as ${receipt.filecoin.pieceCid}`);
  }

  await writeReceipt(receiptPath, receipt);
  const viewerPath = await writeReceiptViewer(receiptPath, receipt);
  output.success("Build capsule created");
  output.detail("Receipt", receiptPath);
  output.detail("Viewer", viewerPath);
  output.detail("SHA-256", receipt.capsule.sha256);
  output.detail("Restore", `proofbuild restore ${id}`);
  if (!receipt.filecoin) output.detail("Publish", `proofbuild publish ${id}`);
  return receipt;
}
