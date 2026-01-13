import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME;

export async function createPresignedUpload({ key, contentType }) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

    return {
        url,
        object_key: key
    };
}