import { S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? "",
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? ""
  };
}

export function createS3Client() {
  const region = process.env.AWS_REGION || "us-east-1";
  const profile = process.env.AWS_PROFILE;

  if (profile) {
    return new S3Client({
      region,
      credentials: fromIni({ profile }),
    });
  }

  return new S3Client({ region });
}
