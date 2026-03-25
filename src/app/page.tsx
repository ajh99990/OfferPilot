import { MissionHome } from "@/components/mission-home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <MissionHome initialMissions={[]} initialLoadError={null} />;
}
