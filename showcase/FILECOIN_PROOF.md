# Live Filecoin Proof

ProofBuild successfully published its own tested build capsule to Filecoin Onchain Cloud on Calibration and downloaded it again for byte-for-byte verification.

| Field | Value |
| --- | --- |
| Receipt ID | `20260721T123008Z-b1cfa5` |
| Piece CID | `bafkzcibeu3xbgd2arlsl5ydi42xcbaci554duvmxrjqiiqf7vltffd2wcmrv4bi2dq` |
| Network | Filecoin Calibration |
| Capsule SHA-256 | `0fadc49a16189d55af95a6805c6fec03a2db74e0b9c0df8341487b1b84041ccc` |
| Capsule size | 714,970 bytes |
| Manifest | 122 files |
| Storage copies | 2 |
| Provider IDs | 4 and 2 |
| Dataset IDs | 20893 and 20892 |
| Piece IDs | 1 and 1 |
| Provider 4 transaction | `0xc132eec4974bb85290a31c2c71b75afc635289ee389bd9a4f0a9dfa3072579f9` |
| Provider 2 transaction | `0x88140981d7dd58c58723860ba7cb567e4a08b3b846dc6a6765fc4fc2899ecd7a` |
| Failed attempts | 0 |
| Remote verification | Passed |
| Publisher | `0x4Ce9FD2D0C4bDB4Bbc4bC5A4cFf102476696dE59` |
| On-chain PDP verification | Passed on 2026-07-21 at 12:39 UTC |

The public machine-readable proof is available in `showcase/live-filecoin-receipt.json`.

## Independent live check

ProofBuild now supports:

```bash
proofbuild demo
```

That wallet-free command downloads the capsule and queries Filecoin Calibration through the Synapse SDK. It confirms that datasets `20893` and `20892` are live, the recorded Piece CID resolves to piece ID `1`, both storage transactions succeeded, and the PDP proof schedule is not overdue. Project owners can run the same on-chain checks for any full receipt with `proofbuild verify <receipt-id> --onchain`.

The raw terminal output used in the updated demo video is preserved in `showcase/demo-publish-output.txt` and `showcase/demo-verify-output.txt`.
