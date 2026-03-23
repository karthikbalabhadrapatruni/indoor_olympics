export async function invokeInternalAiWorkflow(request, workflow, payload) {
  const internalToken = process.env.AI_INTERNAL_TOKEN;
  if (!internalToken) {
    throw new Error("AI_INTERNAL_TOKEN is not configured");
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceUrl) {
    throw new Error("AI_SERVICE_URL is not configured");
  }

  const targetUrl = `${aiServiceUrl.replace(/\/$/, "")}/api/${workflow}`;
  console.log("[ai] invoking internal workflow", {
    workflow,
    targetUrl,
    payloadKeys: Object.keys(payload || {}),
  });

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AI-Internal-Token": internalToken,
    },
    body: JSON.stringify(payload || {}),
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = null;
  }

  console.log("[ai] internal workflow response", {
    workflow,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
  });
  if (!response.ok) {
    const snippet = rawText.slice(0, 240);
    throw new Error(
      data?.error ||
        `AI workflow '${workflow}' failed with status ${response.status}. Response starts with: ${snippet}`
    );
  }

  if (!data) {
    throw new Error(
      `AI workflow '${workflow}' returned non-JSON success response. Response starts with: ${rawText.slice(0, 240)}`
    );
  }

  return data;
}
