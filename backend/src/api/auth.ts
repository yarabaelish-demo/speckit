import { Router } from 'express';
import { auth } from '../config/firebaseAdmin.js';

const router = Router();

// User registration
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userRecord = await auth.createUser({
      email,
      password,
    });
    res.status(201).json({ uid: userRecord.uid });
  } catch (error) {
    next(error);
  }
});

// User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // This is a placeholder for a real login implementation that would return a JWT
    const user = await auth.getUserByEmail(email);
    // NOTE: This does not actually verify the password. In a real app, you'd use a custom token
    // or another method to verify the password.
    res.status(200).json({ token: `dummy-token-for-${user.uid}` });
  } catch (error) {
    next(error);
  }
});

export default router;
