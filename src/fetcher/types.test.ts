import { describe, test, expect } from 'bun:test';
import { NotionFetcherError } from './types';
import type { 
  NotionFetcherConfig,
  ArticleMetadata,
  FetchArticleResponse 
} from './types';

describe('Types', () => {
  test('NotionFetcherConfigの型定義が正常に使用できること', () => {
    const config: NotionFetcherConfig = {
      apiKey: 'test-key',
      maxRetries: 3,
      retryDelay: 1000,
    };
    
    expect(config.apiKey).toBe('test-key');
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelay).toBe(1000);
  });

  test('ArticleMetadataの型定義が正常に使用できること', () => {
    const metadata: ArticleMetadata = {
      id: 'test-id',
      title: 'テスト記事',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      properties: {
        title: { type: 'title' },
      },
    };
    
    expect(metadata.id).toBe('test-id');
    expect(metadata.title).toBe('テスト記事');
  });

  test('FetchArticleResponseの型定義が正常に使用できること', () => {
    const response: FetchArticleResponse = {
      metadata: {
        id: 'test-id',
        title: 'テスト記事',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        properties: {},
      },
      blocks: [],
    };
    
    expect(response.metadata.id).toBe('test-id');
    expect(response.blocks).toEqual([]);
  });

  test('NotionFetcherErrorが適切に継承されていること', () => {
    const error = new NotionFetcherError('エラー', 'CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NotionFetcherError');
  });
});