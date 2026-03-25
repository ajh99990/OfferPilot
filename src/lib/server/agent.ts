import {
  MISSION_APP_ID,
  mapMissionThread,
  type MissionMetadata,
  type MissionThread,
  type MissionStatus,
} from "@/lib/missions";

type AgentThread = {
  thread_id: string;
  created_at: string;
  updated_at: string;
  state_updated_at?: string;
  status: MissionStatus;
  metadata: unknown;
  values?: unknown;
};

const DEFAULT_AGENT_API_URL = "http://localhost:8123";

function getAgentApiUrl(): string {
  return (
    process.env.LANGGRAPH_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_LANGGRAPH_API_URL?.trim() ||
    DEFAULT_AGENT_API_URL
  );
}

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getAgentApiUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Agent request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getMissionThreadIfExists(
  threadId: string,
): Promise<MissionThread | null> {
  try {
    return await getMissionThread(threadId);
  } catch (error) {
    console.warn("load mission thread failed", threadId, error);
    return null;
  }
}

export async function listMissionThreads(limit = 50): Promise<MissionThread[]> {
  const threads = await agentFetch<AgentThread[]>("/threads/search", {
    method: "POST",
    body: JSON.stringify({
      limit,
      sort_by: "updated_at",
      sort_order: "desc",
      metadata: {
        app: MISSION_APP_ID,
      },
      select: [
        "thread_id",
        "created_at",
        "updated_at",
        "state_updated_at",
        "metadata",
        "status",
      ],
    }),
  });

  return threads.map(mapMissionThread);
}

export async function createMissionThread(
  metadata: MissionMetadata,
): Promise<MissionThread> {
  const thread = await agentFetch<AgentThread>("/threads", {
    method: "POST",
    body: JSON.stringify({
      metadata: {
        app: MISSION_APP_ID,
        version: 1,
        bootstrapStatus: "pending",
        ...metadata,
      },
    }),
  });

  return mapMissionThread(thread);
}

export async function getMissionThread(threadId: string): Promise<MissionThread> {
  const thread = await agentFetch<AgentThread>(
    `/threads/${encodeURIComponent(threadId)}`,
  );
  return mapMissionThread(thread);
}

export async function getMissionThreadsByIds(
  threadIds: Iterable<string>,
): Promise<MissionThread[]> {
  const uniqueIds = [...new Set(threadIds)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const missions = await Promise.all(
    uniqueIds.map((threadId) => getMissionThreadIfExists(threadId)),
  );

  return missions
    .filter((mission): mission is MissionThread => mission !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function patchMissionThread(
  threadId: string,
  metadata: Partial<MissionMetadata>,
): Promise<MissionThread> {
  const thread = await agentFetch<AgentThread>(
    `/threads/${encodeURIComponent(threadId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        metadata,
      }),
    },
  );

  return mapMissionThread(thread);
}
