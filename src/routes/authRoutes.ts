// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import db from '../../db/index';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/signup', async (req: any, res: any) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const connection = await db;
    const existingUser = await connection
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.insert(schema.users).values({ name, email, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/signin', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const connection = await db;
    const userResult = await connection
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (userResult.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = userResult[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/signout', authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
  res.json({ message: 'Signed out successfully (remove token on client side)' });
  next();
});

export default router;
