#!/usr/bin/env bun

import { join } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { createProcessor, processArticle } from "../utils/notion-processor/src/processor";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: bun run fetch <article-id>");
    process.exit(1);
  }

  const articleId = args[0];

  if (!process.env.NOTION_API_KEY) {
    console.error("NOTION_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
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