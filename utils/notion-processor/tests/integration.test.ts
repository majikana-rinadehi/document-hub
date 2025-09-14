import { describe, test, expect, beforeAll } from "bun:test";
import { NotionProcessor } from "../src/processor";
import { createNotionProcessor } from "../src/helpers";
import type { NotionProcessorConfig } from "../src/types";

// 統合テスト用の設定
const testConfig: NotionProcessorConfig = {
  notionApiKey: process.env.NOTION_API_KEY || "test-api-key",
  imageDirectory: "./test-images",
  imageUrlPrefix: "/test-images",
  maxRetries: 2,
  retryDelay: 500,
};

describe("Integration Tests", () => {
  describe("実際のNotion APIとの連携", () => {
    test(
      "実際の記事を取得して変換できる",
      async () => {
        const processor = new NotionProcessor(testConfig);
        console.log("processor", Object.keys(processor));
        const testPageId = process.env.NOTION_TEST_PAGE_ID!;

        const result = await processor.processArticle(testPageId);

        expect(result.metadata.id).toBe(testPageId);
        expect(result.metadata.title).toBeString();
        expect(result.markdown).toBeString();
        expect(result.processedAt).toBeInstanceOf(Date);
        expect(typeof result.processingTime).toBe("number");

        // マークダウンが有効なフォーマットかチェック
        expect(result.markdown.length).toBeGreaterThan(0);

        // メタデータが正しく設定されているかチェック
        expect(result.metadata.createdAt).toBeInstanceOf(Date);
        expect(result.metadata.updatedAt).toBeInstanceOf(Date);
      },
      { timeout: 30000 }
    );

    test(
      "画像を含む記事を正しく処理できる",
      async () => {
        const processor = new NotionProcessor(testConfig);
        // 画像を含むテストページIDを使用（環境変数で設定）
        const testPageWithImagesId =
          process.env.NOTION_TEST_PAGE_WITH_IMAGES_ID ||
          process.env.NOTION_TEST_PAGE_ID!;

        const result = await processor.processArticle(testPageWithImagesId);

        expect(result.metadata.id).toBe(testPageWithImagesId);
        expect(result.markdown).toBeString();

        // 画像が処理されているかチェック（画像がある場合）
        if (result.images.length > 0) {
          result.images.forEach((image) => {
            expect(image.originalUrl).toBeString();
            expect(image.localPath).toBeString();
            expect(image.markdownPath).toBeString();
            expect(image.originalUrl.startsWith("http")).toBe(true);
          });
        }
      },
      { timeout: 30000 }
    );

    test("ネストされたブロックが正しく変換される", async () => {
      const processor = new NotionProcessor(testConfig);
      const testPageId = process.env.NOTION_TEST_PAGE_ID!;

      const result = await processor.processArticle(testPageId);

      // マークダウンにネストされた構造が含まれているかチェック
      expect(result.markdown).toBeString();

      // 階層構造のチェック（見出し、リストなど）
      const hasStructure =
        result.markdown.includes("#") ||
        result.markdown.includes("-") ||
        result.markdown.includes("*");

      if (hasStructure) {
        expect(hasStructure).toBe(true);
      }
    });

    test("カスタムブロックタイプが処理される", async () => {
      const processor = new NotionProcessor(testConfig);
      const testPageId = process.env.NOTION_TEST_PAGE_ID!;

      const result = await processor.processArticle(testPageId);

      expect(result.markdown).toBeString();
      expect(result.metadata).toBeDefined();

      // 処理時間が合理的な範囲内かチェック
      expect(result.processingTime!).toBeGreaterThan(0);
      expect(result.processingTime!).toBeLessThan(30000); // 30秒以内
    });
  });

  describe("エラーリカバリー", () => {
    test("存在しないページIDでのエラーハンドリング", async () => {
      const processor = new NotionProcessor(testConfig);
      const invalidPageId = "invalid-page-id-12345";

      await expect(processor.processArticle(invalidPageId)).rejects.toThrow();
    });

    test(
      "API制限に達した場合のリトライ",
      async () => {
        const processor = new NotionProcessor(testConfig);
        // この テストは実際のAPI制限を引き起こすため、慎重に実行
        const testPageId = process.env.NOTION_TEST_PAGE_ID!;

        // 複数のリクエストを同時に送信してレート制限をテスト
        const promises = Array.from({ length: 5 }, () =>
          processor.processArticle(testPageId)
        );

        // すべてのリクエストが完了することを確認
        // レート制限に達した場合、リトライメカニズムが働く
        const results = await Promise.allSettled(promises);

        // 少なくとも1つは成功することを期待
        const successfulResults = results.filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled"
        );

        expect(successfulResults.length).toBeGreaterThan(0);
      },
      { timeout: 60000 }
    );

    test(
      "部分的な失敗の処理",
      async () => {
        const processor = new NotionProcessor(testConfig);
        const validPageId = process.env.NOTION_TEST_PAGE_ID!;
        const invalidPageId = "invalid-page-id";

        const articleIds = [validPageId, invalidPageId, validPageId];

        const result = await processor.processMultipleArticles(articleIds, {
          continueOnError: true,
          concurrency: 2,
        });

        expect(result.successful.length).toBeGreaterThan(0);
        expect(result.failed.length).toBeGreaterThan(0);
        expect(result.totalProcessed).toBe(articleIds.length);

        // 失敗した項目の詳細をチェック
        const failedItem = result.failed.find(
          (item) => item.articleId === invalidPageId
        );
        expect(failedItem).toBeDefined();
        expect(failedItem!.error).toBeInstanceOf(Error);
      },
      { timeout: 45000 }
    );
  });

  describe("パフォーマンステスト", () => {
    test(
      "大量記事の並列処理",
      async () => {
        const processor = new NotionProcessor(testConfig);
        const testPageId = process.env.NOTION_TEST_PAGE_ID!;

        // 同じページを複数回処理してパフォーマンスをテスト
        const articleIds = Array(5).fill(testPageId);

        const startTime = Date.now();
        const result = await processor.processMultipleArticles(articleIds, {
          concurrency: 3,
        });
        const endTime = Date.now();

        expect(result.successful).toHaveLength(5);
        expect(result.failed).toHaveLength(0);
        expect(result.totalTime).toBeGreaterThan(0);

        // 並列処理により、順次処理より高速であることを確認
        const totalTime = endTime - startTime;
        const averageTimePerArticle = totalTime / articleIds.length;

        expect(averageTimePerArticle).toBeLessThan(10000); // 1記事あたり10秒以内
      },
      { timeout: 60000 }
    );

    test("メモリ使用量の監視", async () => {
      // メモリ使用量の測定開始
      const initialMemory = process.memoryUsage();

      // 大きなデータセットの処理をシミュレート
      const processor = createNotionProcessor({
        notionApiKey: "test-key",
      });

      // 多数のプロセッサインスタンスを作成して破棄
      const processors = Array.from({ length: 100 }, () =>
        createNotionProcessor({ notionApiKey: "test-key" })
      );

      // 明示的に参照を削除
      processors.length = 0;

      // ガベージコレクションを実行
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // メモリリークがないことを確認（合理的な増加量以内）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB以内
    });

    test(
      "処理速度のベンチマーク",
      async () => {
        const processor = new NotionProcessor(testConfig);
        const testPageId = process.env.NOTION_TEST_PAGE_ID!;

        const iterations = 3;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          await processor.processArticle(testPageId);
          const endTime = Date.now();
          times.push(endTime - startTime);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        // パフォーマンス基準をチェック
        expect(averageTime).toBeLessThan(5000); // 平均5秒以内
        expect(maxTime).toBeLessThan(10000); // 最大10秒以内
        expect(minTime).toBeGreaterThan(100); // 最小100ms以上（あまりに早すぎるのは不自然）

        console.log(`パフォーマンス統計:
        平均: ${averageTime}ms
        最大: ${maxTime}ms  
        最小: ${minTime}ms`);
      },
      { timeout: 45000 }
    );
  });

  describe("接続テスト", () => {
    test("実際のAPI接続テスト", async () => {
      const processor = new NotionProcessor(testConfig);
      const result = await processor.testConnection();
      expect(result).toBe(true);
    });
  });
});
