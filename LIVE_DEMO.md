# Live Filecoin Demo Handoff

ProofBuild has a dedicated Calibration wallet prepared for the public demonstration.

## Public wallet address

```text
0x4Ce9FD2D0C4bDB4Bbc4bC5A4cFf102476696dE59
```

The private key is stored only in the ignored local `.env.proofbuild` file and as the repository's encrypted `PROOFBUILD_PRIVATE_KEY` GitHub Actions secret.

## Completed onchain demonstration

- Calibration funding: complete
- Synapse SDK connection: verified
- Calibration chain ID: `314159`
- Filecoin upload: passed
- Filecoin remote download: passed
- Remote SHA-256 verification: passed
- Piece CID: `bafkzcibe4oxagdb6aazxaflnd47kkym73pv3tvgh7sg34gbvcuhnhxunwobudilade`

## Reproduce the demonstration

1. Fund a Calibration wallet with tFIL and tUSDFC.
2. Run:

```bash
proofbuild snapshot --publish --network calibration --ai-log AI_BUILD_LOG.md --notes "Public FilecoinTLDR challenge demo"
```

3. Verify the real remote copy:

```bash
proofbuild verify <receipt-id> --remote
```

4. Inspect `showcase/live-filecoin-receipt.json` for the published demonstration proof.
