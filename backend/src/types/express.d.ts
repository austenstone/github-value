import 'express-session';
import { User } from '../services/auth/auth.service';

declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

declare global {
  namespace Express {
    interface User extends User {} // Re-export User from auth service
  }
}