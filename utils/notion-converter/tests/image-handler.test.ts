import { describe, test, expect, beforeEach } from 'bun:test';
import { ImageHandler } from '../src/image-handler';

describe('ImageHandler', () => {
  let imageHandler: ImageHandler;

  beforeEach(() => {
    imageHandler = new ImageHandler('./test-images', '/images/');
  });

  test('ImageHandlerのインスタンスが正常に作成されること', () => {
    expect(imageHandler).toBeInstanceOf(ImageHandler);
  });

  test('デフォルト設定でImageHandlerが作成されること', () => {
    const defaultHandler = new ImageHandler();
    expect(defaultHandler).toBeInstanceOf(ImageHandler);
  });

  test('画像URLのバリデーションが正常に動作すること', () => {
    const validUrl = 'https://example.com/image.png';
    const invalidUrl = 'invalid-url';
    
    // privateメソッドのテストのため、publicメソッドを通してテスト
    expect(() => {
      (imageHandler as any).validateImageUrl(validUrl);
    }).not.toThrow();

    expect(() => {
      (imageHandler as any).validateImageUrl(invalidUrl);
    }).toThrow();
  });

  test('画像のファイル名生成が正常に動作すること', () => {
    const url = 'https://example.com/path/image.png';
    const filename = imageHandler.generateImageFilename(url, 0);
    expect(filename).toBe('image_0.png');
  });

  test('外部URLの判定が正常に動作すること', () => {
    const externalUrl = 'https://example.com/image.png';
    const relativeUrl = './image.png';
    
    expect((imageHandler as any).isExternalUrl(externalUrl)).toBe(true);
    expect((imageHandler as any).isExternalUrl(relativeUrl)).toBe(false);
  });

  test('Markdownパスの生成が正常に動作すること', () => {
    const localPath = './test-images/image_0.png';
    const markdownPath = imageHandler.getMarkdownPath(localPath);
    expect(markdownPath).toMatch(/image_0\.png$/);
  });
});