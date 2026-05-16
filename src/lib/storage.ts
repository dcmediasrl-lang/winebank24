import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Cloudflare R2 is S3-compatible. Required env vars:
//   R2_ACCOUNT_ID        — Cloudflare account ID
//   R2_ACCESS_KEY_ID     — R2 API token key ID
//   R2_SECRET_ACCESS_KEY — R2 API token secret
//   R2_BUCKET_NAME       — bucket name
//   R2_PUBLIC_URL        — public base URL, e.g. https://pub-xxxx.r2.dev  (or custom domain)

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 non configurato. Imposta R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY nel file .env.local"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export type UploadResult = {
  url: string;
  key: string;
};

/**
 * Upload a single file Buffer to R2.
 * Returns the public URL and the storage key.
 */
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "nft-images"
): Promise<UploadResult> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!bucket || !publicUrl) {
    throw new Error(
      "R2 non configurato. Imposta R2_BUCKET_NAME e R2_PUBLIC_URL nel file .env.local"
    );
  }

  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Public-read via R2 bucket settings — no ACL needed for R2
    })
  );

  return { url: `${publicUrl}/${key}`, key };
}

/**
 * Delete a file from R2 by its storage key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
