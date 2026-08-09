/**
 * Provider-free open-model runtime.
 * Core creative models require no API keys. Heavy models execute through
 * a free local/browser runner or a free GPU workspace such as Kaggle/Lightning.
 */

export type Capability = "video" | "voice" | "stems" | "image" | "text" | "music";
export type RuntimeKind = "local" | "browser" | "kaggle" | "lightning";

export type PluginRow = {
  id: string; slug: string; name: string; capability: Capability; provider: "open-source";
  model_ref: string; secret_name: null; is_free: true; quality: number; speed: number;
  weekly_score: number; enabled: boolean; notes: string; runtime: RuntimeKind; project_url: string;
};
export type PluginStatus = PluginRow & { available: boolean; reason: string };
type RunInput = Record<string, unknown>;
export type OpenModelRunner = (plugin: PluginRow, input: RunInput) => Promise<unknown>;
const RUNNER_KEY = "__LITTLE_REDS_OPEN_MODEL_RUNNER__";
type RunnerHost = typeof globalThis & { [RUNNER_KEY]?: OpenModelRunner };

export function registerOpenModelRunner(runner: OpenModelRunner) { (globalThis as RunnerHost)[RUNNER_KEY] = runner; }
export function hasOpenModelRunner() { return typeof (globalThis as RunnerHost)[RUNNER_KEY] === "function"; }
export function secretFor(_plugin: PluginRow): undefined { return undefined; }

export function describeAvailability(plugin: PluginRow): PluginStatus {
  if (!plugin.enabled) return { ...plugin, available:false, reason:"Disabled in the open-model catalog" };
  if (!hasOpenModelRunner()) return { ...plugin, available:false, reason:`Open model ready; connect the free ${plugin.runtime} runner to execute it` };
  return { ...plugin, available:true, reason:`Ready — free/open ${plugin.runtime} runtime` };
}
export function rankPlugins(plugins: PluginStatus[]) { return [...plugins].sort((a,b)=>Number(b.available)-Number(a.available)||Number(b.weekly_score)-Number(a.weekly_score)||b.quality+b.speed-(a.quality+a.speed)); }
export async function invokePlugin(plugin: PluginRow,input:RunInput){const runner=(globalThis as RunnerHost)[RUNNER_KEY];if(!runner)throw new Error(`${plugin.name} needs its free ${plugin.runtime} runner. No API key, paid provider, or hosted inference service is supported.`);return runner(plugin,input);}
export function extractMedia(output:unknown){const out:string[]=[];const walk=(value:unknown,depth=0)=>{if(depth>4||value==null)return;if(typeof value==="string"){if(value.startsWith("http")||value.startsWith("data:")||value.startsWith("blob:"))out.push(value);return;}if(Array.isArray(value)){value.forEach(v=>walk(v,depth+1));return;}if(typeof value==="object")Object.values(value as Record<string,unknown>).forEach(v=>walk(v,depth+1));};walk(output);return Array.from(new Set(out));}
export function buildInput(capability:Capability,payload:Record<string,unknown>):RunInput{switch(capability){case"video":return{prompt:payload.prompt,...(payload.image?{image:payload.image,start_image:payload.image}:{}),duration:payload.seconds??5,aspect_ratio:payload.aspectRatio??"16:9"};case"voice":return{text:payload.text,...(payload.reference?{reference_audio:payload.reference,audio:payload.reference}:{}),speed:payload.speed??1,language:payload.language??"en"};case"music":return{prompt:payload.prompt??payload.text,seconds:payload.seconds??30};case"stems":return{audio:payload.audio};case"image":return{prompt:payload.prompt,reference:payload.reference};default:return payload;}}
