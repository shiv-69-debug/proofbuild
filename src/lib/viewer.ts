import path from "node:path";
import { writeFile } from "node:fs/promises";
import type { ProofBuildReceipt } from "../types.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortHash(value?: string): string {
  return value ? `${value.slice(0, 12)}…${value.slice(-8)}` : "Not available";
}

export async function writeReceiptViewer(receiptPath: string, receipt: ProofBuildReceipt): Promise<string> {
  const viewerPath = receiptPath.replace(/\.json$/i, ".html");
  const fileRows = receipt.files
    .slice(0, 200)
    .map(
      (file) => `<tr><td>${escapeHtml(file.path)}</td><td>${file.bytes.toLocaleString()}</td><td><code>${escapeHtml(shortHash(file.sha256))}</code></td></tr>`,
    )
    .join("");
  const storageCopies = receipt.filecoin?.copies
    .map(
      (copy) => `<div><dt>Provider ${escapeHtml(copy.providerId)}</dt><dd>dataset <code>${escapeHtml(copy.dataSetId)}</code>, piece <code>${escapeHtml(copy.pieceId)}</code>${copy.transactionHash ? `<br>tx <code>${escapeHtml(copy.transactionHash)}</code>` : ""}</dd></div>`,
    )
    .join("");
  const storage = receipt.filecoin
    ? `<span class="pill good">FILECOIN VERIFIED</span>
       <dl><div><dt>Piece CID</dt><dd><code>${escapeHtml(receipt.filecoin.pieceCid)}</code></dd></div>
       <div><dt>Network</dt><dd>${escapeHtml(receipt.filecoin.network)}</dd></div>
       <div><dt>Publisher</dt><dd><code>${escapeHtml(receipt.filecoin.publisher ?? "Legacy receipt")}</code></dd></div>
       ${receipt.filecoin.preparationTransactionHash ? `<div><dt>Funding tx</dt><dd><code>${escapeHtml(receipt.filecoin.preparationTransactionHash)}</code></dd></div>` : ""}
       <div><dt>Copies</dt><dd>${receipt.filecoin.copies.length}</dd></div>
       ${storageCopies}
       <div><dt>Upload complete</dt><dd>${receipt.filecoin.complete ? "Yes" : "Partial"}</dd></div></dl>`
    : `<span class="pill local">LOCAL CAPSULE</span><p>Run <code>proofbuild publish ${escapeHtml(receipt.id)}</code> to store this capsule on Filecoin.</p>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProofBuild Receipt — ${escapeHtml(receipt.project.name)}</title>
<style>
:root{color-scheme:dark;--bg:#07111f;--panel:#0e1c2f;--line:#203653;--text:#eef6ff;--muted:#8ea5bf;--cyan:#45d5ff;--green:#50e3a4;--gold:#ffd166}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#153556 0,transparent 35%),var(--bg);color:var(--text);font:15px/1.55 Inter,ui-sans-serif,system-ui,sans-serif}.wrap{max-width:1080px;margin:auto;padding:48px 24px 80px}.brand{color:var(--cyan);font-weight:800;letter-spacing:.15em}.hero{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin:24px 0}.card{background:linear-gradient(145deg,rgba(17,37,62,.96),rgba(9,24,42,.96));border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.28)}h1{font-size:clamp(32px,6vw,64px);line-height:1;margin:12px 0}h2{margin:0 0 16px}p,.muted{color:var(--muted)}code{color:#b8eaff;word-break:break-all}.pill{display:inline-block;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.08em}.good{background:rgba(80,227,164,.14);color:var(--green);border:1px solid rgba(80,227,164,.4)}.local{background:rgba(255,209,102,.13);color:var(--gold);border:1px solid rgba(255,209,102,.4)}dl{margin:18px 0 0}dl div{display:grid;grid-template-columns:130px 1fr;border-top:1px solid var(--line);padding:10px 0}dt{color:var(--muted)}dd{margin:0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.hash{font-size:18px;color:var(--cyan)}@media(max-width:760px){.hero{grid-template-columns:1fr}dl div{grid-template-columns:1fr}table{font-size:12px}}</style></head>
<body><main class="wrap"><div class="brand">PROOFBUILD / BUILD RECEIPT</div><section class="hero"><div class="card"><div class="muted">${escapeHtml(receipt.createdAt)}</div><h1>${escapeHtml(receipt.project.name)}</h1><p>Verifiable software build capsule</p><div class="hash"><code>sha256:${escapeHtml(receipt.capsule.sha256)}</code></div></div><div class="card"><h2>Storage proof</h2>${storage}</div></section>
<section class="card"><h2>Build identity</h2><dl><div><dt>Receipt ID</dt><dd><code>${escapeHtml(receipt.id)}</code></dd></div><div><dt>Git commit</dt><dd><code>${escapeHtml(receipt.git.commit ?? "Not a Git repository")}</code></dd></div><div><dt>Branch</dt><dd>${escapeHtml(receipt.git.branch ?? "—")}</dd></div><div><dt>Working tree</dt><dd>${receipt.git.dirty ? "Modified" : "Clean"}</dd></div><div><dt>Files</dt><dd>${receipt.capsule.fileCount}</dd></div><div><dt>Capsule size</dt><dd>${receipt.capsule.bytes.toLocaleString()} bytes</dd></div><div><dt>Build check</dt><dd>${receipt.build ? `${escapeHtml(receipt.build.status)} — ${escapeHtml(receipt.build.command)}` : "Not run"}</dd></div></dl></section>
<section class="card" style="margin-top:18px"><h2>Manifest</h2><table><thead><tr><th>File</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${fileRows}</tbody></table>${receipt.files.length > 200 ? `<p>Showing first 200 of ${receipt.files.length} files.</p>` : ""}</section></main></body></html>`;
  await writeFile(viewerPath, html);
  return path.resolve(viewerPath);
}
