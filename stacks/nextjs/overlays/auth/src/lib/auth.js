import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// In-memory user store so the auth flow works out of the box.
// Replace with your database model (see src/lib/db.js).
const users = globalThis.__bcUsers || (globalThis.__bcUsers = []);

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set (.env.local)');
  return process.env.JWT_SECRET;
}

export function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, secret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}

export async function createUser({ name, email, password, role = 'user' }) {
  if (users.some(u => u.email === email)) return null;
  const user = { id: users.length + 1, name, email, role, password: await bcrypt.hash(password, 10) };
  users.push(user);
  return user;
}

export async function findUserByCredentials(email, password) {
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) return null;
  return user;
}

export function publicUser({ password, ...rest }) {
  return rest;
}
