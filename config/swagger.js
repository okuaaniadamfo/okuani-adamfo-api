import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'okuani-adamfo-api',
    version: '1.0.0',
    description: 'API documentation for Okuani Adamfo',
  },
  servers: [
    {
      url: 'https://okuani-adamfo-api.onrender.com',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './routes/user.js', // Path to user routes file
   './routes/upload.js', // Path to upload routes file
   './routes/diagnose.js', // Path to diagnose routes file
   './routes/output.js' // Path to output routes file
  ]
};

const swaggerSpec = swaggerJSDoc(options);

// Export Swagger UI setup
export const swaggerDocs = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec);