// Vercel serverless entrypoint for the Express API.
//
// We import the pre-bundled, self-contained ESM output produced by the
// api-server esbuild build (build.mjs) instead of the raw TypeScript source.
// The raw source pulls in pnpm-workspace packages and pino worker-thread
// transports that Vercel's @vercel/node bundler cannot trace correctly, which
// breaks the deployment. The esbuild bundle already inlines those safely.
//
// @ts-expect-error - generated bundle, no type declarations
import app from "../artifacts/api-server/dist/app.mjs";

export default app;
