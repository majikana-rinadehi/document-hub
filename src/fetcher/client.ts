import { Client } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  NotionFetcherConfig,
  ArticleMetadata,
  FetchArticleResponse,
  NotionFetcherError,
} from './types';

export class NotionFetcher {
  private client: Client;

  private maxRetries: number;

  private retryDelay: number;

  constructor(config: NotionFetcherConfig) {
    this.client = new Client({
      auth: config.apiKey,
    });
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  private async retryableRequest<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(
          `${operationName}の試行 ${attempt + 1}/${this.maxRetries} に失敗しました:`,
          error,
        );

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw new NotionFetcherError(
      `${operationName}が${this.maxRetries}回の試行後に失敗しました`,
      'MAX_RETRIES_EXCEEDED',
      lastError,
    );
  }

  async fetchArticleById(id: string): Promise<FetchArticleResponse> {
    try {
      const [metadata, blocks] = await Promise.all([
        this.fetchPageProperties(id),
        this.fetchPageBlocks(id),
      ]);

      return {
        metadata: await this.extractMetadata(id, metadata),
        blocks,
      };
    } catch (error) {
      if (error instanceof NotionFetcherError) {
        throw error;
      }
      throw new NotionFetcherError(`記事の取得に失敗しました: ${id}`, 'FETCH_ARTICLE_ERROR', error);
    }
  }

  async fetchPageProperties(id: string): Promise<Record<string, any>> {
    return this.retryableRequest(async () => {
      try {
        const page = await this.client.pages.retrieve({ page_id: id });

        if (!this.isPageObjectResponse(page)) {
          throw new NotionFetcherError('ページが見つかりませんでした', 'PAGE_NOT_FOUND', {
            pageId: id,
          });
        }

        return page.properties;
      } catch (error: any) {
        if (error.code === 'object_not_found') {
          throw new NotionFetcherError(`ページが見つかりません: ${id}`, 'PAGE_NOT_FOUND', error);
        }
        throw error;
      }
    }, 'ページプロパティの取得');
  }

  async fetchPageBlocks(id: string): Promise<BlockObjectResponse[]> {
    return this.retryableRequest(async () => {
      const blocks: BlockObjectResponse[] = [];
      let cursor: string | undefined;

      try {
        do {
          const response = await this.client.blocks.children.list({
            block_id: id,
            start_cursor: cursor,
            page_size: 100,
          });

          blocks.push(...(response.results as BlockObjectResponse[]));
          cursor = response.next_cursor ?? undefined;
        } while (cursor);

        for (const block of blocks) {
          if (this.hasChildren(block)) {
            const children = await this.fetchPageBlocks(block.id);
            Object.assign(block, { children });
          }
        }

        return blocks;
      } catch (error: any) {
        if (error.code === 'object_not_found') {
          throw new NotionFetcherError(`ブロックが見つかりません: ${id}`, 'BLOCK_NOT_FOUND', error);
        }
        throw error;
      }
    }, 'ページブロックの取得');
  }

  private async extractMetadata(
    id: string,
    properties: Record<string, any>,
  ): Promise<ArticleMetadata> {
    const page = await this.client.pages.retrieve({ page_id: id });

    if (!this.isPageObjectResponse(page)) {
      throw new NotionFetcherError('ページメタデータの取得に失敗しました', 'METADATA_ERROR', {
        pageId: id,
      });
    }

    const title = this.extractTitle(properties);

    return {
      id,
      title,
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
      properties,
    };
  }

  private extractTitle(properties: Record<string, any>): string {
    const titleProperty = Object.entries(properties).find(([_, value]) => value.type === 'title');

    if (titleProperty && titleProperty[1].title?.length > 0) {
      return titleProperty[1].title.map((text: any) => text.plain_text).join('');
    }

    return '無題';
  }

  private isPageObjectResponse(page: any): page is PageObjectResponse {
    return page.object === 'page' && 'properties' in page;
  }

  private hasChildren(block: BlockObjectResponse): boolean {
    return block.has_children === true;
  }
}
