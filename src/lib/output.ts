import pc from "picocolors";

export const output = {
  heading(message: string): void {
    console.log(`\n${pc.bold(pc.cyan(message))}`);
  },
  step(message: string): void {
    console.log(`${pc.dim("→")} ${message}`);
  },
  success(message: string): void {
    console.log(`${pc.green("✓")} ${message}`);
  },
  warning(message: string): void {
    console.log(`${pc.yellow("!")} ${message}`);
  },
  detail(label: string, value: unknown): void {
    console.log(`  ${pc.dim(label.padEnd(14))} ${String(value)}`);
  },
};
