import "regenerator-runtime/runtime";
import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
import fs from "fs";

import { createViewState } from "@jbrowse/react-linear-genome-view";
import { renderToSvg } from "@jbrowse/plugin-linear-genome-view";
import { when } from "mobx";
const yargs = require("yargs");

const argv = yargs
  .command("jb2img", "Creates jbrowse 2 image snapshots")
  .option("config", {
    description: "Path to config file",
    type: "string",
  })
  .option("session", {
    description: "Path to session file",
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
  .option("bam", {
    description:
      "A bam file, flag --bam can be used multiple times to specify multiple bam files",
    type: "string",
  })
  .option("bamindex", {
    description:
      "A bai for the bam, optional, automatically inferred as .bam.bai but supply this if needed (can be used multiple times, in which case it applies to a bam flag used multiple times), can also be a csi file if needed",
    type: "string",
  })
  .option("cram", {
    description: "A cram file",
    type: "string",
  })
  .option("cramindex", {
    description:
      "A crai for the cram, optional, automatically inferred as .cram.crai supply this if needed (can be used multiple times, in which case it applies to a bam flag used multiple times)",
    type: "string",
  })
  .option("vcf", {
    description: "A vcf or tabixed VCF",
    type: "string",
  })
  .option("vcfindex", {
    description:
      "A tbi file for the VCF, optional, automatically inferred as .vcf.tbi if not specified, can also be a .csi",
    type: "string",
  })
  .option("out", {
    description: "File to output to. Default if not used is stdout",
    type: "string",
  })
  .option("fullsvg", {
    description:
      "Use full SVG rendering with no rasterized layers, this can substantially increase filesize",
    default: false,
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

function read(file) {
  return JSON.parse(fs.readFileSync(file));
}

//prints to stderr the time it takes to execute cb
async function time(cb) {
  const start = +Date.now();
  const ret = await cb();
  console.error(`Finished rendering: ${(+Date.now() - start) / 1000}s`);
  return ret;
}

export function readData(opts = {}) {
  const assembly = read(opts.config || "data/assembly.json");
  const tracks = read(opts.tracks || "data/tracks.json");
  const defaultSession = read(opts.session || "data/session.json");
  return { assembly, tracks, defaultSession };
}

export async function renderRegion(opts = {}) {
  const model = createViewState(readData(opts));
  const { view } = model.session;
  const { assemblyManager } = model;
  view.setWidth(1000);
  await when(() => {
    return view.initialized;
  });
  if (opts.loc) {
    if (!view.displayedRegions.length) {
      const { assemblies } = assemblyManager;
      const [assembly] = assemblies;
      const { regions = [] } = assembly || {};
      const [region] = regions;
      if (region) {
        view.setDisplayedRegions([getSnapshot(region)]);
      }
    }
    view.navToLocString(opts.loc);
  }

  return renderToSvg(view, opts);
}

time(() => renderRegion(argv)).then(console.log, console.error);
