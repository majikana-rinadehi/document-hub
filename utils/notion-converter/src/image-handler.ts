import { promises as fs } from 'fs';
import path from 'path';
import { ImageInfo, NotionConverterError } from './types';

export class ImageHandler {
  private imageDirectory: string;
  private imageUrlPrefix: string;

  constructor(imageDirectory: string = './images', imageUrlPrefix: string = '') {
    this.imageDirectory = imageDirectory;
    this.imageUrlPrefix = imageUrlPrefix;
  }

  async ensureImageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.imageDirectory, { recursive: true });
    } catch (error) {
      throw new NotionConverterError(
        `画像ディレクトリの作成に失敗しました: ${this.imageDirectory}`,
        'DIRECTORY_CREATE_ERROR',
        error,
      );
    }
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    try {
      await this.ensureImageDirectory();
      
      const validatedUrl = this.validateImageUrl(url);
      const response = await fetch(validatedUrl);
      
      if (!response.ok) {
        throw new NotionConverterError(
          `画像のダウンロードに失敗しました: ${response.status}`,
          'DOWNLOAD_ERROR',
          { url, status: response.status },
        );
      }

      const buffer = await response.arrayBuffer();
      const localPath = path.join(this.imageDirectory, filename);
      
      await fs.writeFile(localPath, Buffer.from(buffer));
      
      return localPath;
    } catch (error) {
      if (error instanceof NotionConverterError) {
        throw error;
      }
      throw new NotionConverterError(
        `画像のダウンロード中にエラーが発生しました: ${url}`,
        'DOWNLOAD_ERROR',
        error,
      );
    }
  }

  private validateImageUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new NotionConverterError(
          '無効なプロトコルです',
          'INVALID_PROTOCOL',
          { url },
        );
      }
      
      return url;
    } catch (error) {
      throw new NotionConverterError(
        '無効な画像URLです',
        'INVALID_URL',
        { url, error },
      );
    }
  }

  generateImageFilename(url: string, index: number): string {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const originalFilename = pathParts[pathParts.length - 1] || 'image';
    
    const extension = path.extname(originalFilename) || '.png';
    const basename = path.basename(originalFilename, extension);
    
    return `${basename}_${index}${extension}`;
  }

  getMarkdownPath(localPath: string): string {
    const relativePath = path.relative('.', localPath);
    return this.imageUrlPrefix 
      ? path.join(this.imageUrlPrefix, path.basename(localPath))
      : relativePath;
  }

  async processImages(markdown: string): Promise<{ markdown: string; images: ImageInfo[] }> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: ImageInfo[] = [];
    let processedMarkdown = markdown;
    let imageIndex = 0;

    const matches = [...markdown.matchAll(imageRegex)];
    
    for (const match of matches) {
      const [fullMatch, altText, originalUrl] = match;
      
      if (this.isExternalUrl(originalUrl)) {
        try {
          const filename = this.generateImageFilename(originalUrl, imageIndex++);
          const localPath = await this.downloadImage(originalUrl, filename);
          const markdownPath = this.getMarkdownPath(localPath);
          
          images.push({
            originalUrl,
            localPath,
            markdownPath,
          });
          
          processedMarkdown = processedMarkdown.replace(
            fullMatch,
            `![${altText}](${markdownPath})`,
          );
        } catch (error) {
          console.error(`画像の処理に失敗しました: ${originalUrl}`, error);
        }
      }
    }

    return { markdown: processedMarkdown, images };
  }

  private isExternalUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}