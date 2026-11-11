import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { db } from "./db";

export const MAX_PHOTOS = 6;
const MAX_BYTES = 8 * 1024 * 1024;
export const photoBatchLimit = process.env.VERCEL === "1" ? 4_000_000 : undefined;
const MAX_PIXELS = 50_000_000;
const FORMATS = new Set(["jpeg", "png", "webp"]);

// Where photos live. With S3_BUCKET set, any S3-compatible store (Cloudflare R2, AWS S3, Backblaze B2):
// files are served from S3_PUBLIC_URL (a public bucket URL or CDN in front of it). Without it, local disk
// under public/ (development only: most hosts wipe it on every deploy).
const ROOT = path.join(process.cwd(), "public", "uploads", "listings");
const bucket = process.env.S3_BUCKET;
const publicBase = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
const s3 = bucket
  ? new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
    })
  : null;
const keyFor = (listingId: string, name: string) => `listings/${listingId}/${name}`;

async function store(listingId: string, name: string, data: Buffer) {
  if (s3) {
    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: keyFor(listingId, name), Body: data, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }),
    );
    return `${publicBase}/${keyFor(listingId, name)}`;
  }
  await mkdir(path.join(ROOT, listingId), { recursive: true });
  await writeFile(path.join(ROOT, listingId, name), data);
  return `/uploads/listings/${listingId}/${name}`;
}

async function remove(url: string) {
  if (s3 && publicBase && url.startsWith(`${publicBase}/listings/`)) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: url.slice(publicBase.length + 1) }));
    return;
  }
  if (!url.startsWith("/uploads/listings/")) return;
  await rm(path.join(process.cwd(), "public", url), { force: true });
}

// Checks uploads before anything is saved. Returns an error message or null.
export async function checkPhotos(files: File[], existingCount: number): Promise<string | null> {
  if (photoBatchLimit && files.reduce((sum, file) => sum + file.size, 0) > photoBatchLimit) {
    return "Choose photos totaling 4 MB or less per submission. You can add more photos by editing the listing.";
  }
  if (existingCount + files.length > MAX_PHOTOS) return `You can add up to ${MAX_PHOTOS} photos.`;
  for (const f of files) {
    if (f.size > MAX_BYTES) return `"${f.name}" is over 8 MB. Choose a smaller photo.`;
    // Trust the image data, not the file name or browser-reported type.
    try {
      const meta = await sharp(Buffer.from(await f.arrayBuffer()), { limitInputPixels: MAX_PIXELS }).metadata();
      if (!meta.format || !FORMATS.has(meta.format)) return `"${f.name}" isn't a JPEG, PNG or WebP photo.`;
      if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXELS) return `“${f.name}” is over 50 megapixels. Resize it and try again.`;
      if ((meta.width ?? 0) < 300 || (meta.height ?? 0) < 300) return `"${f.name}" is too small. Use photos at least 300 pixels wide.`;
    } catch {
      return `"${f.name}" couldn't be read as a photo.`;
    }
  }
  return null;
}

// Resizes, converts to WebP and drops all metadata (EXIF, including GPS location) before saving.
export async function savePhotos(listingId: string, files: File[]) {
  const start = await db.listingPhoto.count({ where: { listingId } });
  for (const [i, f] of files.entries()) {
    const input = sharp(Buffer.from(await f.arrayBuffer()), { limitInputPixels: MAX_PIXELS }).rotate();
    const full = await input.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const thumb = await input.clone().resize({ width: 600, height: 450, fit: "cover" }).webp({ quality: 75 }).toBuffer();
    const name = randomBytes(8).toString("hex");
    await db.listingPhoto.create({
      data: {
        listingId,
        url: await store(listingId, `${name}.webp`, full.data),
        thumbUrl: await store(listingId, `${name}-thumb.webp`, thumb),
        width: full.info.width,
        height: full.info.height,
        position: start + i,
      },
    });
  }
}

export async function deletePhotos(listingId: string, ids: string[]) {
  const photos = await db.listingPhoto.findMany({ where: { listingId, id: { in: ids } } });
  for (const p of photos) {
    await remove(p.url);
    await remove(p.thumbUrl);
  }
  await db.listingPhoto.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } });
  // Close the gaps so the first remaining photo becomes the cover.
  const left = await db.listingPhoto.findMany({ where: { listingId }, orderBy: { position: "asc" } });
  for (const [i, p] of left.entries()) if (p.position !== i) await db.listingPhoto.update({ where: { id: p.id }, data: { position: i } });
}

// Removes every stored file for a listing (call when the listing is deleted).
export async function deleteListingFiles(listingId: string) {
  if (!/^[a-z0-9]+$/i.test(listingId)) return;
  if (s3) {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `listings/${listingId}/` }));
    const keys = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length) await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }));
    return;
  }
  await rm(path.join(ROOT, listingId), { recursive: true, force: true });
}

export function uploadedFiles(form: FormData, name: string) {
  return form.getAll(name).filter((v): v is File => v instanceof File && v.size > 0);
}
