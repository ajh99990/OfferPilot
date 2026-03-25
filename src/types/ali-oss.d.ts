declare module "ali-oss" {
  export interface OssClientOptions {
    accessKeyId: string;
    accessKeySecret: string;
    bucket?: string;
    region?: string;
    stsToken?: string;
    secure?: boolean;
    useFetch?: boolean;
  }

  export interface StsOptions {
    accessKeyId: string;
    accessKeySecret: string;
  }

  export interface SignatureUrlOptions {
    expires?: number;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
    secure?: boolean;
  }

  export interface PutResult {
    name: string;
    url: string;
    res?: unknown;
  }

  export interface StsCredentials {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  }

  export interface AssumeRoleResult {
    credentials: StsCredentials;
  }

  export class STS {
    constructor(options: StsOptions);
    assumeRole(
      roleArn: string,
      policy: string,
      expirationSeconds: number,
      sessionName: string,
      options?: Record<string, unknown>,
    ): Promise<AssumeRoleResult>;
  }

  export default class OSS {
    constructor(options: OssClientOptions);
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
    put(name: string, file: Blob | File, options?: Record<string, unknown>): Promise<PutResult>;
    static STS: typeof STS;
  }
}
