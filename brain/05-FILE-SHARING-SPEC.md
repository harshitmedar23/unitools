# 05 File sharing (tools 9, 10, 11)

Honest label always: "Encrypted and auto-deleted. Not permanent storage." This is not "files never leave your device".

## Tools
| | Quick share | Link share |
|---|---|---|
| For | Someone nearby (class, lab, phone to laptop) | Someone far away or several people |
| Receiver gets it by | Typing a 5-digit code | Opening a long random link or scanning its QR |
| Expiry | Fixed 10 minutes | 10 min, 1 hour or 24 hours |
| Max size | 50 MB | 50 MB |
| Password | Optional | Optional |
| Download limit | None | Optional: delete after 1 download |
| Guessable | Yes, so needs attempt limits | No, 20+ random characters |
| Sender controls | none | delete button |

Receive file: enter the 5-digit code or open a link, enter the password if needed, download.

## Components
- Cloudflare Worker: API and cron cleanup.
- R2: file bytes, key `f/<id>`.
- KV: metadata with expiry (`expirationTtl`; KV minimum TTL is 60 seconds, so the hard stop is also enforced by checking `exp` in code).

## KV records
```
code:<5digits>  -> { id, exp, hasPassword, attempts, size, name? }
link:<id>       -> { exp, hasPassword, dlLeft|null, deleteTokenHash, size }
```
Worker generates codes with `crypto.getRandomValues` and retries if the code already exists.

## API (all JSON, CORS only for our own origin)
- `POST /api/upload` : body = file bytes (encrypted if password set), headers carry mode, expiry, password flag. Returns `{ code }` or `{ link id, deleteToken }`.
- `GET /api/meta/:codeOrId` : size, hasPassword, expiry. No file bytes.
- `POST /api/download` : code or id (+ password proof if needed). Streams file, decrements `dlLeft`, deletes when 0.
- `DELETE /api/file/:id` : needs delete token.
- Cron trigger every few minutes: delete expired R2 objects and KV records.

## Encryption
- **Link share**: browser makes a random AES-GCM 256 key, encrypts, uploads ciphertext. The key goes in the URL after `#` so the server never receives it. If a password is also set, derive an extra key with PBKDF2 (SHA-256, at least 210,000 iterations, random salt stored with the file) and wrap the file key.
- **Quick share without password**: the receiver only has a 5-digit code, so there is nothing to carry a key. The file is protected by the code and the 10-minute expiry, and R2 encrypts at rest. Say this plainly in the UI.
- **Quick share with password**: encrypt in the browser with a key derived from the password (PBKDF2 as above) before upload.
- AES-GCM uses a random 12-byte IV stored in front of the ciphertext. Never reuse an IV with the same key.

## Safety rules (build these, then test them)
- Lock a code after about 5 wrong attempts. 5 digits is only 100,000 combinations. KV is eventually consistent, so counters can be slightly off; use a Durable Object for attempt counters if the free plan allows it, and check current limits.
- Rate limit uploads per IP (for example 5 files per hour). Store only a hash of the IP.
- Stop accepting uploads when total storage nears the free ceiling and say so kindly.
- Never keep anything longer than 24 hours.
- Show a short acceptable-use line on the upload page. Delete files on request.
- Check size on the client AND on the Worker (reject over 50 MB).
- Never log file names, contents, or full IP addresses.

## Pages
- `public/tools/quick-share.html`, `public/tools/link-share.html`, `public/tools/receive-file.html`.
- After upload: large code in mono type, a live countdown, a Copy button, and (link share) a QR using the same QR code library, plus a Delete button.
- Receive: one input (code or link), password field appears only if needed, clear error messages ("Wrong code. 3 tries left.", "This file has expired.").
