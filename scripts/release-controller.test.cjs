const test = require("node:test");
const assert = require("node:assert/strict");
const { ReleaseController } = require("./release-controller.cjs");

test("same idempotency key returns the original approval", () => {
  const controller = new ReleaseController();
  const input = { releaseId: "rel_a", artifactDigest: "a", expectedCurrentReleaseId: null, productionConfigDigest: "cfg", idempotencyKey: "key-1" };
  const first = controller.approve(input);
  const second = controller.approve(input);
  assert.equal(second.approvalId, first.approvalId);
});

test("different payload with the same idempotency key is rejected", () => {
  const controller = new ReleaseController();
  controller.approve({ releaseId: "rel_a", artifactDigest: "a", expectedCurrentReleaseId: null, productionConfigDigest: "cfg", idempotencyKey: "key-1" });
  assert.throws(() => controller.approve({ releaseId: "rel_b", artifactDigest: "a", expectedCurrentReleaseId: null, productionConfigDigest: "cfg", idempotencyKey: "key-1" }), { code: "IDEMPOTENCY_CONFLICT" });
});

test("only one active deployment can claim the production slot", () => {
  const controller = new ReleaseController();
  const approval = controller.approve({ releaseId: "rel_a", artifactDigest: "a", expectedCurrentReleaseId: null, productionConfigDigest: "cfg", idempotencyKey: "approval-1" });
  const attempt = controller.createDeployment({ releaseId: "rel_a", approval, expectedCurrentReleaseId: null, idempotencyKey: "attempt-1" });
  assert.throws(() => controller.approve({ releaseId: "rel_b", artifactDigest: "b", expectedCurrentReleaseId: null, productionConfigDigest: "cfg", idempotencyKey: "approval-2" }), { code: "CONCURRENT_DEPLOYMENT" });
  controller.reconcile(attempt, "rel_a", true);
  assert.equal(controller.environment.lastHealthyReleaseId, "rel_a");
});
