import { randomUUID } from "node:crypto";
import OSS from "ali-oss";

const ASSUME_ROLE_DURATION_SECONDS = 3000;
const SIGNED_URL_DURATION_SECONDS = 300;

type OssBucketRule = {
  region: string;
  prefix: (storageOwnerId: string) => string;
};

type RuntimeOssConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  roleArn: string;
  cdnHost?: string;
};

export type OssStsPayload = {
  AccessKeyId: string;
  AccessKeySecret: string;
  SecurityToken: string;
  Expiration: string;
  bucket: string;
  region: string;
  prefix: string;
  perPath: string;
  cdnHost?: string;
};

export type OssSignedUrlPayload = {
  key: string;
  url: string;
  expiresAt: number;
};

export class OssApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "OSS_API_ERROR", status = 400) {
    super(message);
    this.name = "OssApiError";
    this.code = code;
    this.status = status;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new OssApiError(
      "简历文件服务配置缺失，暂时无法处理上传请求。",
      "OSS_ENV_MISSING",
      500,
    );
  }
  return value;
}

function getRuntimeConfig(): RuntimeOssConfig {
  return {
    accessKeyId: getRequiredEnv("OSS_ACCESS_KEY_ID"),
    accessKeySecret: getRequiredEnv("OSS_ACCESS_KEY_SECRET"),
    bucket: getRequiredEnv("OSS_BUCKET"),
    region: getRequiredEnv("OSS_REGION"),
    roleArn: getRequiredEnv("OSS_ROLE_ARN"),
    cdnHost: process.env.CDN_HOST?.trim() || undefined,
  };
}

function getBucketRules(config: RuntimeOssConfig): Map<string, OssBucketRule> {
  return new Map([
    [
      config.bucket,
      {
        region: config.region,
        prefix: (storageOwnerId) => {
          if (storageOwnerId.startsWith("user:")) {
            return `user/${storageOwnerId.replace(/^user:/, "")}/`;
          }

          if (storageOwnerId.startsWith("guest:")) {
            return `guest/${storageOwnerId.replace(/^guest:/, "")}/`;
          }

          throw new OssApiError(
            "上传身份无效，请重新登录或刷新页面。",
            "OSS_INVALID_OWNER",
            400,
          );
        },
      },
    ],
  ]);
}

export function resolveBucket(bucket?: string): string {
  const config = getRuntimeConfig();
  const targetBucket = bucket?.trim() || config.bucket;
  const rules = getBucketRules(config);

  if (!rules.has(targetBucket)) {
    throw new OssApiError(
      "上传目标无效，请稍后再试。",
      "OSS_BUCKET_NOT_ALLOWED",
      403,
    );
  }

  return targetBucket;
}

function normalizeObjectKey(key: string): string {
  const normalized = key.trim().replace(/^\/+/, "");
  if (!normalized) {
    throw new OssApiError("缺少有效的文件标识。", "OSS_KEY_REQUIRED", 400);
  }
  return normalized;
}

function toCdnUrl(url: string, cdnHost?: string): string {
  if (!cdnHost) {
    return url;
  }

  const cdnUrl = new URL(url);
  cdnUrl.protocol = "https:";
  cdnUrl.host = cdnHost;
  return cdnUrl.toString();
}

function getBucketRule(bucket: string): OssBucketRule {
  const config = getRuntimeConfig();
  const rule = getBucketRules(config).get(bucket);
  if (!rule) {
    throw new OssApiError(
      "上传目标无效，请稍后再试。",
      "OSS_BUCKET_NOT_ALLOWED",
      403,
    );
  }
  return rule;
}

function createStsClient(config: RuntimeOssConfig) {
  return new OSS.STS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
  });
}

function createOssClient(config: RuntimeOssConfig, bucket: string, region: string) {
  return new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket,
    region,
  });
}

export async function createStsPayload(params: {
  bucket: string;
  storageOwnerId: string;
}): Promise<OssStsPayload> {
  const config = getRuntimeConfig();
  const rule = getBucketRule(params.bucket);
  const prefix = rule.prefix(params.storageOwnerId);
  const policy = JSON.stringify({
    Version: "1",
    Statement: [
      {
        Effect: "Allow",
        Action: ["oss:PutObject", "oss:GetObject"],
        Resource: [`acs:oss:*:*:${params.bucket}/${prefix}*`],
      },
    ],
  });

  const sts = createStsClient(config);
  const result = await sts.assumeRole(
    config.roleArn,
    policy,
    ASSUME_ROLE_DURATION_SECONDS,
    `offerpilot-nextjs-${randomUUID()}`,
  );

  const credentials = result?.credentials;
  if (!credentials) {
    throw new OssApiError(
      "获取简历上传凭证失败，请稍后再试。",
      "OSS_STS_EMPTY_RESULT",
      502,
    );
  }

  return {
    AccessKeyId: credentials.AccessKeyId,
    AccessKeySecret: credentials.AccessKeySecret,
    SecurityToken: credentials.SecurityToken,
    Expiration: credentials.Expiration,
    bucket: params.bucket,
    region: rule.region,
    prefix,
    perPath: prefix,
    cdnHost: config.cdnHost,
  };
}

export async function createSignedObjectUrl(params: {
  bucket: string;
  key: string;
  storageOwnerId: string;
}): Promise<OssSignedUrlPayload> {
  const config = getRuntimeConfig();
  const rule = getBucketRule(params.bucket);
  const key = normalizeObjectKey(params.key);
  const expectedPrefix = rule.prefix(params.storageOwnerId);

  if (!key.startsWith(expectedPrefix)) {
    throw new OssApiError(
      "无权查看这个文件。",
      "OSS_KEY_FORBIDDEN",
      403,
    );
  }

  const client = createOssClient(config, params.bucket, rule.region);
  const url = client.signatureUrl(key, {
    expires: SIGNED_URL_DURATION_SECONDS,
    method: "GET",
    secure: true,
  });

  return {
    key,
    url: toCdnUrl(url, config.cdnHost),
    expiresAt: Date.now() + SIGNED_URL_DURATION_SECONDS * 1000,
  };
}

export function getOssErrorResponse(error: unknown) {
  if (error instanceof OssApiError) {
    return {
      status: error.status,
      body: {
        ok: false as const,
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  console.error("oss route error", error);

  return {
    status: 500,
    body: {
      ok: false as const,
      error: {
        code: "OSS_INTERNAL_ERROR",
        message: "简历文件服务暂时不可用，请稍后再试。",
      },
    },
  };
}
