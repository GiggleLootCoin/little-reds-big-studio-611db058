import { createFileRoute } from "@tanstack/react-router";
import { VocalStudioPanel } from "@/components/studio/VocalStudioPanel";
import { VoiceLabPanel } from "@/components/studio/VoiceLabPanel";

export const Route = createFileRoute("/voice-lab")({
  component: VoiceLab,
});

function VoiceLab() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <a href="/" className="text-sm text-primary underline">
          ← Back to Little Red's Big Studio
        </a>
        <VocalStudioPanel />
        <VoiceLabPanel />
      </div>
    </main>
  );
}

// Buddy-first vocal creation: record/upload a personal reference, replace vocals in a song,
// or build a new track through the free/open generation and conversion pipeline.
