import { readFile } from "node:fs/promises";
import { createPublicClient, formatEther, formatUnits, http, type Address } from "viem";
import { privateKeyToAccount, toAccount } from "viem/accounts";
import type { FilecoinCopy, FilecoinRecord, NetworkName } from "../types.js";

type UnknownRecord = Record<string, unknown>;

const PUBLIC_DEMO_ADDRESS: Address = "0x4Ce9FD2D0C4bDB4Bbc4bC5A4cFf102476696dE59";
const UNUSED_SIGNATURE = `0x${"00".repeat(65)}` as const;

const publicReadAccount = toAccount({
  address: PUBLIC_DEMO_ADDRESS,
  async signMessage() {
    return UNUSED_SIGNATURE;
  },
  async signTransaction() {
    return UNUSED_SIGNATURE;
  },
  async signTypedData() {
    return UNUSED_SIGNATURE;
  },
});

function readString(source: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return undefined;
}

function normalizeCopy(value: unknown): FilecoinCopy {
  const copy = (value && typeof value === "object" ? value : {}) as UnknownRecord;
  const provider = (copy.provider && typeof copy.provider === "object" ? copy.provider : {}) as UnknownRecord;
  return {
    providerId: readString(copy, ["providerId", "serviceProvider"]) ?? readString(provider, ["id", "serviceProvider"]),
    dataSetId: readString(copy, ["dataSetId", "datasetId"]),
    pieceId: readString(copy, ["pieceId"]),
    transactionHash: readString(copy, ["transactionHash", "txHash", "hash"]),
  };
}

function configuredPrivateKey(): `0x${string}` | undefined {
  const value = process.env.PROOFBUILD_PRIVATE_KEY ?? process.env.FILECOIN_PRIVATE_KEY;
  if (!value) return undefined;
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("PROOFBUILD_PRIVATE_KEY must be a 32-byte hex private key.");
  }
  return normalized as `0x${string}`;
}

async function createSynapse(network: NetworkName, withCDN: boolean, requireConfiguredWallet: boolean) {
  const sdk = await import("@filoz/synapse-sdk");
  const privateKey = configuredPrivateKey();
  if (requireConfiguredWallet && !privateKey) {
    throw new Error("Set PROOFBUILD_PRIVATE_KEY before publishing.");
  }
  return sdk.Synapse.create({
    account: privateKey ? privateKeyToAccount(privateKey) : publicReadAccount,
    source: "proofbuild",
    chain: network === "mainnet" ? sdk.mainnet : sdk.calibration,
    withCDN,
  });
}

export async function uploadCapsule(
  archivePath: string,
  network: NetworkName,
  withCDN: boolean,
): Promise<FilecoinRecord> {
  const bytes = await readFile(archivePath);
  const synapse = await createSynapse(network, withCDN, true);
  const preparation = await synapse.storage.prepare({ dataSize: BigInt(bytes.byteLength) });
  if (preparation.transaction) await preparation.transaction.execute();

  const result = await synapse.storage.upload(bytes);
  const loose = result as unknown as UnknownRecord;
  const copies = Array.isArray(loose.copies) ? loose.copies.map(normalizeCopy) : [];
  const failures = Array.isArray(loose.failedAttempts) ? loose.failedAttempts.length : 0;
  return {
    network,
    pieceCid: String(loose.pieceCid),
    size: String(loose.size ?? bytes.byteLength),
    complete: Boolean(loose.complete),
    copies,
    failedAttempts: failures,
    uploadedAt: new Date().toISOString(),
    withCDN,
  };
}

export async function downloadCapsule(pieceCid: string, network: NetworkName, withCDN: boolean): Promise<Uint8Array> {
  const synapse = await createSynapse(network, withCDN, false);
  return synapse.storage.download({ pieceCid });
}

export async function getWalletBalances(address: Address, network: NetworkName): Promise<{ fil: string; usdfc: string }> {
  const sdk = await import("@filoz/synapse-sdk");
  const chain = network === "mainnet" ? sdk.mainnet : sdk.calibration;
  const client = createPublicClient({ chain, transport: http() });
  const [filBalance, usdfcBalance, decimals] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({
      address: chain.contracts.usdfc.address,
      abi: chain.contracts.usdfc.abi,
      functionName: "balanceOf",
      args: [address],
    }),
    client.readContract({
      address: chain.contracts.usdfc.address,
      abi: chain.contracts.usdfc.abi,
      functionName: "decimals",
    }),
  ]);
  return {
    fil: formatEther(filBalance),
    usdfc: formatUnits(usdfcBalance, decimals),
  };
}
