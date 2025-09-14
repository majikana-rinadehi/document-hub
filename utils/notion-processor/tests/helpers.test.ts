import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createNotionProcessor, validateConfig } from "../src/helpers";

// 環境変数のモック
const originalEnv = process.env;

describe("Helpers", () => {
  describe("validateConfig", () => {
    test("有効な設定を検証できる", () => {
      const config = {
        notionApiKey: "test-key",
        imageDirectory: "./images",
        imageUrlPrefix: "/images",
        maxRetries: 3,
        retryDelay: 1000,
      };

      const result = validateConfig(config);
      expect(result).toEqual(config);
    });

    test("APIキーが欠けている場合にエラー", () => {
      const config = {
        imageDirectory: "./images",
      };

      expect(() => validateConfig(config)).toThrow(
        "Notion APIキーが設定されていません"
      );
    });

    test("デフォルト値が適用される", () => {
      const config = {
        notionApiKey: "test-key",
      };

      const result = validateConfig(config);
      expect(result.imageDirectory).toBe("./images");
      expect(result.imageUrlPrefix).toBe("/images");
      expect(result.maxRetries).toBe(3);
      expect(result.retryDelay).toBe(1000);
    });

    test("無効なディレクトリパスでエラー", () => {
      const config = {
        notionApiKey: "test-key",
        imageDirectory: "", // 空文字は無効
      };

      expect(() => validateConfig(config)).toThrow();
    });
  });
});
