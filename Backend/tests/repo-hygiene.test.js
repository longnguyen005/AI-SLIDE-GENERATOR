import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function resolveRepoPath(...segments) {
    return path.join(repoRoot, ...segments);
}

describe('Task 5: Docker Compose, GitHub Actions CI, Repo Hygiene & Documentation', () => {
    it('includes required Dockerfiles, nginx config, docker-compose.yml, CI workflow, and shared testDb helper', () => {
        const requiredFiles = [
            ['.github', 'workflows', 'ci.yml'],
            ['docker-compose.yml'],
            ['Backend', 'Dockerfile'],
            ['Backend', '.dockerignore'],
            ['Backend', 'tests', 'helpers', 'testDb.js'],
            ['Frontend', 'vite-project', 'Dockerfile'],
            ['Frontend', 'vite-project', 'nginx.conf'],
            ['Frontend', 'vite-project', '.dockerignore']
        ];

        for (const relSegments of requiredFiles) {
            const fullPath = resolveRepoPath(...relSegments);
            expect(fs.existsSync(fullPath), `Expected ${relSegments.join('/')} to exist`).toBe(true);
        }
    });

    it('removes orphaned lockfiles and obsolete AI scaffolding directories', () => {
        const forbiddenPaths = [
            ['Frontend', 'package-lock.json'],
            ['.codex'],
            ['.ai-devkit.json'],
            ['docs', 'ai'],
            ['docs']
        ];

        for (const relSegments of forbiddenPaths) {
            const fullPath = resolveRepoPath(...relSegments);
            expect(fs.existsSync(fullPath), `Expected ${relSegments.join('/')} to be removed`).toBe(false);
        }
    });

    it('configures Nginx SPA fallback, /api/ reverse proxy, and Docker Compose zero-config stack', () => {
        const nginxConf = fs.readFileSync(
            resolveRepoPath('Frontend', 'vite-project', 'nginx.conf'),
            'utf8'
        );
        expect(nginxConf).toContain('try_files $uri $uri/ /index.html;');
        expect(nginxConf).toMatch(/location\s+\/api\/\s*\{/);
        expect(nginxConf).toContain('proxy_pass http://backend:5000/api/;');

        const frontendDockerfile = fs.readFileSync(
            resolveRepoPath('Frontend', 'vite-project', 'Dockerfile'),
            'utf8'
        );
        expect(frontendDockerfile).toContain('ARG VITE_API_URL=/api');
        expect(frontendDockerfile).toContain('ENV VITE_API_URL=$VITE_API_URL');

        const composeYml = fs.readFileSync(resolveRepoPath('docker-compose.yml'), 'utf8');
        expect(composeYml).toContain('mongo:7');
        expect(composeYml).toContain('mongodb://mongo:27017/deckai');
        expect(composeYml).toMatch(/JWT_SECRET=?\$\{JWT_SECRET:-/);
        expect(composeYml).toMatch(/NODE_ENV=?\$\{NODE_ENV:-development\}/);
        expect(composeYml).toContain('5000:5000');
        expect(composeYml).toContain('5173:80');
    });

    it('configures GitHub Actions CI with mongo:7 service, TEST_MONGO_URI, Node 22, and Backend + Frontend checks', async () => {
        const ciYml = fs.readFileSync(resolveRepoPath('.github', 'workflows', 'ci.yml'), 'utf8');
        expect(ciYml).toContain('image: mongo:7');
        expect(ciYml).toContain('TEST_MONGO_URI: mongodb://127.0.0.1:27017/deckai_ci_test');
        expect(ciYml).toMatch(/node-version:\s*['"]?22['"]?/);
        expect(ciYml).toContain('npm test');
        expect(ciYml).toContain('npm run build');

        const authTestSrc = fs.readFileSync(
            resolveRepoPath('Backend', 'tests', 'auth-and-security.test.js'),
            'utf8'
        );
        const slidesTestSrc = fs.readFileSync(
            resolveRepoPath('Backend', 'tests', 'slides-and-export.test.js'),
            'utf8'
        );
        expect(authTestSrc).toContain('./helpers/testDb.js');
        expect(slidesTestSrc).toContain('./helpers/testDb.js');

        const testDbModule = await import('./helpers/testDb.js');
        expect(typeof testDbModule.resolveTestMongoTarget).toBe('function');

        const externalTarget = testDbModule.resolveTestMongoTarget(
            { TEST_MONGO_URI: 'mongodb://127.0.0.1:27017/deckai_ci_test' },
            'auth'
        );
        expect(externalTarget).toEqual({
            mode: 'external',
            uri: 'mongodb://127.0.0.1:27017/deckai_ci_test',
            dbName: 'deckai_ci_test_auth'
        });

        const memoryTarget = testDbModule.resolveTestMongoTarget({}, 'auth');
        expect(memoryTarget.mode).toBe('memory');
    });

    it('documents CI badge, Instant Demo, Slide Version Restore, Docker Compose, and exact default GEMINI_MODELS in README.md', () => {
        const readme = fs.readFileSync(resolveRepoPath('README.md'), 'utf8');
        const defaultModels = loadEnv({}).geminiModels.join(',');

        expect(readme).toContain(
            'https://github.com/longnguyen005/AI-SLIDE-GENERATOR/actions/workflows/ci.yml/badge.svg'
        );
        expect(readme).toContain('/api/auth/demo');
        expect(readme).toMatch(/Instant Demo/i);
        expect(readme).toContain('/api/slides/:slideId/versions/:versionId/restore');
        expect(readme).toMatch(/docker compose up --build/i);
        expect(readme).toContain(defaultModels);
        expect(readme).not.toContain('gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash');
    });
});
