import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vault API",
      version: "0.1.0",
      description: "Vault API documentation",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*-routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
