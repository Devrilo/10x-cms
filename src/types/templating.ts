import { Request } from 'express';

/**
 * Template variables passed to renderPage
 */
export interface TemplateVariables {
  title?: string;
  currentYear?: number;
  isAuthenticated?: boolean;
  [key: string]: any; // Allow custom variables
}

/**
 * Meta tags parsed from HTML comments
 */
export interface TemplateMeta {
  title?: string;
  layout?: string;
  [key: string]: string | undefined;
}

/**
 * Parameters for rendering a page
 */
export interface RenderPageParams {
  pageName: string;
  req: Request;
  customVariables?: Record<string, any>;
}
