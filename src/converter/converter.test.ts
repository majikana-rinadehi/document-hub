import { describe, test, expect, beforeEach } from 'bun:test';
import { NotionConverter } from './converter';
import { NotionConverterError } from './types';

describe('NotionConverter', () => {
  let converter: NotionConverter;

  beforeEach(() => {
    const mockClient = {
      blocks: {},
      pages: {},
    } as any;
    converter = new NotionConverter(mockClient);
  });

  test('NotionConverterのインスタンスが正常に作成されること', () => {
    expect(converter).toBeInstanceOf(NotionConverter);
  });

  test('設定オプションが正常に適用されること', () => {
    const config = {
      imageDirectory: 'test-images',
      imageUrlPrefix: '/images/',
    };
    const mockClient = { blocks: {}, pages: {} } as any;
    const configuredConverter = new NotionConverter(mockClient, config);
    expect(configuredConverter).toBeInstanceOf(NotionConverter);
  });

  test('空のブロック配列を変換した場合、空のMarkdownが返されること', async () => {
    const result = await converter.convertToMarkdown([]);
    expect(result.markdown).toBe('');
    expect(result.images).toEqual([]);
  });

  test('NotionConverterErrorが適切に作成されること', () => {
    const error = new NotionConverterError('テストエラー', 'TEST_ERROR', { test: true });
    expect(error.message).toBe('テストエラー');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.details).toEqual({ test: true });
    expect(error.name).toBe('NotionConverterError');
  });
});