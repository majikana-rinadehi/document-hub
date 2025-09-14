#!/usr/bin/env bun

import { join } from "path";
import { writeFileSync, mkdirSync } from "fs";
import {
  createProcessor,
  processArticle,
} from "../utils/notion-processor/src/processor";
import { NotionFetcher } from "../utils/notion-fetcher/src/index";

const STATUS_PROPERTY_ID = "MDa%5E"; // Status property ID in Notion
const PROCESSABLE_STATUSES = ["Preview", "Published"];

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: bun run fetch <article-id>");
    process.exit(1);
  }

  if (typeof args[0] !== "string" || !args[0].trim()) {
    console.error("Article ID must be a valid non-empty string");
    process.exit(1);
  }

  // Normalize article ID by removing dashes
  const articleId = args[0].replace(/-/g, "");

  if (!process.env.NOTION_API_KEY) {
    console.error("NOTION_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    // Check article status before processing
    const fetcher = new NotionFetcher({ apiKey: process.env.NOTION_API_KEY });
    const articleData = await fetcher.fetchArticleById(articleId);

    // Check Status property in metadata
    const statusProperty = articleData.metadata.properties?.Status;
    if (
      statusProperty &&
      statusProperty.id === STATUS_PROPERTY_ID &&
      statusProperty.status
    ) {
      const statusName = statusProperty.status.name;
      // Skip processing if status indicates the article should not be processed
      if (!PROCESSABLE_STATUSES.includes(statusName || "")) {
        console.log(`✅ Article ${articleId} skipped (Status: ${statusName})`);
        return;
      }
    }

    const processor = createProcessor({
      notionApiKey: process.env.NOTION_API_KEY,
      imageDirectory: "./output/images",
      imageUrlPrefix: "/images",
    });

    console.log(`Processing article: ${articleId}`);

    const result = await processArticle(processor, articleId);

    // Create output directory
    const outputDir = "./output";
    mkdirSync(outputDir, { recursive: true });

    // Save markdown file
    const markdownPath = join(outputDir, `${articleId}.md`);
    writeFileSync(markdownPath, result.markdown);

    // Save metadata
    const metadataPath = join(outputDir, `${articleId}.json`);
    const metadata = {
      ...result.metadata,
      processedAt: result.processedAt,
      processingTime: result.processingTime,
      images: result.images,
    };
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Article processed successfully:`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`   Metadata: ${metadataPath}`);
    console.log(`   Images: ${result.images.length} files`);
    console.log(`   Processing time: ${result.processingTime}ms`);
  } catch (error) {
    console.error("❌ Failed to process article:", error);
    process.exit(1);
  }
}

main();
