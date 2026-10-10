# UniTools sharing Worker

This Worker implements the sharing API described in `brain/05-FILE-SHARING-SPEC.md`. It stores ciphertext or code-protected bytes in R2 and short-lived JSON metadata in KV. It does not log filenames, file bytes, or full IP addresses.

## Bindings

Configure these names in the Cloudflare dashboard or Wrangler:

- `FILES`: R2 bucket binding for file objects.
- `META`: KV namespace binding for metadata, expiry records, and hashed rate-limit counters.
- `ALLOWED_ORIGIN`: a plain Worker environment variable containing the exact Pages/site origin, such as `https://example.pages.dev`. Do not put a secret here.

The browser pages in `public/tools/` use `/api` by default. Deploy this Worker behind that path on the site origin, or change the `share-api` meta tag on the three sharing pages to the Worker API base URL. If the Worker is on another origin, set `ALLOWED_ORIGIN` to the Pages origin; no wildcard CORS is supported.

## Wrangler shape

Use a local `wrangler.toml` or dashboard configuration with the binding names above. Keep account IDs, bucket IDs, namespace IDs, and any tokens out of this repository. A schedule of `*/5 * * * *` is appropriate for expiry cleanup.

The Worker enforces a 50 MB upload limit, 5 uploads per hashed IP per hour, 5 download attempts per hashed IP/code bucket for 10 minutes, the documented expiry choices, and the 24-hour maximum lifetime. KV is eventually consistent, so the expiry check in every read path remains the hard stop.

## Local test outline

Run the Worker with Wrangler and temporary local R2/KV bindings, then test `OPTIONS`, upload, metadata, download, delete, expiry, wrong-code attempts, and the one-download link. Do not use production bindings for tests. Cloudflare's current free-tier storage and request limits must be checked before deployment.