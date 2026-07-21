import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { snapshotCommand } from "../src/commands/snapshot.js";
import { restoreCommand } from "../src/commands/restore.js";

describe("local workflow", () => {
  it("creates and restores a capsule", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "proofbuild-test-"));
    await writeFile(path.join(root, "hello.txt"), "hello Filecoin\n");
    await writeFile(path.join(root, "proofbuild.config.json"), JSON.stringify({ exclude: ["restored/**"] }));
    const receipt = await snapshotCommand({ root, noBuild: true });
    const output = path.join(root, "restored");
    await restoreCommand(path.join(root, ".proofbuild", "receipts", `${receipt.id}.json`), output);
    expect(await readFile(path.join(output, "hello.txt"), "utf8")).toBe("hello Filecoin\n");
  });
});
