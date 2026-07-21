# Live Filecoin Demo Handoff

ProofBuild has a dedicated Calibration wallet prepared for the public demonstration.

## Public wallet address

```text
0x4Ce9FD2D0C4bDB4Bbc4bC5A4cFf102476696dE59
```

The private key is stored only in the ignored local `.env.proofbuild` file and as the repository's encrypted `PROOFBUILD_PRIVATE_KEY` GitHub Actions secret.

## Current onchain readiness

- Calibration tFIL balance: `0`
- Calibration tUSDFC balance: `0`
- Synapse SDK connection: verified
- Calibration chain ID: `314159`
- Filecoin upload/download code: compiled and tested locally

## Required faucet step

1. Request Calibration tFIL for the wallet from `https://faucet.calibnet.chainsafe-fil.io/funds.html`.
2. Request Calibration tUSDFC from `https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc`.
3. Run `proofbuild doctor` until both balances are greater than zero.
4. Run:

```bash
proofbuild snapshot --publish --network calibration --ai-log AI_BUILD_LOG.md --notes "Public FilecoinTLDR challenge demo"
```

5. Verify the real remote copy:

```bash
proofbuild verify <receipt-id> --remote
```

6. Commit a sanitized copy of the resulting receipt under `showcase/` so judges can see the real Piece CID without access to local files.

The faucets require interactive browser checks, so funding cannot be completed by unattended CLI automation.
