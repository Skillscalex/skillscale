import { planMirrorShardJobs, readSkillsIndexManifest, summarizeMirrorQueue } from "./mirrorQueue";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((part) => part.startsWith(prefix))?.slice(prefix.length);
}

const limit = Number(arg("limit") ?? 25);
const manifestPath = arg("manifest");
const manifest = await readSkillsIndexManifest(manifestPath);
const jobs = planMirrorShardJobs(manifest, Number.isFinite(limit) ? limit : 25);

console.log(JSON.stringify({ summary: summarizeMirrorQueue(manifest), jobs }, null, 2));
