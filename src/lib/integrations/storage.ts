import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadKind = "logo" | "cover" | "avatar";

function config() {
  const endpoint = process.env.STORAGE_ENDPOINT?.trim();
  const bucket = process.env.STORAGE_BUCKET?.trim();
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY?.trim();
  const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl };
}

export function storageIsConfigured() {
  return Boolean(config());
}

function client(values: NonNullable<ReturnType<typeof config>>) {
  return new S3Client({ endpoint: values.endpoint, region: "auto", forcePathStyle: true, credentials: { accessKeyId: values.accessKeyId, secretAccessKey: values.secretAccessKey } });
}

function readUInt24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readImageDimensions(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/png" && bytes.length >= 24 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])) return { width: new DataView(bytes.buffer, bytes.byteOffset).getUint32(16), height: new DataView(bytes.buffer, bytes.byteOffset).getUint32(20) };
  if (contentType === "image/gif" && bytes.length >= 10 && String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a" || contentType === "image/gif" && bytes.length >= 10 && String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a") return { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) };
  if (contentType === "image/webp" && bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    const format = String.fromCharCode(...bytes.slice(12, 16));
    if (format === "VP8X") return { width: readUInt24LE(bytes, 24) + 1, height: readUInt24LE(bytes, 27) + 1 };
    if (format === "VP8L" && bytes[20] === 0x2f) return { width: 1 + ((bytes[21] | (bytes[22] << 8)) & 0x3fff), height: 1 + (((bytes[22] >> 6) | (bytes[23] << 2) | (bytes[24] << 10)) & 0x3fff) };
  }
  if (contentType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (offset + 2 > bytes.length) break;
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) break;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) return { width: (bytes[offset + 5] << 8) | bytes[offset + 6], height: (bytes[offset + 3] << 8) | bytes[offset + 4] };
      offset += length;
    }
  }
  if (contentType === "image/avif") {
    const marker = String.fromCharCode(105, 115, 112, 101);
    for (let index = 4; index + 16 <= bytes.length; index += 1) if (String.fromCharCode(...bytes.slice(index, index + 4)) === marker) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      return { width: view.getUint32(index + 8), height: view.getUint32(index + 12) };
    }
  }
  return undefined;
}

export async function createStorageUpload({ userId, kind, contentType, size }: { userId: string; kind: UploadKind; contentType: string; size: number }) {
  const values = config();
  if (!values) return { ok: false as const, message: "Object storage is not configured." };
  if (!/^image\/(png|jpeg|webp|avif|gif)$/i.test(contentType)) return { ok: false as const, message: "Only PNG, JPEG, WebP, AVIF, or GIF images are supported." };
  if (!Number.isInteger(size) || size <= 0 || size > 10 * 1024 * 1024) return { ok: false as const, message: "Images must be between 1 byte and 10 MB." };
  const key = `uploads/${userId}/${kind}/${crypto.randomUUID()}.${contentType.split("/")[1].replace("jpeg", "jpg")}`;
  // Size is validated before signing, but is intentionally not included in the
  // signature. That lets browsers upload through S3-compatible providers without
  // requiring a provider-specific Content-Length header.
  const command = new PutObjectCommand({ Bucket: values.bucket, Key: key, ContentType: contentType, CacheControl: "public,max-age=31536000,immutable" });
  const uploadUrl = await getSignedUrl(client(values), command, { expiresIn: 600 });
  return { ok: true as const, key, uploadUrl, publicUrl: `${values.publicUrl}/${key}` };
}

export async function verifyStorageUpload({ userId, key, contentType, size }: { userId: string; key: string; contentType: string; size: number }) {
  const values = config();
  if (!values) return { ok: false as const, message: "Object storage is not configured." };
  if (!key.startsWith(`uploads/${userId}/`) || key.includes("..")) return { ok: false as const, message: "That upload does not belong to this account." };
  try {
    const head = await client(values).send(new HeadObjectCommand({ Bucket: values.bucket, Key: key }));
    const actualType = String(head.ContentType ?? "");
    const actualSize = Number(head.ContentLength ?? 0);
    if (actualType.toLowerCase() !== contentType.toLowerCase() || actualSize !== size) return { ok: false as const, message: "The uploaded file metadata did not match the signed upload." };
    const object = await client(values).send(new GetObjectCommand({ Bucket: values.bucket, Key: key }));
    const bytes = object.Body ? await object.Body.transformToByteArray() : new Uint8Array();
    const dimensions = readImageDimensions(bytes, contentType.toLowerCase());
    if (!dimensions || dimensions.width < 32 || dimensions.height < 32 || dimensions.width > 4096 || dimensions.height > 4096) return { ok: false as const, message: "The uploaded image dimensions are not supported." };
    return { ok: true as const, publicUrl: `${values.publicUrl}/${key}` };
  } catch {
    return { ok: false as const, message: "The uploaded object could not be verified." };
  }
}
