import { runAutonomousSkillLoop } from "./loop";

const allowExternalFetch = process.argv.includes("--allow-external-fetch");
const live = process.argv.includes("--live");

const run = await runAutonomousSkillLoop({
  allowExternalFetch,
  dryRun: !live,
});

console.log(JSON.stringify(run, null, 2));
