const crypto = require("node:crypto");

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

class ReleaseController {
  constructor() {
    this.operations = new Map();
    this.environment = { observedKnown: true, observedReleaseId: null, lastHealthyReleaseId: null, activeAttemptId: null, revision: 0 };
  }

  idempotent(key, payload, create) {
    if (!key) throw Object.assign(new Error("idempotencyKey is required"), { code: "INVALID_INPUT" });
    const hash = digest(payload);
    const previous = this.operations.get(key);
    if (previous) {
      if (previous.hash !== hash) throw Object.assign(new Error("idempotency key payload conflict"), { code: "IDEMPOTENCY_CONFLICT" });
      return previous.result;
    }
    const result = create();
    this.operations.set(key, { hash, result });
    return result;
  }

  approve({ releaseId, artifactDigest, expectedCurrentReleaseId, operation = "promote", productionConfigDigest, idempotencyKey }) {
    return this.idempotent(idempotencyKey, { releaseId, artifactDigest, expectedCurrentReleaseId, operation, productionConfigDigest }, () => {
      if (!releaseId || !artifactDigest || !productionConfigDigest) throw Object.assign(new Error("approval fields are required"), { code: "INVALID_INPUT" });
      if (!this.environment.observedKnown) throw Object.assign(new Error("observed release is unknown"), { code: "CONFIGURATION_ERROR" });
      if (this.environment.activeAttemptId) throw Object.assign(new Error("deployment slot is busy"), { code: "CONCURRENT_DEPLOYMENT" });
      if (this.environment.observedReleaseId !== expectedCurrentReleaseId) throw Object.assign(new Error("expected current release does not match"), { code: "STALE_STATE" });
      return { approvalId: `approval_${crypto.randomUUID()}`, releaseId, artifactDigest, expectedCurrentReleaseId, operation, productionConfigDigest, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), used: false };
    });
  }

  createDeployment({ releaseId, approval, expectedCurrentReleaseId, idempotencyKey }) {
    return this.idempotent(idempotencyKey, { releaseId, approvalId: approval?.approvalId, expectedCurrentReleaseId }, () => {
      if (!approval || approval.used || approval.releaseId !== releaseId) throw Object.assign(new Error("approval is invalid"), { code: "APPROVAL_REQUIRED" });
      if (!this.environment.observedKnown || this.environment.observedReleaseId !== expectedCurrentReleaseId || this.environment.activeAttemptId) throw Object.assign(new Error("deployment slot is not available"), { code: "CONCURRENT_DEPLOYMENT" });
      approval.used = true;
      const attempt = { attemptId: `attempt_${crypto.randomUUID()}`, releaseId, state: "requested", expectedCurrentReleaseId };
      this.environment.activeAttemptId = attempt.attemptId;
      this.environment.revision += 1;
      return attempt;
    });
  }

  reconcile(attempt, actualReleaseId, healthy) {
    if (!attempt || !this.environment.activeAttemptId || this.environment.activeAttemptId !== attempt.attemptId) throw Object.assign(new Error("attempt is not active"), { code: "NOT_FOUND" });
    this.environment.observedKnown = true;
    this.environment.observedReleaseId = actualReleaseId;
    attempt.state = healthy && actualReleaseId === attempt.releaseId ? "succeeded" : "unhealthy";
    this.environment.activeAttemptId = null;
    if (attempt.state === "succeeded") this.environment.lastHealthyReleaseId = actualReleaseId;
    this.environment.revision += 1;
    return attempt;
  }
}

module.exports = { ReleaseController };
