import { z } from 'zod';
import { insertFileSchema, files, sharedLinks, accessLogs } from './schema';

// Shared Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  files: {
    upload: {
      method: 'POST' as const,
      path: '/api/files/upload', // Handled by multer, but contract defined here
      responses: {
        201: z.custom<typeof files.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/files',
      responses: {
        200: z.array(z.custom<typeof files.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/files/:id',
      responses: {
        200: z.custom<typeof files.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    download: {
      method: 'GET' as const,
      path: '/api/files/:id/download',
      responses: {
        200: z.any(), // Stream
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden, // Expired or limit reached
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/files/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  links: {
    create: {
      method: 'POST' as const,
      path: '/api/files/:id/share',
      input: z.object({
        expiresAt: z.string().optional(),
        maxAccess: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof sharedLinks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    revoke: {
      method: 'POST' as const,
      path: '/api/links/:id/revoke',
      responses: {
        200: z.custom<typeof sharedLinks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    access: {
      method: 'GET' as const,
      path: '/s/:token', // Public access route
      responses: {
        200: z.any(), // File info + download link
        404: errorSchemas.notFound,
        410: errorSchemas.forbidden, // Gone/Expired
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalFiles: z.number(),
          totalDownloads: z.number(),
          activeLinks: z.number(),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
