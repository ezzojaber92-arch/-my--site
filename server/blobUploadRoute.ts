import { handleUploadPresigned } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import type { Express, Request, Response } from "express";
import { hasExternalAdminSession } from "./externalAdminAuth";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

// The current Blob SDK requires a public webhook key even for presigned URL generation.
// Vercel may inject the real key; the fallback is public-only and is never used as a secret.
const FALLBACK_BLOB_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAogZu1ggDOPjruoMlqC2a
/FQTdFDUdmPRpq2k9hRFk7LHg5WGyIFPLlB/Hix0U5hYJxTsXgbwM+bz7GpRucHm
OjAzg3nMk9jOvQ/zNV5SrVQyDEZ5vMnBE7q+zldsFOzuqjHSpqbgrZ9S9ydXn09D
bNbEsFuzFCiDOk8SN6T0jEmjxVMQ5rOWhje/O4vGIivGGKN6Vbs7JGaT4ZpD7Z2u
ecYSqMsT0kIRR5plmEuXYu+kgW4/sy74CfmwMaZ5lo0oFcCUmZcahleLNHAxm1js
CxhWnhvoWZ+eSEskhKVE6fdRfvzrgA+4S8QV4SuQMUUoGFVP/VnMky+78Txke8TY
JwIDAQAB
-----END PUBLIC KEY-----`;

const blobWebhookPublicKey = process.env.BLOB_WEBHOOK_PUBLIC_KEY || FALLBACK_BLOB_WEBHOOK_PUBLIC_KEY;

export function registerBlobUploadRoute(app: Express) {
  app.post("/api/media/upload-presigned", async (req: Request, res: Response) => {
    if (!(await hasExternalAdminSession(req))) {
      res.status(401).json({ error: "Not authorized" });
      return;
    }

    try {
      const request = new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
        method: req.method,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        ),
        body: JSON.stringify(req.body ?? {}),
      });
      const jsonResponse = await handleUploadPresigned({
        body: req.body,
        request,
        webhookPublicKey: blobWebhookPublicKey,
        getSignedToken: async (pathname: string) => ({
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_MEDIA_BYTES,
            validUntil: Date.now() + 10 * 60 * 1000,
          }),
          urlOptions: {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_MEDIA_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
            validUntil: Date.now() + 10 * 60 * 1000,
            cacheControlMaxAge: 30 * 24 * 60 * 60,
          },
        }),
      });
      res.status(200).json(jsonResponse);
    } catch (error) {
      console.error("[Blob] Presigned upload failed", {
        code: error instanceof Error ? error.name : "UNKNOWN",
      });
      res.status(400).json({ error: "تعذر تجهيز رفع الوسيط. حاول مرة أخرى." });
    }
  });
}
