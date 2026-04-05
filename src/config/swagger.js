const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Backend API',
      version: '1.0.0',
      description: `
Finance Data Processing and Access Control Backend.

## Roles & Permissions

| Endpoint group         | viewer | analyst | admin |
|------------------------|--------|---------|-------|
| GET /records           | ✓      | ✓       | ✓     |
| POST/PATCH/DELETE /records |    |         | ✓     |
| GET /dashboard/summary | ✓      | ✓       | ✓     |
| GET /dashboard/recent  | ✓      | ✓       | ✓     |
| GET /dashboard/by-category |    | ✓       | ✓     |
| GET /dashboard/trends  |        | ✓       | ✓     |
| All /users endpoints   |        |         | ✓     |

## Quick Start
1. POST \`/api/auth/login\` with \`{ "email": "admin@finance.com", "password": "Admin123!" }\`
2. Copy the \`token\` from the response
3. Click **Authorize** above and enter \`Bearer <token>\`
      `,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
