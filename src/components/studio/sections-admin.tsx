import { ShieldCheck, Activity } from "lucide-react";
import { Panel, Note, Readout } from "@/components/studio/ui";

export function ModerationPanel() { return <Panel eyebrow="Module 19" title="Local Moderation" icon={<ShieldCheck className="size-5" />}><Note>Community moderation is local-first on this branch. No hosted database or remote moderation queue is required.</Note></Panel>; }
export function AnalyticsPanel() { return <Panel eyebrow="Module 20" title="Local Analytics" icon={<Activity className="size-5" />}><Readout label="Telemetry">Local-only</Readout><Readout label="External tracking">Disabled</Readout><Note>Plugin performance is tracked only for the current browser session.</Note></Panel>; }
