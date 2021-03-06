import "regenerator-runtime/runtime";
import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
import fs from "fs";

import { createViewState } from "@jbrowse/react-linear-genome-view";
import { renderToSvg } from "@jbrowse/plugin-linear-genome-view";
import { when } from "mobx";
const yargs = require("yargs");

const argv = yargs;
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

export function readData(opts) {
  const { assembly, config, tracks, session } = opts.argv;

  const assemblyData =
    assembly && fs.existsSync(assembly) ? read(assembly) : undefined;
  const tracksData = tracks ? read(tracks) : undefined;
  const sessionData = session ? read(session) : undefined;
  const configData = config ? read(config) : {};

  // use assembly from file, or select assemblyName from config
  if (assemblyData) {
    configData.assembly = assemblyData;
  } else {
    configData.assembly = assembly
      ? configData.assemblies.find((asm) => {
          asm.name === assembly;
        })
      : configData.assemblies[0];
  }

  if (tracksData) {
    configData.tracks = tracksData;
  }
  if (sessionData) {
    configData.defaultSession = sessionData;
  }
  return configData;
}

export async function renderRegion(opts = {}) {
  const model = createViewState(readData(opts));
  const { view } = model.session;
  const { assemblyManager } = model;
  view.setWidth(1000);
  await when(() => view.initialized);
  if (opts.loc) {
    const assembly = assemblyManager.assemblies[0];
    const region = assembly.regions[0];
    if (region) {
      view.setDisplayedRegions([getSnapshot(region)]);
    }
    view.navToLocString(opts.loc);
  }

  return renderToSvg(view, opts);
}

time(() => renderRegion(argv)).then((result) => {
  if (argv.out) {
    fs.writeFileSync(result, argv.out);
  } else {
    process.stdout.write(result);
  }
}, console.error);
