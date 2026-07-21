# ProofBuild

[![CI](https://github.com/shiv-69-debug/proofbuild/actions/workflows/ci.yml/badge.svg)](https://github.com/shiv-69-debug/proofbuild/actions/workflows/ci.yml)
[![Showcase](https://img.shields.io/badge/showcase-live-47d7ff)](https://shiv-69-debug.github.io/proofbuild/)
[![Filecoin](https://img.shields.io/badge/Filecoin-Calibration-0090ff)](showcase/FILECOIN_PROOF.md)

ProofBuild creates verifiable, restorable build capsules and stores them on Filecoin Onchain Cloud.

It hashes the selected project files, records Git and build evidence, packages everything into a portable archive, and produces a receipt that can be checked locally or against a copy retrieved from Filecoin.

## For judges: run the live demo

With Node.js 22 or newer installed, run:

```bash
npx --yes github:shiv-69-debug/proofbuild demo
```

This installs ProofBuild directly from GitHub, downloads the public capsule from Filecoin Calibration, and checks its byte length and SHA-256 against the published receipt. It does not require a wallet, private key, FIL, or USDFC.

Expected final output:

```text
Downloaded capsule matches the published receipt
Live Filecoin verification passed
```

To inspect the full CLI:

```bash
npx --yes github:shiv-69-debug/proofbuild --help
```

## Live proof

ProofBuild published its own release capsule to Filecoin Calibration and downloaded it again for byte-for-byte verification.

| Field | Value |
| --- | --- |
| Piece CID | `bafkzcibe4oxagdb6aazxaflnd47kkym73pv3tvgh7sg34gbvcuhnhxunwobudilade` |
| Capsule | 74,909 bytes, 116 files |
| Storage | 2 provider copies, 0 failed attempts |
| Verification | Remote SHA-256 match passed |

See [`showcase/FILECOIN_PROOF.md`](showcase/FILECOIN_PROOF.md) or the [machine-readable receipt](showcase/live-filecoin-receipt.json).

## Features

- SHA-256 manifest for every included file
- Git commit, branch, remote, and working-tree state
- Captured build or test command with output and status
- Optional AI session or prompt-log attachment
- Compressed, portable build capsules
- Filecoin Calibration and mainnet support
- Remote Filecoin verification and recovery
- Source-tree comparison against historical receipts
- Standalone HTML receipt dashboards
- Local wallet creation and onchain balance checks

## Requirements

- Node.js 22 or newer
- Git, recommended for provenance metadata
- FIL for gas and USDFC for storage when publishing

## Installation

```bash
git clone https://github.com/shiv-69-debug/proofbuild.git
cd proofbuild
npm install
npm run build
npm link
```

## Quick start

Inside the project you want to preserve:

```bash
proofbuild init
proofbuild snapshot --no-build --notes "Initial capsule"
proofbuild list
proofbuild verify <receipt-id> --source
proofbuild view <receipt-id>
proofbuild restore <receipt-id> --output ./restored-build
```

ProofBuild stores generated artifacts under `.proofbuild/`:

```text
.proofbuild/
|-- capsules/   compressed build capsules
|-- evidence/   manifests and attached evidence
|-- logs/       build and test output
`-- receipts/   JSON receipts and HTML dashboards
```

## Configuration

`proofbuild init` creates `proofbuild.config.json`:

```json
{
  "buildCommand": "npm test",
  "include": ["**/*"],
  "exclude": [
    "node_modules/**",
    ".git/**",
    ".proofbuild/**",
    ".env*",
    "*.pem",
    "*.key",
    "*.log"
  ],
  "network": "calibration",
  "withCDN": false
}
```

Set `buildCommand` to the project-specific validation command, such as `cargo test`, `go test ./...`, or `pytest`.

## Filecoin publishing

Use an existing private key through an environment variable:

```powershell
$env:PROOFBUILD_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
proofbuild doctor
proofbuild snapshot --publish --network calibration
```

Or create a dedicated local test wallet:

```bash
proofbuild wallet create
proofbuild doctor
```

The generated `.env.proofbuild` file is excluded from Git and from build capsules. Fund the displayed address with FIL and USDFC before publishing.

Publish an existing local capsule with:

```bash
proofbuild publish <receipt-id> --network calibration
```

## Verification and recovery

Verify the local capsule:

```bash
proofbuild verify <receipt-id>
```

Download the Filecoin copy and compare its SHA-256:

```bash
proofbuild verify <receipt-id> --remote
```

Compare current project files against the receipt:

```bash
proofbuild verify <receipt-id> --source
```

Restore a capsule:

```bash
proofbuild restore <receipt-id> --output ./recovered
```

If the local archive is missing, ProofBuild downloads the Filecoin copy, verifies it, and then extracts it.

## Commands

| Command | Purpose |
| --- | --- |
| `proofbuild init` | Initialize a project |
| `proofbuild demo` | Download and verify the public Filecoin demo capsule |
| `proofbuild snapshot` | Test, hash, package, and optionally publish a build |
| `proofbuild publish` | Upload an existing capsule to Filecoin |
| `proofbuild verify` | Verify local, remote, or source-tree integrity |
| `proofbuild restore` | Restore a verified capsule |
| `proofbuild list` | List project receipts |
| `proofbuild view` | Open a receipt dashboard |
| `proofbuild doctor` | Check configuration, wallet, and balances |
| `proofbuild wallet create` | Create an ignored local test wallet |

Run `proofbuild <command> --help` for command-specific options.

## Security

- Private keys are read only from `.env.proofbuild`, `PROOFBUILD_PRIVATE_KEY`, or `FILECOIN_PRIVATE_KEY`.
- Wallet keys are never written to receipts or capsules.
- `.env*`, `*.pem`, and `*.key` are excluded by default.
- Archives are verified before extraction.
- Review attached logs before publishing immutable data.

## Development

```bash
npm run check
```

The repository includes unit tests, an end-to-end local capsule test, CI, a GitHub Pages showcase, and a documented live Filecoin receipt.

## License

MIT
