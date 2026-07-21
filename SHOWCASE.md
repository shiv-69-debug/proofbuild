# ProofBuild Showcase

## One-line pitch

**ProofBuild is a verifiable time capsule for AI-built software, powered by Filecoin Onchain Cloud.**

## Problem

AI-assisted development produces source code, prompts, build logs, dependency locks, and generated artifacts. Git records source changes, but it does not preserve the exact tested bundle or prove that a recoverable copy remains available outside one hosting provider.

## Solution

ProofBuild creates a portable build capsule containing the selected project files, hashes, Git metadata, build output, manifest, and optional AI session log. It can store that capsule through Filecoin Onchain Cloud and later download, verify, and restore it using its recorded Piece CID.

## Why Filecoin matters

Filecoin is not a hidden storage implementation. It provides the public identity and recovery path for each build capsule:

- The Piece CID appears directly in the receipt dashboard.
- The selected Filecoin network and storage-copy results are displayed.
- `verify --remote` retrieves the stored capsule and checks its SHA-256.
- `restore` falls back to Filecoin when the local archive is missing.
- The demo deliberately deletes the local copy to show Filecoin-powered recovery.

## Demo flow

```bash
proofbuild snapshot --publish --network calibration --ai-log AI_BUILD_LOG.md
proofbuild view <receipt-id>
proofbuild verify <receipt-id> --remote
proofbuild verify <receipt-id> --source
proofbuild restore <receipt-id> --output ./recovered
```

For the strongest demonstration, modify a source file before `verify --source`, show the expected failure, then delete the local capsule and recover it from Filecoin.

## Built for

FilecoinTLDR Builder Challenge — Cycle 3: Build a Filecoin Tool, Adapter, or Developer Utility.
