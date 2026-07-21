export type NetworkName = "calibration" | "mainnet";

export interface ProofBuildConfig {
  projectName?: string;
  buildCommand?: string;
  include?: string[];
  exclude?: string[];
  network?: NetworkName;
  withCDN?: boolean;
}

export interface FileRecord {
  path: string;
  bytes: number;
  sha256: string;
}

export interface GitRecord {
  available: boolean;
  commit?: string;
  branch?: string;
  dirty?: boolean;
  remote?: string;
}

export interface BuildRecord {
  command: string;
  status: "passed" | "failed";
  exitCode: number;
  durationMs: number;
  logFile: string;
  logSha256: string;
}

export interface FilecoinCopy {
  providerId?: string;
  dataSetId?: string;
  pieceId?: string;
  transactionHash?: string;
}

export interface FilecoinRecord {
  network: NetworkName;
  pieceCid: string;
  size: string;
  complete: boolean;
  copies: FilecoinCopy[];
  failedAttempts: number;
  uploadedAt: string;
  withCDN: boolean;
}

export interface ProofBuildReceipt {
  schema: "proofbuild-receipt/v1";
  id: string;
  createdAt: string;
  project: {
    name: string;
    rootName: string;
  };
  git: GitRecord;
  build?: BuildRecord;
  capsule: {
    archiveFile: string;
    sha256: string;
    bytes: number;
    fileCount: number;
    manifestSha256: string;
  };
  files: FileRecord[];
  evidence: {
    manifestFile: string;
    buildLogFile?: string;
    aiLogFile?: string;
    aiLogSha256?: string;
  };
  notes?: string;
  filecoin?: FilecoinRecord;
}
