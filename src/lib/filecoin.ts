import { readFile } from "node:fs/promises";
import { createPublicClient, formatEther, formatUnits, http, type Address } from "viem";
import { privateKeyToAccount, toAccount } from "viem/accounts";
import type {
  FilecoinCopy,
  FilecoinOnchainCopyStatus,
  FilecoinRecord,
  NetworkName,
} from "../types.js";

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
    role: copy.role === "primary" || copy.role === "secondary" ? copy.role : undefined,
    retrievalUrl: readString(copy, ["retrievalUrl"]),
    isNewDataSet: typeof copy.isNewDataSet === "boolean" ? copy.isNewDataSet : undefined,
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

async function createSynapse(
  network: NetworkName,
  withCDN: boolean,
  requireConfiguredWallet: boolean,
  readAddress?: Address,
) {
  const sdk = await import("@filoz/synapse-sdk");
  const privateKey = configuredPrivateKey();
  if (requireConfiguredWallet && !privateKey) {
    throw new Error("Set PROOFBUILD_PRIVATE_KEY before publishing.");
  }
  const account = readAddress
    ? toAccount({ ...publicReadAccount, address: readAddress })
    : privateKey
      ? privateKeyToAccount(privateKey)
      : publicReadAccount;
  return sdk.Synapse.create({
    account,
    source: "proofbuild",
    chain: network === "mainnet" ? sdk.mainnet : sdk.calibration,
    withCDN,
  });
}

export async function uploadCapsule(
  archivePath: string,
  network: NetworkName,
  withCDN: boolean,
  metadata: Record<string, string> = {},
): Promise<FilecoinRecord> {
  const bytes = await readFile(archivePath);
  const synapse = await createSynapse(network, withCDN, true);
  const preparation = await synapse.storage.prepare({ dataSize: BigInt(bytes.byteLength) });
  const preparationResult = preparation.transaction ? await preparation.transaction.execute() : undefined;

  const storageTransactions = new Map<string, string>();
  const result = await synapse.storage.upload(bytes, {
    pieceMetadata: metadata,
    callbacks: {
      onPiecesAdded(transactionHash, providerId) {
        storageTransactions.set(providerId.toString(), transactionHash);
      },
    },
  });
  const loose = result as unknown as UnknownRecord;
  const copies = Array.isArray(loose.copies)
    ? loose.copies.map((value) => {
      const copy = normalizeCopy(value);
      return {
        ...copy,
        transactionHash: copy.transactionHash ?? (copy.providerId ? storageTransactions.get(copy.providerId) : undefined),
      };
    })
    : [];
  const failures = Array.isArray(loose.failedAttempts) ? loose.failedAttempts.length : 0;
  return {
    network,
    publisher: synapse.client.account.address,
    pieceCid: String(loose.pieceCid),
    size: String(loose.size ?? bytes.byteLength),
    complete: Boolean(loose.complete),
    copies,
    failedAttempts: failures,
    preparationTransactionHash: preparationResult?.hash,
    uploadedAt: new Date().toISOString(),
    withCDN,
  };
}

export async function verifyCapsuleOnchain(record: FilecoinRecord): Promise<FilecoinOnchainCopyStatus[]> {
  const publisher = record.publisher as Address | undefined;
  const synapse = await createSynapse(record.network, record.withCDN, false, publisher);
  const owner = publisher ?? synapse.client.account.address;
  const dataSets = await synapse.storage.findDataSets({ address: owner });
  const dataSetById = new Map(dataSets.map((dataSet) => [dataSet.dataSetId.toString(), dataSet]));
  const statuses: FilecoinOnchainCopyStatus[] = [];

  for (const copy of record.copies) {
    if (!copy.providerId || !copy.dataSetId || !copy.pieceId) {
      throw new Error("Receipt copy is missing providerId, dataSetId, or pieceId.");
    }
    const dataSet = dataSetById.get(copy.dataSetId);
    if (!dataSet) throw new Error(`Data set ${copy.dataSetId} was not found for publisher ${owner}.`);
    if (!dataSet.isLive) throw new Error(`Data set ${copy.dataSetId} is not live.`);
    if (dataSet.providerId.toString() !== copy.providerId) {
      throw new Error(`Data set ${copy.dataSetId} belongs to provider ${dataSet.providerId}, not ${copy.providerId}.`);
    }

    const context = await synapse.storage.createContext({
      dataSetId: BigInt(copy.dataSetId),
      providerId: BigInt(copy.providerId),
    });
    const pieceStatus = await context.pieceStatus({ pieceCid: record.pieceCid });
    if (pieceStatus?.pieceId === undefined) {
      throw new Error(`Piece ${record.pieceCid} is not registered in data set ${copy.dataSetId}.`);
    }
    if (pieceStatus.pieceId.toString() !== copy.pieceId) {
      throw new Error(`On-chain piece ID ${pieceStatus.pieceId} does not match receipt piece ID ${copy.pieceId}.`);
    }
    if (pieceStatus.isProofOverdue) {
      throw new Error(`PDP proof is overdue for data set ${copy.dataSetId}.`);
    }

    let transactionConfirmed: boolean | undefined;
    if (copy.transactionHash) {
      const transactionReceipt = await synapse.client.getTransactionReceipt({
        hash: copy.transactionHash as `0x${string}`,
      });
      transactionConfirmed = transactionReceipt.status === "success";
      if (!transactionConfirmed) throw new Error(`Storage transaction ${copy.transactionHash} reverted.`);
    }

    statuses.push({
      providerId: copy.providerId,
      dataSetId: copy.dataSetId,
      pieceId: pieceStatus.pieceId.toString(),
      dataSetLive: dataSet.isLive,
      activePieceCount: dataSet.activePieceCount.toString(),
      transactionHash: copy.transactionHash,
      transactionConfirmed,
      dataSetLastProven: pieceStatus.dataSetLastProven?.toISOString(),
      dataSetNextProofDue: pieceStatus.dataSetNextProofDue?.toISOString(),
      inChallengeWindow: pieceStatus.inChallengeWindow,
      isProofOverdue: pieceStatus.isProofOverdue,
      retrievalUrl: pieceStatus.retrievalUrl ?? copy.retrievalUrl,
    });
  }

  return statuses;
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
