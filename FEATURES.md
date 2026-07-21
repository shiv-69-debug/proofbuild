# ProofBuild MVP Checklist

## Capsule creation

- [x] Hash every included source and artifact file with SHA-256
- [x] Capture Git commit, branch, remote, and dirty state
- [x] Run and record an optional build or test command
- [x] Embed the build output inside the capsule
- [x] Embed a machine-readable manifest inside the capsule
- [x] Attach an optional AI prompt or coding-session log
- [x] Create a compressed, portable, restorable archive
- [x] Create a stable JSON receipt

## Filecoin Onchain Cloud

- [x] Use the official `@filoz/synapse-sdk`
- [x] Support Calibration testnet and Filecoin mainnet
- [x] Prepare storage payments before upload
- [x] Upload capsules and record their Piece CID
- [x] Record provider-copy metadata returned by the SDK
- [x] Support optional Filecoin Beam/CDN retrieval
- [x] Download remote capsules for verification and restore

## Verification and recovery

- [x] Verify the local capsule against its receipt
- [x] Verify a downloaded Filecoin capsule against SHA-256
- [x] Compare the current source tree with the historical manifest
- [x] Refuse to restore corrupted capsules
- [x] Restore locally or retrieve from Filecoin when the local copy is missing

## Developer experience

- [x] `proofbuild init`
- [x] `proofbuild snapshot`
- [x] `proofbuild publish`
- [x] `proofbuild verify`
- [x] `proofbuild restore`
- [x] `proofbuild list`
- [x] `proofbuild view`
- [x] `proofbuild doctor`
- [x] `proofbuild wallet create`
- [x] Responsive visual receipt dashboard
- [x] Automated build and workflow tests
- [x] Onchain wallet balance checks in `proofbuild doctor`
- [x] Public GitHub repository and Pages showcase
- [x] Fund Calibration wallet and publish the final live Piece CID receipt
- [x] Download the live Filecoin capsule and verify its SHA-256
- [x] Publish a sanitized machine-readable proof for judges
