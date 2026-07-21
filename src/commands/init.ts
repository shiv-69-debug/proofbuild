import path from "node:path";
import { appendFile, readFile } from "node:fs/promises";
import { writeDefaultConfig } from "../lib/config.js";
import { ensureProofBuildPaths } from "../lib/paths.js";
import { output } from "../lib/output.js";

export async function initCommand(rootOption?: string): Promise<void> {
  const root = path.resolve(rootOption ?? process.cwd());
  await ensureProofBuildPaths(root);
  try {
    const configPath = await writeDefaultConfig(root);
    output.success(`Created ${configPath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") output.warning("proofbuild.config.json already exists");
    else throw error;
  }

  const gitignorePath = path.join(root, ".gitignore");
  let gitignore = "";
  try {
    gitignore = await readFile(gitignorePath, "utf8");
  } catch {
    // A new .gitignore is created below.
  }
  if (!gitignore.split(/\r?\n/).includes(".proofbuild/")) {
    await appendFile(gitignorePath, `${gitignore && !gitignore.endsWith("\n") ? "\n" : ""}.proofbuild/\n`);
    output.success("Added .proofbuild/ to .gitignore");
  }
  output.detail("Next", "Edit proofbuild.config.json, then run proofbuild snapshot");
}
