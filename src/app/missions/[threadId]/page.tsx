import { MissionWorkspaceLoader } from "@/components/mission-workspace-loader";

export const dynamic = "force-dynamic";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <MissionWorkspaceLoader threadId={threadId} />;
}
