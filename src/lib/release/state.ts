export type BuildState = "requested" | "validating" | "building" | "packaging" | "succeeded" | "failed" | "cancelled";
export type DeploymentState = "requested" | "uploading" | "verifying" | "succeeded" | "failed" | "reconciling" | "unhealthy" | "needs_attention";

export interface ReleaseRecord {
  releaseId: string;
  siteId: "keronshans";
  buildId: string;
  frameworkSha: string;
  contentSha: string;
  snapshotDigest: string;
  searchDigest: string;
  artifactDigest: string;
  themeId: string;
  contentSchemaVersion: 1;
  publicApiVersion: 1;
  adminApiVersion: 1;
  requiredMigrations: readonly string[];
  supportedServiceContract: string;
  createdAt: string;
}

export interface SiteEnvironmentState {
  observedKnown: boolean;
  observedReleaseId: string | null;
  lastHealthyReleaseId: string | null;
  activeAttemptId: string | null;
  revision: number;
}

export function canPromote(environment: SiteEnvironmentState, expectedCurrentReleaseId: string | null): boolean {
  return environment.observedKnown && environment.observedReleaseId === expectedCurrentReleaseId && environment.activeAttemptId === null;
}
