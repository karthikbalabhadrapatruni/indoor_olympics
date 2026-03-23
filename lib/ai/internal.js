export async function invokeInternalAiWorkflow(request, workflow, payload) {
  const internalToken = process.env.AI_INTERNAL_TOKEN;
  if (!internalToken) {
    throw new Error("AI_INTERNAL_TOKEN is not configured");
  }

  const origin = new URL(request.url).origin;
  const targetUrl = `${origin}/api/_ai_internal/${workflow}`;
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

  const data = await response.json();
  console.log("[ai] internal workflow response", {
    workflow,
    status: response.status,
    ok: response.ok,
  });
  if (!response.ok) {
    throw new Error(data.error || `AI workflow '${workflow}' failed`);
  }

  return data;
}
