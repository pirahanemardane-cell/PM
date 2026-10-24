import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function getR2Bucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

export function getPublicUrl(key: string): string {
  const base = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  const k = key.replace(/^\//, "");
  return `${base}/${k}`;
}

export async function r2PutObject(opts: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
  return getPublicUrl(opts.key);
}

export async function r2DeleteObject(key: string) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  );
}


/** لیست کلیدهای یک پیشوند (صفحه‌بندی) */
export async function r2ListObjectKeys(opts: {
  prefix?: string;
  maxKeys?: number;
}): Promise<string[]> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  const maxKeys = Math.min(Math.max(opts.maxKeys ?? 5000, 1), 20000);
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: opts.prefix || undefined,
        ContinuationToken: token,
        MaxKeys: Math.min(1000, maxKeys - keys.length),
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token && keys.length < maxKeys);
  return keys;
}
