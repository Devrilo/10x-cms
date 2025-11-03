import { Express } from 'express';

declare global {
  namespace Express {
    /**
     * Extended Request with custom properties
     */
    interface Request {
      /**
       * Parsed cookies from cookie header
       */
      cookies: Record<string, string>;
    }

    /**
     * Extended Response with custom methods
     */
    interface Response {
      /**
       * Set cookie helper method
       */
      setCookie(
        name: string,
        value: string,
        options?: {
          maxAge?: number;
          path?: string;
          httpOnly?: boolean;
          secure?: boolean;
        }
      ): this;
    }
  }
}
