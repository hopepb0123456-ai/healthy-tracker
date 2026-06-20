import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createDefaultState,
  calculateMealTotals,
  progressionAdvice,
  runningStageForWeek,
  mergeInBodyRecords,
  validateInBodyImport,
  validateBackup,
  createBackup
} from "../js/core.js";

test("meal totals add calories and protein", () => {
  assert.deepEqual(calculateMealTotals([
    { kcal: 430, protein: 30 },
    { kcal: 590, protein: 45 },
    { kcal: "250", protein: "27" }
  ]), { kcal: 1270, protein: 102 });
});

test("progression increases only after both sets reach 12 at manageable RPE", () => {
  assert.equal(progressionAdvice({ reps1: 12, reps2: 12, rpe: 7 }).status, "increase");
  assert.equal(progressionAdvice({ reps1: 12, reps2: 11, rpe: 7 }).status, "hold");
  assert.equal(progressionAdvice({ reps1: 12, reps2: 12, rpe: 9 }).status, "reduce");
  assert.equal(progressionAdvice({ reps1: 12, reps2: 12, rpe: 6, pain: true }).status, "stop");
});

test("running plan advances every two weeks and caps at stage six", () => {
  assert.deepEqual(runningStageForWeek(1), { runSeconds: 30, walkSeconds: 90, totalMinutes: 10, stage: 1 });
  assert.equal(runningStageForWeek(4).stage, 2);
  assert.equal(runningStageForWeek(12).runSeconds, 180);
  assert.equal(runningStageForWeek(99).stage, 6);
});

test("InBody import merges by date without duplicates", () => {
  const existing = [{ date: "2026-01-01", weightKg: 99 }];
  const incoming = [
    { date: "2026-01-01", weightKg: 98 },
    { date: "2026-02-01", weightKg: 97 }
  ];
  const merged = mergeInBodyRecords(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].weightKg, 98);
});

test("private InBody file validates all five metrics", () => {
  const valid = {
    schemaVersion: 1,
    type: "healthy-tracker-inbody",
    records: [{ date: "2026-06-14", weightKg: 70, skeletalMuscleKg: 30, bodyFatMassKg: 20, bodyFatPercent: 25, visceralFatLevel: 5 }]
  };
  assert.equal(validateInBodyImport(valid), true);
  assert.equal(validateInBodyImport({ ...valid, records: [{ ...valid.records[0], bodyFatPercent: "bad" }] }), false);
});

test("backup round-trip accepts current schema and rejects old schema", () => {
  const state = createDefaultState("2026-06-20");
  const backup = createBackup(state, "2026-06-20T00:00:00.000Z");
  assert.equal(validateBackup(JSON.parse(JSON.stringify(backup))), true);
  assert.equal(validateBackup({ ...backup, schemaVersion: 0 }), false);
});

test("private import contains seven valid records and stays idempotent", async () => {
  const data = JSON.parse(await readFile(new URL("../outputs/inbody-private-import.json", import.meta.url), "utf8"));
  assert.equal(validateInBodyImport(data), true);
  assert.equal(data.records.length, 7);
  assert.equal(mergeInBodyRecords(data.records, data.records).length, 7);
});

test("PWA files use relative paths compatible with a GitHub Pages subpath", async () => {
  const [manifestText, worker] = await Promise.all([
    readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../sw.js", import.meta.url), "utf8")
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.icons.some(icon => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some(icon => icon.sizes === "512x512"));
  assert.match(worker, /"\.\/index\.html"/);
});
