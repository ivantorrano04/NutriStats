# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment variables

This project expects the following environment variables for production and runtime configuration:

- `NEXT_PUBLIC_DEV_HOST` — public host used by the app when running locally or when checking links. Use an HTTPS URL in production (example: `https://api.your-production-domain.com`).
- `NEXT_PUBLIC_API_URL` — base URL for API requests (should be `https://...` in production).

Create a `.env.production` file at the project root with the production values. Example:

```text
NEXT_PUBLIC_DEV_HOST=https://api.your-production-domain.com
NEXT_PUBLIC_API_URL=https://api.your-production-domain.com
```

In the code we use a safe fallback when `NEXT_PUBLIC_DEV_HOST` is not set so the app will not crash if the environment variable is missing.
