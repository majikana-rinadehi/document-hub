import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export interface ConversionConfig {
  imageDirectory?: string;
  imageUrlPrefix?: string;
  customTransformers?: Map<string, BlockTransformer>;
}

export interface ConversionResult {
  markdown: string;
  images: ImageInfo[];
}

export interface ImageInfo {
  originalUrl: string;
  localPath: string;
  markdownPath: string;
}

export type BlockTransformer = (block: BlockObjectResponse) => Promise<string>;

export class NotionConverterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'NotionConverterError';
  }
}