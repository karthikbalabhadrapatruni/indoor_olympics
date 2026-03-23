export async function invokeInternalAiWorkflow(request, workflow, payload) {
  const internalToken = process.env.AI_INTERNAL_TOKEN;
  if (!internalToken) {
    throw new Error("AI_INTERNAL_TOKEN is not configured");
  }

  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}/api/_ai_internal/${workflow}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AI-Internal-Token": internalToken,
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `AI workflow '${workflow}' failed`);
  }

  return data;
}
