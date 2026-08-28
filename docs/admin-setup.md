# Portfolio admin setup

The `/admin` route publishes Markdown and images to GitHub. Secrets remain on the server and must be configured in Vercel (and in `.env.local` for local development).

## 1. Generate the password hash

```powershell
node scripts/hash-admin-password.mjs
```

Copy the resulting `ADMIN_PASSWORD_HASH` value. The clear-text password is never stored by the application.

## 2. Configure server variables

```text
ADMIN_PASSWORD_HASH=scrypt:...:...
ADMIN_SESSION_SECRET=<at least 32 random characters>
GITHUB_CONTENT_TOKEN=<fine-grained GitHub token>
GITHUB_CONTENT_REPOSITORY=zixload/portfolio-site
GITHUB_CONTENT_BRANCH=master
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Create the fine-grained GitHub token for this repository only, with **Contents: Read and write**. The admin creates one atomic commit containing the Markdown file, the post manifest and all imported images.

Use an Upstash Redis database for the distributed login and publication rate limits. Production deliberately refuses authentication when Redis is not configured; the in-memory fallback is development-only.

Generate `ADMIN_SESSION_SECRET` with a cryptographically secure random generator and never reuse the admin password as this secret.

## 3. Deployment

Add all variables to the Production, Preview and Development environments as appropriate. If the GitHub repository is connected to Vercel, publishing a post triggers the normal deployment automatically.

The public content paths are:

- `src/posts/<slug>.md`
- `src/posts/index.json`
- `public/blog/<slug>/<image>`

Local drafts stay in the browser's `localStorage` and are not sent anywhere until **Publier sur GitHub** is selected.
