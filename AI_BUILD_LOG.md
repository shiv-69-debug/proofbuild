# AI Build Log

ProofBuild was created for the FilecoinTLDR Builder Challenge Cycle 3 as a human-led project with AI used as a development tool.

## My role

I selected the problem, defined the product scope, chose the CLI workflow, and made the final decisions around security, usability, and the public demo. I also configured and funded the Calibration wallet, ran the live Filecoin upload, verified the remote capsule, reviewed the output, and published the repository and showcase.

## How AI was used

AI helped accelerate a few parts of the development process:

- locating current Synapse SDK documentation and examples;
- suggesting implementation approaches and edge cases;
- helping debug TypeScript and integration issues;
- assisting with test cases and documentation drafts.

## Tools and concrete outcomes

- **ChatGPT:** reviewed the bounty rubric against the repository, identified the missing visible transaction evidence and PDP verification path, and produced the prioritized hardening plan.
- **OpenAI Codex CLI:** inspected the installed Synapse SDK types and implementation, found the on-chain `pieceStatus()` PDP verifier flow, and implemented `verify --onchain` without substituting a local hash check.
- **OpenAI Codex CLI:** extended publish receipts to retain the publisher, preparation transaction, per-provider storage transactions, dataset IDs, piece IDs, copy roles, and retrieval URLs, then compiled and exercised the command against the live Calibration receipt.
- **OpenAI Codex CLI:** ran a fresh funded Calibration publish, captured both real provider transaction hashes, verified the remote download and PDP records, and rendered the resulting command evidence into the updated public demo video.

All product decisions, acceptance of changes, wallet operations, live-network verification, and final publishing remained under my control.

## Final verification

The completed project was compiled and tested locally, then used to package its own source. The resulting capsule was published to Filecoin Calibration, downloaded again, and verified against its recorded SHA-256. The public receipt contains the Piece CID and provider-copy evidence.
