# ProofBuild

**A verifiable time capsule for AI-built software, powered by Filecoin Onchain Cloud.**

Public showcase: `https://shiv-69-debug.github.io/proofbuild/`

Source repository: `https://github.com/shiv-69-debug/proofbuild`

ProofBuild packages a project, hashes every included file, records Git and build evidence, and creates a portable receipt. Capsules work completely offline and can optionally be uploaded to Filecoin Onchain Cloud through the official Synapse SDK for durable, independently retrievable storage.

## Why it exists

Git records source history, but it does not preserve the exact build capsule, test output, AI session evidence, or a remotely verifiable copy of those artifacts. ProofBuild turns those materials into one restorable unit with a content integrity receipt.

## Features

- Deterministic file manifest with SHA-256 hashes
- Git commit, branch, remote, and working-tree state
- Captured build/test command, result, duration, and output log
- Optional AI prompt or coding-session log attachment
- Compressed build capsule and machine-readable JSON receipt
- Filecoin Calibration and mainnet publishing
- Filecoin remote download, verification, and recovery
- Current-source comparison against a historical receipt
- Shareable visual receipt dashboard
- Offline-first operation; a wallet is needed only for Filecoin commands

The implementation checklist is in [`FEATURES.md`](FEATURES.md).

## Requirements

- Node.js 22 or newer
- Git, recommended but not required
- For Filecoin publishing: a private key with FIL for gas and USDFC for storage payments

## Install and build

```bash
git clone <your-proofbuild-repository>
cd proofbuild
npm install
npm run build
npm link
```

After linking, the `proofbuild` command is available globally on your machine.

## Five-minute local demo

Run these commands inside any project:

```bash
proofbuild init
proofbuild snapshot --no-build --notes "First verifiable release"
proofbuild list
proofbuild verify <receipt-id> --source
proofbuild view <receipt-id>
proofbuild restore <receipt-id> --output ./restored-build
```

By default, generated data is stored under:

```text
.proofbuild/
├── capsules/   compressed build capsules
├── evidence/   embedded manifests and optional AI logs
├── logs/       build and test output
└── receipts/   JSON receipts and HTML dashboards
```

## Configure a project

`proofbuild init` creates `proofbuild.config.json`:

```json
{
  "buildCommand": "npm test",
  "include": ["**/*"],
  "exclude": ["node_modules/**", ".git/**", ".proofbuild/**", "*.log"],
  "network": "calibration",
  "withCDN": false
}
```

Change the build command for non-Node projects, for example:

```json
{ "buildCommand": "cargo test" }
```

## Attach AI development evidence

```bash
proofbuild snapshot --ai-log ./AI_BUILD_LOG.md --notes "Challenge submission build"
```

The supplied log is copied into the capsule and its SHA-256 is recorded in the receipt. Review the file before attaching it; do not include secrets or private conversations.

## Publish to Filecoin Onchain Cloud

Keep the wallet key in an environment variable. Never put it in the configuration file or commit it.

PowerShell:

```powershell
$env:PROOFBUILD_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
proofbuild doctor
proofbuild snapshot --publish --network calibration
```

To create a dedicated local Calibration wallet without exposing its key in terminal output:

```bash
proofbuild wallet create
proofbuild doctor
```

This writes `.env.proofbuild`, which is excluded from Git and from every ProofBuild capsule. Fund the displayed address using the official Calibration tFIL and tUSDFC faucets.

Bash:

```bash
export PROOFBUILD_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
proofbuild doctor
proofbuild snapshot --publish --network calibration
```

You can also publish an existing local receipt:

```bash
proofbuild publish <receipt-id> --network calibration
```

The Synapse SDK prepares the account for the capsule size, uploads the archive, and returns its Piece CID and storage-copy status. New users should start on Calibration testnet and fund the wallet with test FIL and test USDFC before publishing.

## Verify storage

Verify the local archive:

```bash
proofbuild verify <receipt-id>
```

Download the capsule from Filecoin and compare it against the receipt:

```bash
proofbuild verify <receipt-id> --remote
```

Compare the current project files against the historical manifest:

```bash
proofbuild verify <receipt-id> --source
```

## Disaster recovery

If the local capsule still exists, restore uses it directly:

```bash
proofbuild restore <receipt-id> --output ./recovered
```

If the local capsule has been deleted and the receipt has Filecoin metadata, ProofBuild downloads it from Filecoin, verifies its SHA-256, and then extracts it. A mismatched or corrupted archive is never restored.

## Commands

| Command | Purpose |
| --- | --- |
| `proofbuild init` | Create configuration and local directories |
| `proofbuild snapshot` | Hash, test, package, and optionally publish a build |
| `proofbuild publish` | Upload an existing capsule to Filecoin |
| `proofbuild verify` | Verify local, remote, or source-tree integrity |
| `proofbuild restore` | Restore a verified local or remote capsule |
| `proofbuild list` | List available receipts |
| `proofbuild view` | Open the visual receipt dashboard |
| `proofbuild doctor` | Check environment and publishing prerequisites |
| `proofbuild wallet create` | Create an ignored local Calibration wallet file |

Run `proofbuild <command> --help` for all options.

## Receipt model

Each receipt includes:

- Project identity and creation time
- Git provenance
- Build/test result and log hash
- Per-file hashes
- Capsule hash and byte size
- Embedded evidence locations
- Filecoin Piece CID, network, copy status, and upload time when published

The receipt schema is versioned as `proofbuild-receipt/v1`.

## Suggested challenge demo

1. Run a project test suite.
2. Create and publish a ProofBuild snapshot.
3. Open the visual receipt.
4. Change a tracked file and show `verify --source` failing.
5. Delete the local capsule.
6. Run `restore` and retrieve the original capsule from Filecoin.
7. Show the restored source and matching SHA-256.

## Security

- Private keys are read only from `PROOFBUILD_PRIVATE_KEY` or `FILECOIN_PRIVATE_KEY`.
- ProofBuild never writes the private key to a receipt, archive, or configuration file.
- Capsule extraction disables preserved absolute paths and strips the archive prefix.
- Always inspect AI logs and project files for credentials before publishing immutable data.

## Development

```bash
npm run build
npm test
npm run check
```

## License

MIT
