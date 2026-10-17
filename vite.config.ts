import { appendFileSync, mkdirSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const PLAYLOG_DIR = 'playlogs';
const MAX_BODY = 64 * 1024;

/**
 * Dev server only: accepts play-log entries from the UI (POST /__playlog) and
 * appends them as JSON lines to playlogs/<date>.jsonl. `npm run playlog`
 * replays and summarizes them. Not part of production builds.
 */
function playLog(): Plugin {
  return {
    name: 'playlog',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__playlog', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
          if (body.length > MAX_BODY) req.destroy();
        });
        req.on('end', () => {
          try {
            const entry: unknown = JSON.parse(body);
            mkdirSync(PLAYLOG_DIR, { recursive: true });
            appendFileSync(`${PLAYLOG_DIR}/${new Date().toISOString().slice(0, 10)}.jsonl`, `${JSON.stringify(entry)}\n`);
            res.statusCode = 204;
          } catch {
            res.statusCode = 400;
          }
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), playLog()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
