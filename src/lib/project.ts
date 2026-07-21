import path from "node:path";
import { readFile } from "node:fs/promises";

export async function detectProjectName(root: string): Promise<string> {
  try {
    const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { name?: string };
    if (packageJson.name) return packageJson.name;
  } catch {
    // Directory name is the portable fallback for non-Node projects.
  }
  return path.basename(root);
}
