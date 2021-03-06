import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
import fs from "fs";
import { renderRegion } from "./renderRegion";

const yargs = require("yargs");

const opts = yargs;
yargs
  .command("jb2export", "Creates a jbrowse 2 image snapshot")
  .option("config", {
    description: "Path to config file",
    type: "string",
  })
  .option("session", {
    description: "Path to session file",
    type: "string",
  })
  .option("assembly", {
    description:
      "Path to an assembly configuration, or a name of an assembly in the configFile",
    type: "string",
  })
  .option("tracks", {
    description: "Path to tracks portion of a session",
    type: "string",
  })
  .option("loc", {
    description: "A locstring to navigate to",
    type: "string",
  })
  .option("fasta", {
    description: "Supply a fasta for the assembly",
    type: "string",
  })
  .option("aliases", {
    description:
      "Supply aliases for the assembly, e.g. mapping of 1 to chr1. Tab separated file where column 1 matches the names from the FASTA",
    type: "string",
  })
  .option("bam", {
    description:
      "A bam file, flag --bam can be used multiple times to specify multiple bam files",
    type: "string",
  })
  .option("cram", {
    description: "A cram file",
    type: "string",
  })
  .option("vcfgz", {
    description: "A vcf or tabixed VCF",
    type: "string",
  })
  .option("out", {
    description: "File to output to. Default if not used is stdout",
    type: "string",
  })
  .option("fullSvg", {
    description:
      "Use full SVG rendering with no rasterized layers, this can substantially increase filesize",
    default: false,
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

const { argv } = opts;
console.log(argv.bam);

//prints to stderr the time it takes to execute cb
async function time(cb) {
  const start = +Date.now();
  const ret = await cb();
  console.error(`Finished rendering: ${(+Date.now() - start) / 1000}s`);
  return ret;
}

time(() => renderRegion(argv)).then((result) => {
  if (argv.out) {
    fs.writeFileSync(argv.out, result);
  } else {
    process.stdout.write(result);
  }
}, console.error);
