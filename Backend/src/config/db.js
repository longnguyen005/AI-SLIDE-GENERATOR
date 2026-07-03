import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDb() {
    mongoose.set('strictQuery', true);
    if (env.dnsServers.length > 0) {
        dns.setServers(env.dnsServers);
    }
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
}
