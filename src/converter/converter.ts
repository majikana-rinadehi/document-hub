import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  ConversionConfig,
  ConversionResult,
  BlockTransformer,
  NotionConverterError,
} from './types';
import { ImageHandler } from './image-handler';

export class NotionConverter {
  private notionToMd: NotionToMarkdown;
  private imageHandler: ImageHandler;
  private customTransformers: Map<string, BlockTransformer>;

  constructor(notionClient: Client, config: ConversionConfig = {}) {
    this.notionToMd = new NotionToMarkdown({ notionClient });
    this.imageHandler = new ImageHandler(
      config.imageDirectory,
      config.imageUrlPrefix,
    );
    this.customTransformers = config.customTransformers || new Map();
    
    this.setupCustomTransformers();
  }

  private setupCustomTransformers(): void {
    for (const [blockType, transformer] of this.customTransformers) {
      this.notionToMd.setCustomTransformer(blockType, transformer);
    }
  }

  async convertToMarkdown(blocks: BlockObjectResponse[]): Promise<ConversionResult> {
    try {
      let markdown = '';
      
      for (const block of blocks) {
        const mdBlocks = await this.convertBlock(block);
        markdown += mdBlocks + '\n\n';
      }
      
      markdown = markdown.trim();
      
      const result = await this.processImages(markdown);
      
      return result;
    } catch (error) {
      if (error instanceof NotionConverterError) {
        throw error;
      }
      throw new NotionConverterError(
        'Markdown変換中にエラーが発生しました',
        'CONVERSION_ERROR',
        error,
      );
    }
  }

  private async convertBlock(block: BlockObjectResponse): Promise<string> {
    try {
      const mdBlocks = await this.notionToMd.blockToMarkdown(block);
      
      if (Array.isArray(mdBlocks)) {
        return mdBlocks.map(b => b.parent).join('\n');
      }
      
      return mdBlocks.parent || '';
    } catch (error) {
      console.error(`ブロックの変換に失敗しました: ${block.id}`, error);
      return '';
    }
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    return this.imageHandler.downloadImage(url, filename);
  }

  private async processImages(markdown: string): Promise<ConversionResult> {
    const { markdown: processedMarkdown, images } = await this.imageHandler.processImages(markdown);
    
    return {
      markdown: processedMarkdown,
      images,
    };
  }

  async convertPageToMarkdown(pageId: string): Promise<ConversionResult> {
    try {
      const mdBlocks = await this.notionToMd.pageToMarkdown(pageId);
      const mdString = this.notionToMd.toMarkdownString(mdBlocks);
      
      const result = await this.processImages(mdString.parent || '');
      
      return result;
    } catch (error) {
      if (error instanceof NotionConverterError) {
        throw error;
      }
      throw new NotionConverterError(
        `ページの変換に失敗しました: ${pageId}`,
        'PAGE_CONVERSION_ERROR',
        error,
      );
    }
  }
}