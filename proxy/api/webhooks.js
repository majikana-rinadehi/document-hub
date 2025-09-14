import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONSリクエスト対応
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POSTリクエストのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== Notion Webhook Received ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    // GitHub APIクライアント初期化
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // NOTE: No more than 10 properties are allowed; 12 were supplied.
    const clientPayload = { ...req.body };
    // client_payloadのプロパティ数を10に制限
    // 次は必ず含む: id, timestamp, data, type, entity, authors, integration_id, subscription_id, workspace_name, workspace_id
    const allowedKeys = [
      "id",
      "timestamp",
      "data",
      "type",
      "entity",
      "authors",
      "integration_id",
      "subscription_id",
      "workspace_name",
      "workspace_id",
    ];
    Object.keys(clientPayload).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        delete clientPayload[key];
      }
    });

    // repository_dispatch実行
    await octokit.rest.repos.createDispatchEvent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      event_type: "notion-article-updated",
      client_payload: {
        ...clientPayload,
      },
    });

    console.log("GitHub Actions triggered successfully");

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
