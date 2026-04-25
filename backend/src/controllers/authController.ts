import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User, ROLES, type Role } from '../models/User';
import { signToken } from '../utils/token';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies';
import { HttpError } from '../middleware/error';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(ROLES as readonly [Role, ...Role[]]).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = signupSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new HttpError(409, 'Email already in use');
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role ?? 'Borrower',
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    setAuthCookie(res, token);

    res.status(201).json({ user: user.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const ok = await user.comparePassword(data.password);
    if (!ok) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    setAuthCookie(res, token);

    res.json({ user: user.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const user = await User.findById(req.user.sub);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}
