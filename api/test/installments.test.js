import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateInstallments } from "../src/modules/installment-expenses/installment-expenses-service.js";

describe("generateInstallments", () => {
  it("splits evenly and sums to the total", () => {
    const parts = generateInstallments(100, 4, "2026-09-10T12:00:00.000Z");
    assert.equal(parts.length, 4);
    assert.deepEqual(parts.map((p) => p.amount), [25, 25, 25, 25]);
    assert.equal(parts.reduce((a, p) => a + p.amount, 0), 100);
  });

  it("puts rounding residue in whole cents on the last installment", () => {
    const parts = generateInstallments(100, 3, "2026-09-10T12:00:00.000Z");
    assert.deepEqual(parts.map((p) => p.amount), [33.33, 33.33, 33.34]);
    assert.equal(parts.reduce((a, p) => a + p.amount, 0).toFixed(2), "100.00");
    for (const p of parts) assert.match(p.amount.toFixed(2), /^\d+\.\d{2}$/);
  });

  it("clamps due dates to the last day of short months", () => {
    const parts = generateInstallments(300, 3, "2026-01-31T12:00:00.000Z");
    assert.deepEqual(
      parts.map((p) => p.dueDate.toISOString().slice(0, 10)),
      ["2026-01-31", "2026-02-28", "2026-03-31"],
    );
  });

  it("numbers installments sequentially from 1", () => {
    const parts = generateInstallments(200, 2, "2026-09-10T12:00:00.000Z");
    assert.deepEqual(parts.map((p) => p.installmentNumber), [1, 2]);
  });
});
