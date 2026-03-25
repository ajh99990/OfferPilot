export const LANGGRAPH_API_URL = (
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL?.trim() || "http://localhost:8123"
).replace(/\/$/, "");

export const LANGGRAPH_ASSISTANT_ID =
  process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID?.trim() || "agent";
