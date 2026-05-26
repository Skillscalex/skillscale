import { runIngestion } from "./index";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((part) => part.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const result = await runIngestion({
    source: arg("source"),
    dryRun: process.argv.includes("--dry-run"),
    resume: process.argv.includes("--resume"),
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
