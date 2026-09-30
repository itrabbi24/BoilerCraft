import { findUserByCredentials, signToken, publicUser } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const { email, password } = req.body || {};
  const user = await findUserByCredentials(email, password);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }
  return res.status(200).json({ success: true, token: signToken(user), user: publicUser(user) });
}
