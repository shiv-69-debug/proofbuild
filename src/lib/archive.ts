import path from "node:path";
import { mkdir } from "node:fs/promises";
import * as tar from "tar";

export async function createCapsule(root: string, archivePath: string, files: string[]): Promise<void> {
  await tar.create(
    {
      cwd: root,
      file: archivePath,
      gzip: true,
      portable: true,
      noMtime: true,
      prefix: "proofbuild-capsule",
    },
    files,
  );
}

export async function extractCapsule(archivePath: string, outputPath: string): Promise<void> {
  await mkdir(outputPath, { recursive: true });
  await tar.extract({
    cwd: outputPath,
    file: archivePath,
    strip: 1,
    preservePaths: false,
  });
}

export function archivePathFromReceipt(projectRoot: string, archiveFile: string): string {
  return path.resolve(projectRoot, archiveFile);
}
