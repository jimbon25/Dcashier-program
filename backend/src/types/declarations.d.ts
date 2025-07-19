// Type declarations untuk modules tanpa built-in types

declare module 'swagger-jsdoc' {
  const swaggerJsdoc: any;
  export = swaggerJsdoc;
}

declare module 'compression' {
  const compression: any;
  export = compression;
}

declare module 'swagger-ui-express' {
  export const serve: any;
  export function setup(swaggerDoc: any, options?: any): any;
}

declare module 'morgan' {
  const morgan: any;
  export = morgan;
}

declare module 'multer' {
  const multer: any;
  export = multer;
}
