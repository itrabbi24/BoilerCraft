import { createUser, signToken, publicUser } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
  }
  const user = await createUser({ name, email, password });
  if (!user) {
    return res.status(409).json({ success: false, error: 'User already exists.' });
  }
  return res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
}
