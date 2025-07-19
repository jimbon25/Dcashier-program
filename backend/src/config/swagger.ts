import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dcashier API Documentation',
      version,
      description: 'Documentation for the Dcashier Program API',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Dcashier Support',
        url: 'https://github.com/jimbon25/Dcashier-program',
        email: 'support@dcashier.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'john_doe',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'StrongPass123!',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'Login berhasil',
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIs...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'abc123...',
                },
                role: {
                  type: 'string',
                  example: 'cashier',
                },
              },
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'P001',
            },
            name: {
              type: 'string',
              example: 'Beras 5kg',
            },
            price: {
              type: 'number',
              example: 60000,
            },
            cost_price: {
              type: 'number',
              example: 55000,
            },
            stock: {
              type: 'number',
              example: 100,
            },
            category_id: {
              type: 'string',
              example: 'CAT001',
            },
            image_url: {
              type: 'string',
              example: 'http://localhost:3001/uploads/images/product.jpg',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'], // Path untuk file yang berisi dokumentasi
};

export const specs = swaggerJsdoc(options);
