/**
 * One-time setup: configures CORS and bucket public access for the upsc-app S3 bucket.
 * Run with: node scripts/setup-s3-cors.mjs
 */
import { S3Client, PutBucketCorsCommand, PutBucketPolicyCommand, DeletePublicAccessBlockCommand } from '@aws-sdk/client-s3';

import fs from 'fs';
import path from 'path';

// Load .env from the same directory if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim();
        }
    });
}

const BUCKET = process.env.EXPO_PUBLIC_AWS_BUCKET_NAME || 'upsc-app';
const REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'eu-north-1';

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY,
    }
});

if (!process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Error: EXPO_PUBLIC_AWS_ACCESS_KEY_ID or EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY is missing.');
    console.info('💡 Ensure you have a .env file in the Frontend directory with these keys.');
    process.exit(1);
}



async function main() {
    // 1. Remove the "Block Public Access" block so objects can be set public-read
    console.log('⏳ Removing public access block...');
    await s3Client.send(new DeletePublicAccessBlockCommand({ Bucket: BUCKET }));
    console.log('✅ Public access block removed.');

    // 2. Add a bucket policy that allows public GET on all objects
    console.log('⏳ Setting bucket policy...');
    const bucketPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${BUCKET}/*`
            }
        ]
    });
    await s3Client.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: bucketPolicy }));
    console.log('✅ Bucket policy applied — public GET allowed.');

    // 3. Configure CORS
    console.log('⏳ Setting CORS...');
    await s3Client.send(new PutBucketCorsCommand({
        Bucket: BUCKET,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedOrigins: ['*'],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    AllowedHeaders: ['*'],
                    ExposeHeaders: ['ETag', 'x-amz-request-id'],
                    MaxAgeSeconds: 3600,
                }
            ]
        }
    }));
    console.log('✅ CORS configured.');
    console.log('\n🎉 All done! Your S3 bucket is ready for uploads.');
}

main().catch(err => {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
});
