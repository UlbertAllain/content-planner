import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

const root = process.cwd();
const apply = process.argv.includes("--apply");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv(path.join(root, ".env.local"));

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin belum lengkap di .env.local. Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY.");
}

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const preview = JSON.parse(fs.readFileSync(path.join(root, "tools/migration/legacy-content-preview.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "tools/migration/migration.config.json"), "utf8"));

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

function localDate(dateString) {
  return dateString ? new Date(`${dateString}T00:00:00+07:00`) : null;
}

async function readUsers() {
  const snap = await db.collection("users").get();
  const byName = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    const key = normalize(data.name);
    if (!key) continue;
    const list = byName.get(key) || [];
    list.push({ id: doc.id, ...data });
    byName.set(key, list);
  }
  return byName;
}

async function readMaster(collectionName) {
  const snap = await db.collection(collectionName).get();
  const map = new Map();
  for (const doc of snap.docs) map.set(normalize(doc.data().name), { id: doc.id, ...doc.data() });
  return map;
}

async function ensureMaster(collectionName, cache, name) {
  if (!name) return null;
  const key = normalize(name);
  if (cache.has(key)) return cache.get(key).id;
  if (!apply) return `MISSING:${name}`;

  const ref = db.collection(collectionName).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    name: String(name).trim(),
    isActive: true,
    order: cache.size,
    createdAt: now,
    updatedAt: now,
  });
  cache.set(key, { id: ref.id, name, isActive: true });
  return ref.id;
}

async function resolvePic(usersByName, name) {
  if (!name) return null;
  const matches = usersByName.get(normalize(name)) || [];
  if (matches.length === 0) return { error: `PIC \"${name}\" belum ada di menu Team.` };
  if (matches.length > 1) return { error: `Nama PIC \"${name}\" ditemukan lebih dari satu. Bedakan nama pengguna sebelum migrasi.` };
  if (matches[0].status !== "ACTIVE") return { error: `PIC \"${name}\" sedang nonaktif.` };
  return { id: matches[0].id };
}

async function findExistingImport(importKey) {
  const snap = await db.collection("contents").where("legacyImportKey", "==", importKey).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

const [usersByName, companies, pillars, goals, platforms, formats] = await Promise.all([
  readUsers(),
  readMaster("companies"),
  readMaster("contentPillars"),
  readMaster("contentGoals"),
  readMaster("platforms"),
  readMaster("formats"),
]);

const allUsers = [...usersByName.values()].flat();
const migrationActor = allUsers.find((user) => user.role === "ADMIN" && user.status === "ACTIVE");
if (!migrationActor) throw new Error("Tidak ada Admin aktif di collection users. Buat/login-kan Admin pertama sebelum menjalankan migrasi.");

const missingUsers = new Set();
for (const record of preview.records) {
  if (!record.picName) continue;
  const result = await resolvePic(usersByName, record.picName);
  if (result?.error) missingUsers.add(result.error);
}

console.log(`\nLegacy migration: ${preview.sourceRowsRead} baris Excel -> ${preview.recordsAfterDeduplication} konten unik.`);
console.log(`Duplikasi yang sudah digabung: ${preview.duplicatesMerged.length}.`);

if (missingUsers.size) {
  console.log("\nPengguna yang harus dibereskan sebelum import:");
  for (const message of missingUsers) console.log(`- ${message}`);
  console.log("Baris dengan PIC yang belum dikenali akan diimpor tanpa pemilik dan bisa diambil alih dari sistem.");
}

const allPlatformNames = Array.isArray(config.allPlatforms) ? config.allPlatforms.filter(Boolean) : [];
const legacyCompanyName = String(config.companyName || "").trim();
if (!legacyCompanyName) throw new Error("migration.config.json harus memiliki companyName untuk menentukan perusahaan dari data Excel lama.");
if (preview.records.some((record) => record.platformMode === "ALL") && allPlatformNames.length === 0) {
  throw new Error("migration.config.json harus memiliki allPlatforms karena Excel memakai nilai 'All'.");
}

const summary = { imported: 0, skippedExisting: 0, draft: 0, inProgress: 0, published: 0, unowned: 0 };
const missingMasterNames = new Set();

for (const record of preview.records) {
  if (await findExistingImport(record.legacyImportKey)) {
    summary.skippedExisting += 1;
    continue;
  }

  const pic = await resolvePic(usersByName, record.picName);
  const companyId = await ensureMaster("companies", companies, legacyCompanyName);
  const pillarId = await ensureMaster("contentPillars", pillars, record.categoryName);
  const goalId = await ensureMaster("contentGoals", goals, record.goalName);
  const formatId = await ensureMaster("formats", formats, record.formatName);

  const desiredPlatformNames = record.platformMode === "ALL" ? allPlatformNames : record.platformNames;
  const platformIds = [];
  for (const platformName of desiredPlatformNames) {
    const id = await ensureMaster("platforms", platforms, platformName);
    if (id) platformIds.push(id);
  }

  for (const value of [companyId, pillarId, goalId, formatId, ...platformIds]) {
    if (typeof value === "string" && value.startsWith("MISSING:")) missingMasterNames.add(value.slice(8));
  }

  if (!apply) continue;

  const plannedPublishAt = localDate(record.date);
  const mappedStatus = ["PLANNED", "IDEA"].includes(record.status) ? "DRAFT" : record.status === "IN_PRODUCTION" ? "IN_PROGRESS" : record.status;
  const publishedAt = mappedStatus === "PUBLISHED" ? plannedPublishAt : null;
  const ownerId = pic?.id || null;
  const ref = db.collection("contents").doc();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  batch.set(ref, {
    legacyImportKey: record.legacyImportKey,
    legacy: {
      sourceFile: preview.sourceFile,
      sourceRows: record.sourceRows,
      originalStatus: record.legacyStatus || null,
      designNote: record.designNote || null,
    },
    companyId,
    title: record.title || null,
    pillarId: pillarId || null,
    goalId: goalId || null,
    platformIds: platformIds.filter((value) => !String(value).startsWith("MISSING:")),
    formatId: formatId || null,
    copy: {
      brief: "",
      script: "",
      caption: record.caption || "",
    },
    status: mappedStatus,
    ownerId,
    plannedPublishAt: plannedPublishAt ? Timestamp.fromDate(plannedPublishAt) : null,
    scheduleHasTime: false,
    publishedAt: publishedAt ? Timestamp.fromDate(publishedAt) : null,
    publishedUrl: record.publishedUrl || null,
    createdBy: migrationActor.id,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    archivedBy: null,
  });

  const addAsset = (type, label, url) => {
    if (!url) return;
    const assetRef = db.collection("contentAssets").doc();
    batch.set(assetRef, {
      contentId: ref.id,
      type,
      source: "EXTERNAL",
      label,
      url,
      publicId: null,
      resourceType: null,
      fileName: null,
      format: null,
      bytes: null,
      uploadedBy: migrationActor.id,
      createdAt: now,
    });
  };

  addAsset("REFERENCE", "Referensi dari Content Planner lama", record.referenceUrl);
  addAsset("WORKING_FILE", "File desain dari Content Planner lama", record.designUrl);


  const activityRef = db.collection("activities").doc();
  batch.set(activityRef, {
    entityType: "CONTENT",
    entityId: ref.id,
    actorId: migrationActor.id,
    action: "LEGACY_IMPORTED",
    metadata: { sourceRows: record.sourceRows },
    createdAt: now,
  });

  await batch.commit();
  summary.imported += 1;
  if (mappedStatus === "DRAFT") summary.draft += 1;
  else if (mappedStatus === "IN_PROGRESS") summary.inProgress += 1;
  else if (mappedStatus === "PUBLISHED") summary.published += 1;
  if (!ownerId) summary.unowned += 1;
}

if (!apply) {
  console.log("\nDRY RUN — belum ada data yang ditulis.");
  if (missingMasterNames.size) {
    console.log("Data master berikut belum ada dan akan dibuat otomatis saat --apply:");
    for (const name of [...missingMasterNames].sort()) console.log(`- ${name}`);
  }
  console.log(`Semua data Excel akan dimasukkan ke perusahaan: ${legacyCompanyName}.`);
  console.log(`Nilai Excel 'All' akan dipetakan ke: ${allPlatformNames.join(", ")}.`);
  console.log("Jika hasil ini sudah benar, jalankan: npm run migrate:legacy -- --apply\n");
} else {
  console.log("\nMigrasi selesai.");
  console.table(summary);
  console.log("Buka /contents dan /calendar untuk verifikasi hasil.\n");
}
