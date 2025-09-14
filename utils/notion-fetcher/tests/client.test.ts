import { describe, test, expect, beforeEach } from 'bun:test';
import { NotionFetcher } from '../src/client';
import { NotionFetcherError } from '../src/types';

describe('NotionFetcher', () => {
  let fetcher: NotionFetcher;

  beforeEach(() => {
    fetcher = new NotionFetcher({
      apiKey: 'test-api-key',
    });
  });

  test('NotionFetcherのインスタンスが正常に作成されること', () => {
    expect(fetcher).toBeInstanceOf(NotionFetcher);
  });

  test('設定オプションが正常に適用されること', () => {
    const config = {
      apiKey: 'test-api-key',
      maxRetries: 5,
      retryDelay: 2000,
    };
    const configuredFetcher = new NotionFetcher(config);
    expect(configuredFetcher).toBeInstanceOf(NotionFetcher);
  });

  test('NotionFetcherErrorが適切に作成されること', () => {
    const error = new NotionFetcherError('テストエラー', 'TEST_ERROR', { test: true });
    expect(error.message).toBe('テストエラー');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.details).toEqual({ test: true });
    expect(error.name).toBe('NotionFetcherError');
  });

  test('プライベートメソッドisPageObjectResponseが正常に動作すること', () => {
    const validPage = {
      object: 'page',
      properties: {},
    };
    const invalidPage = {
      object: 'block',
    };

    expect((fetcher as any).isPageObjectResponse(validPage)).toBe(true);
    expect((fetcher as any).isPageObjectResponse(invalidPage)).toBe(false);
  });

  test('プライベートメソッドhasChildrenが正常に動作すること', () => {
    const blockWithChildren = {
      has_children: true,
    };
    const blockWithoutChildren = {
      has_children: false,
    };

    expect((fetcher as any).hasChildren(blockWithChildren)).toBe(true);
    expect((fetcher as any).hasChildren(blockWithoutChildren)).toBe(false);
  });

  test('プライベートメソッドextractTitleが正常に動作すること', () => {
    const propertiesWithTitle = {
      タイトル: {
        type: 'title',
        title: [{ plain_text: 'テスト' }, { plain_text: '記事' }],
      },
    };
    const propertiesWithoutTitle = {};

    expect((fetcher as any).extractTitle(propertiesWithTitle)).toBe('テスト記事');
    expect((fetcher as any).extractTitle(propertiesWithoutTitle)).toBe('無題');
  });
});
