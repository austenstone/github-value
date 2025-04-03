import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import logger from '../services/logger.js';
import authService, { User } from '../services/auth/auth.service.js';

class AuthController {
  // Route to initiate GitHub OAuth authentication
  githubAuth(req: Request, res: Response, next: NextFunction) {
    if (!authService.isAuthEnabled()) {
      logger.info('Authentication attempt when auth is disabled');
      return res.status(400).json({ 
        error: 'Authentication disabled', 
        message: 'GitHub OAuth authentication is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET environment variables to enable authentication.'
      });
    }
    
    if (!authService.isInitialized()) {
      logger.error('GitHub OAuth not initialized but authentication is enabled');
      return res.status(500).json({ 
        error: 'OAuth service not initialized', 
        message: 'GitHub OAuth authentication is not properly configured.'
      });
    }
    
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }

  // GitHub OAuth callback handler
  githubCallback(req: Request, res: Response, next: NextFunction) {
    if (!authService.isAuthEnabled()) {
      logger.info('Authentication callback received when auth is disabled');
      return res.redirect('/');
    }
    
    passport.authenticate('github', {
      failureRedirect: '/login',
      failureMessage: true
    })(req, res, next);
  }

  // Handle successful authentication callback
  handleAuthCallback(req: Request, res: Response) {
    // Get the return URL from session or default to root
    const returnTo = req.session.returnTo || '/';
    // Clear the returnTo path from session
    delete req.session.returnTo;
    
    logger.info(`Authentication successful, redirecting to ${returnTo}`);
    res.redirect(returnTo);
  }

  // Handle logout
  logout(req: Request, res: Response, next: NextFunction) {
    if (!authService.isAuthEnabled()) {
      return res.status(204)
    }
    
    // Clear the user from the session
    req.logout((err) => {
      if (err) {
        logger.error('Error during logout', err);
        return next(err);
      }
      
      logger.info('User logged out');
      res.status(204).end();
    });
  }

  // Get current user info
  getCurrentUser(req: Request, res: Response) {
    // When auth is disabled, return a generic authenticated state
    if (!authService.isAuthEnabled()) {
      return res.json({
        isAuthenticated: true,
        authDisabled: true,
        user: {
          username: 'anonymous',
          displayName: 'Anonymous User (Auth Disabled)'
        }
      });
    }
    
    if (req.isAuthenticated()) {
      // Send user data (but remove sensitive parts)
      const user = { ...req.user } as User;
      if (user._json) {
        delete user._json; // Removing raw JSON for security/privacy
      }
      
      res.json({
        isAuthenticated: true,
        user
      });
    } else {
      res.json({
        isAuthenticated: false
      });
    }
  }
  
  // Get authentication status including whether auth is enabled
  getAuthStatus(req: Request, res: Response) {
    res.json({
      authEnabled: authService.isAuthEnabled(),
      isAuthenticated: authService.isAuthenticated(req)
    });
  }
}

export default new AuthController();