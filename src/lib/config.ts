import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import type { ProofBuildConfig } from "../types.js";
import { stableJson } from "./hash.js";

export const CONFIG_FILE = "proofbuild.config.json";

export async function loadConfig(root: string): Promise<ProofBuildConfig> {
  try {
    const content = await readFile(path.join(root, CONFIG_FILE), "utf8");
    return JSON.parse(content) as ProofBuildConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function writeDefaultConfig(root: string): Promise<string> {
  const configPath = path.join(root, CONFIG_FILE);
  const config: ProofBuildConfig = {
    buildCommand: "npm test",
    include: ["**/*"],
    exclude: ["node_modules/**", ".git/**", ".proofbuild/**", ".env*", "*.pem", "*.key", "*.log"],
    network: "calibration",
    withCDN: false,
  };
  await writeFile(configPath, stableJson(config), { flag: "wx" });
  return configPath;
}
