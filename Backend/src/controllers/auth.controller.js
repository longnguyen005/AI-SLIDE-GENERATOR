import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
function publicUser(user) {
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || ''
    };
}
function sign(user) {
    return jwt.sign({ id: user._id.toString(), email: user.email }, env.jwtSecret, { expiresIn: '7d' });
}
export async function register(req, res) {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
        throw new ApiError(400, 'Full name, email and password are required');
    if (String(password).length < 8)
        throw new ApiError(400, 'Password must contain at least 8 characters');
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists)
        throw new ApiError(409, 'Email is already registered');
    const user = await User.create({
        fullName,
        email,
        passwordHash: await bcrypt.hash(password, 12)
    });
    res.status(201).json({ user: publicUser(user), token: sign(user) });
}
export async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password || ''), String(user.passwordHash)))) {
        throw new ApiError(401, 'Invalid email or password');
    }
    res.json({ user: publicUser(user), token: sign(user) });
}
export async function logout(_req, res) {
    res.json({ message: 'Logged out' });
}
export async function me(req, res) {
    const user = await User.findById(req.user?.id);
    if (!user)
        throw new ApiError(404, 'User not found');
    res.json({ user: publicUser(user) });
}
