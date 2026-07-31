import * as ventures from "@/server/db/repositories/ventures";
import * as drafts from "@/server/content/drafts";
import { ContentInbox } from "@/components/content/ContentInbox";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [ventureList, draftList, voiceSources, selectedVoiceSamples] = await Promise.all([
    ventures.list(),
    drafts.listDrafts(),
    drafts.listVoiceSources(),
    drafts.getVoiceSamples(),
  ]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6 sm:p-10">
        <ContentInbox
          ventures={ventureList.map((v) => ({ id: v.id, title: v.title }))}
          drafts={draftList}
          voiceSources={voiceSources}
          initialVoiceSamples={selectedVoiceSamples}
        />
      </main>
    </div>
  );
}
