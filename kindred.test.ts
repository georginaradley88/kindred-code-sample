import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeShapedAsk } from "./ask-shaper.ts";
import { canAccept, canConfirm, computeWeeklyStreak, londonWeekStart } from "./kindness.ts";

describe("Turning a model suggestion into a request", () => {
  it("cleans the draft title and caps the duration at 30 minutes", () => {
    const draft = normalizeShapedAsk({
      title: "  Carry   a bookshelf  ",
      category: "carry",
      minutes: 75,
    });

    assert.deepEqual(draft, { title: "Carry a bookshelf", category: "carry", minutes: 30 });
  });

  it("recognises a pet request", () => {
    assert.equal(normalizeShapedAsk({ category: "pets" }).category, "pets");
  });

  it("supplies defaults for an unknown category and a missing duration", () => {
    const draft = normalizeShapedAsk({ title: "Share a cup of tea", category: "other" });
    assert.equal(draft.category, "company");
    assert.equal(draft.minutes, 15);
  });

  it("limits the title length and rounds to an offered time slot", () => {
    const draft = normalizeShapedAsk({ title: "x".repeat(150), minutes: 18 });
    assert.equal(draft.title.length, 120);
    assert.equal(draft.minutes, 20);
  });
});

describe("Confirming a neighbour's help", () => {
  const open = { status: "open", author_id: "requester", helper_id: null };
  const accepted = { ...open, status: "accepted", helper_id: "helper" };

  it("lets another resident accept an open request", () => {
    assert.equal(canAccept(open, "helper"), true);
    assert.equal(canAccept(open, "requester"), false);
    assert.equal(canAccept(accepted, "other"), false);
  });

  it("allows only the requester to confirm the helper's work", () => {
    assert.equal(canConfirm(accepted, "requester"), true);
    assert.equal(canConfirm(accepted, "helper"), false);
    assert.equal(canConfirm(accepted, "other"), false);
    assert.equal(canConfirm(open, "requester"), false);
  });
});

describe("Weekly activity", () => {
  const now = new Date("2026-10-20T12:00:00Z");

  it("groups confirmations into London calendar weeks", () => {
    assert.equal(londonWeekStart("2026-10-18T23:30:00Z"), "2026-10-19");
  });

  it("counts each consecutive week once", () => {
    const dates = ["2026-10-19", "2026-10-20", "2026-10-12", "2026-10-07"];
    assert.equal(computeWeeklyStreak(dates, now), 3);
  });

  it("keeps last week's streak while this week is in progress", () => {
    assert.equal(computeWeeklyStreak(["2026-10-14"], now), 1);
  });

  it("returns zero for a missed week or an empty history", () => {
    assert.equal(computeWeeklyStreak(["2026-10-05"], now), 0);
    assert.equal(computeWeeklyStreak([], now), 0);
  });
});
