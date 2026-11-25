import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

export function getMongoMemoryOptions(rawEnv = process.env) {
    if (rawEnv.MONGOMS_SYSTEM_BINARY) {
        return { binary: { systemBinary: rawEnv.MONGOMS_SYSTEM_BINARY } };
    }
    if (process.platform === 'win32') {
        const baseDir = 'C:\\Program Files\\MongoDB\\Server';
        if (fs.existsSync(baseDir)) {
            const versions = fs.readdirSync(baseDir).sort().reverse();
            for (const ver of versions) {
                const candidate = path.join(baseDir, ver, 'bin', 'mongod.exe');
                if (fs.existsSync(candidate)) {
                    const out = execFileSync(candidate, ['--version'], { encoding: 'utf8' });
                    const detectedVersion = out.match(/db version v(\d+\.\d+\.\d+)/)?.[1];
                    return {
                        binary: {
                            systemBinary: candidate,
                            ...(detectedVersion ? { version: detectedVersion } : {})
                        }
                    };
                }
            }
        }
    }
    return {};
}

export function resolveTestMongoTarget(rawEnv = process.env, suiteName = '') {
    const externalUri = rawEnv.TEST_MONGO_URI?.trim();
    if (externalUri) {
        const parsed = new URL(externalUri);
        const baseDbName = parsed.pathname.replace(/^\/+/, '') || 'deckai_ci_test';
        const sanitizedSuite = String(suiteName || '')
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '_');
        const dbName = sanitizedSuite ? `${baseDbName}_${sanitizedSuite}` : baseDbName;
        return {
            mode: 'external',
            uri: externalUri,
            dbName
        };
    }

    return {
        mode: 'memory',
        options: getMongoMemoryOptions(rawEnv)
    };
}

let mongoServer = null;
let activeMode = null;

export async function connectTestDb(suiteName = '') {
    const target = resolveTestMongoTarget(process.env, suiteName);
    activeMode = target.mode;

    if (target.mode === 'external') {
        await mongoose.connect(target.uri, { dbName: target.dbName });
        await clearTestDb();
        return;
    }

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create(target.options);
    await mongoose.connect(mongoServer.getUri());
}

export async function clearTestDb() {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
}

export async function disconnectTestDb() {
    if (mongoose.connection.readyState !== 0) {
        if (activeMode === 'external') {
            await mongoose.connection.dropDatabase();
        }
        await mongoose.disconnect();
    }

    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
    activeMode = null;
}
