// Custom type declarations untuk modules yang tidak memiliki types

declare module 'swagger-jsdoc' {
  interface Options {
    definition: any;
    apis: string[];
  }
  
  function swaggerJsdoc(options: Options): any;
  export = swaggerJsdoc;
}

declare module 'compression' {
  import { RequestHandler } from 'express';
  
  interface CompressionOptions {
    chunkSize?: number;
    filter?: (req: any, res: any) => boolean;
    level?: number;
    memLevel?: number;
    strategy?: number;
    threshold?: number | string;
    windowBits?: number;
  }
  
  function compression(options?: CompressionOptions): RequestHandler;
  export = compression;
}

declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  
  interface SwaggerUiOptions {
    customCss?: string;
    customfavIcon?: string;
    customSiteTitle?: string;
    customCssUrl?: string;
    explorer?: boolean;
    swaggerOptions?: any;
  }
  
  export const serve: RequestHandler[];
  export function setup(swaggerDoc: any, options?: SwaggerUiOptions): RequestHandler;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';
  
  type FormatFn = (tokens: any, req: any, res: any) => string | undefined;
  type Format = string | FormatFn;
  
  interface Options {
    buffer?: boolean;
    immediate?: boolean;
    skip?: (req: any, res: any) => boolean;
    stream?: NodeJS.WritableStream;
  }
  
  function morgan(format: Format, options?: Options): RequestHandler;
  export = morgan;
}

export {};
