import { queryIdeas } from "@/lib/queryIdeas";
import { MojeBoard } from "@/components/MojeBoard";

export const dynamic = "force-dynamic";

export default async function MojePage() {
  const [activeIdeas, archivedIdeas] = await Promise.all([
    queryIdeas({ includeArchived: false, limit: 500 }),
    queryIdeas({ onlyArchived: true, limit: 500 }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">🗂 Moje nápady</h1>
        <p className="text-sm text-mozek-muted">
          Osobní správa: kategorizuj přetažením do sloupců, označuj oblíbené a mazané nápady se jen schovají do koše.
        </p>
      </div>
      <MojeBoard activeIdeas={activeIdeas} archivedIdeas={archivedIdeas} />
    </div>
  );
}
