import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  processNotionArticle,
  processNotionArticles,
} from "../src/helpers";

// 環境変数のモック
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("Helpers with Mocks", () => {
  describe("processNotionArticle", () => {
    test("単一記事を処理できる", async () => {
      const mockProcessor = {
        processArticle: mock().mockResolvedValue({
          metadata: {
            id: "test-id",
            title: "Test Title",
            createdAt: new Date(),
            updatedAt: new Date(),
            properties: {},
            tags: ["test"],
          },
          markdown: "# Test",
          images: [],
          processedAt: new Date(),
        }),
      };

      // NotionProcessorのモック
      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      const result = await processNotionArticle("test-id");
      expect(result.metadata.id).toBe("test-id");
      expect(result.metadata.title).toBe("Test Title");
      expect(mockProcessor.processArticle).toHaveBeenCalledWith("test-id");
    });

    test("エラーハンドリングが適切", async () => {
      const mockProcessor = {
        processArticle: mock().mockRejectedValue(
          new Error("Processing failed")
        ),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      await expect(processNotionArticle("invalid-id")).rejects.toThrow(
        "Processing failed"
      );
    });

    test("カスタム設定を使用できる", async () => {
      const mockProcessor = {
        processArticle: mock().mockResolvedValue({
          metadata: {
            id: "test-id",
            title: "Test",
            createdAt: new Date(),
            updatedAt: new Date(),
            properties: {},
          },
          markdown: "# Test",
          images: [],
          processedAt: new Date(),
        }),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      const customConfig = {
        notionApiKey: "custom-key",
        imageDirectory: "./custom-images",
      };

      const result = await processNotionArticle("test-id", customConfig);
      expect(result.metadata.id).toBe("test-id");
    });
  });

  describe("processNotionArticles", () => {
    test("複数記事をバッチ処理できる", async () => {
      const mockProcessor = {
        processMultipleArticles: mock().mockResolvedValue({
          successful: [
            {
              metadata: {
                id: "page-1",
                title: "Page 1",
                createdAt: new Date(),
                updatedAt: new Date(),
                properties: {},
              },
              markdown: "# Page 1",
              images: [],
              processedAt: new Date(),
            },
            {
              metadata: {
                id: "page-2",
                title: "Page 2",
                createdAt: new Date(),
                updatedAt: new Date(),
                properties: {},
              },
              markdown: "# Page 2",
              images: [],
              processedAt: new Date(),
            },
          ],
          failed: [],
          totalProcessed: 2,
          totalTime: 1000,
        }),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      const articleIds = ["page-1", "page-2"];
      const result = await processNotionArticles(articleIds);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(2);
      expect(mockProcessor.processMultipleArticles).toHaveBeenCalledWith(
        articleIds,
        undefined
      );
    });

    test("進捗レポートが機能する", async () => {
      const progressCallback = mock();
      const mockProcessor = {
        processMultipleArticles: mock().mockImplementation(
          async (_ids, options) => {
            // 進捗コールバックをシミュレート
            if (options?.onProgress) {
              options.onProgress(1, 2);
              options.onProgress(2, 2);
            }
            return {
              successful: [
                {
                  metadata: {
                    id: "page-1",
                    title: "Page 1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    properties: {},
                  },
                  markdown: "# Page 1",
                  images: [],
                  processedAt: new Date(),
                },
              ],
              failed: [],
              totalProcessed: 1,
              totalTime: 500,
            };
          }
        ),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      const articleIds = ["page-1", "page-2"];
      const options = {
        concurrency: 2,
        onProgress: progressCallback,
      };

      await processNotionArticles(articleIds, undefined, options);

      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    test("エラー処理が適切に動作する", async () => {
      const errorCallback = mock();
      const mockProcessor = {
        processMultipleArticles: mock().mockImplementation(
          async (_ids, options) => {
            if (options?.onError) {
              options.onError(new Error("Processing error"), "invalid-page");
            }
            return {
              successful: [],
              failed: [
                {
                  articleId: "invalid-page",
                  error: new Error("Processing error"),
                },
              ],
              totalProcessed: 1,
              totalTime: 200,
            };
          }
        ),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      const result = await processNotionArticles(["invalid-page"], undefined, {
        onError: errorCallback,
        continueOnError: true,
      });

      expect(result.failed).toHaveLength(1);
      expect(errorCallback).toHaveBeenCalledWith(
        expect.any(Error),
        "invalid-page"
      );
    });

    test("空の配列を処理できる", async () => {
      const mockProcessor = {
        processMultipleArticles: mock().mockResolvedValue({
          successful: [],
          failed: [],
          totalProcessed: 0,
          totalTime: 0,
        }),
      };

      mock.module("../src/processor", () => ({
        NotionProcessor: mock(() => mockProcessor),
      }));

      process.env.NOTION_API_KEY = "test-key";

      const result = await processNotionArticles([]);
      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(0);
    });
  });
});