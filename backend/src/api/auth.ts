import { Router } from 'express';
import { auth } from '#config/firebaseAdmin';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRecord = await auth.createUser({ email, password });
    res.status(201).json({ uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req, res) => {
  // This is a placeholder. In a real app, you'd handle login differently,
  // likely by creating a session or returning a token.
  // For this example, we'll just verify the user exists.
  try {
    const { email } = req.body;
    const userRecord = await auth.getUserByEmail(email);
    res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

export default router;