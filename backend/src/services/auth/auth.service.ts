import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';

// Interface for user data stored in session
export interface User {
  id: string;
  username: string;
  displayName?: string;
  photos?: Array<{ value: string }>;
  emails?: Array<{ value: string }>;
  profileUrl?: string;
  provider: 'github';
  _json: any; // Full profile from GitHub
}

class AuthService {
  private initialized = false;
  private authEnabled = false;

  initialize(clientID: string, clientSecret: string, callbackURL: string) {
    // Check if OAuth credentials are provided
    if (!clientID || !clientSecret) {
      logger.warn('Missing GitHub OAuth credentials. Authentication will be disabled.');
      logger.warn('To enable authentication, set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET environment variables.');
      this.authEnabled = false;
      return passport;
    }

    try {
      logger.info(`Initializing GitHub OAuth strategy with callbackURL: ${callbackURL}`);
      
      // Configure GitHub strategy
      passport.use('github', new GitHubStrategy({
        clientID,
        clientSecret,
        callbackURL
      },
      (accessToken: string, refreshToken: string, profile: any, done: (err: Error | null, user?: any) => void) => {
        try {
          // Store the full profile for now as requested
          // In a real-world app, you might want to store this in a database
          const user = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            photos: profile.photos,
            emails: profile.emails,
            profileUrl: profile.profileUrl,
            provider: profile.provider,
            _json: profile._json
          } as User;
          
          // Log successful authentication (but don't log sensitive data)
          logger.info(`User authenticated: ${user.username}`);
          
          return done(null, user);
        } catch (error) {
          logger.error('Error in GitHub strategy verify callback:', error);
          return done(error as Error);
        }
      }));

      // Serialize user into the session
      // This determines which data from the user object should be stored in the session
      passport.serializeUser((user, done) => {
        logger.debug(`Serializing user: ${(user as User).username}`);
        // Store the entire user object in the session for now
        // In production with many users, you might want to store just the ID
        // and then retrieve the full user in deserializeUser
        done(null, user);
      });

      // Deserialize user from the session
      // This determines how to retrieve the user information from the session data
      passport.deserializeUser((obj: unknown, done) => {
        logger.debug(`Deserializing user: ${(obj as User).username}`);
        // Return the full user object
        // In a production app with a database, you might want to fetch fresh user data
        // from the database using obj.id instead of using the session-stored user object
        done(null, obj as User);
      });

      this.initialized = true;
      this.authEnabled = true;
      logger.info('GitHub OAuth authentication enabled');
      
    } catch (error) {
      logger.error('Failed to initialize GitHub OAuth strategy:', error);
      this.authEnabled = false;
    }

    return passport;
  }

  // Middleware to ensure a user is authenticated
  ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    // If authentication is disabled, always allow access
    if (!this.authEnabled) {
      logger.debug('Authentication disabled, granting access');
      return next();
    }
    
    // Otherwise, check if user is authenticated
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Store the original URL to redirect after auth
    req.session.returnTo = req.originalUrl || '/';
    
    // Redirect to GitHub login
    res.redirect('/api/auth/github');
  }

  // Middleware to check authentication status without redirecting
  isAuthenticated(req: Request) {
    // If authentication is disabled, consider all requests authenticated
    if (!this.authEnabled) {
      return true;
    }
    return req.isAuthenticated();
  }

  // Check if OAuth has been initialized
  isInitialized() {
    return this.initialized;
  }

  // Check if authentication is enabled
  isAuthEnabled() {
    return this.authEnabled;
  }
}

export default new AuthService();