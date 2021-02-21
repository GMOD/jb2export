import "regenerator-runtime/runtime";
import fs from "fs";

import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
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
  .help()
  .alias("help", "h").argv;

// const theme = createJBrowseTheme();

const assembly = JSON.parse(
  fs.readFileSync(argv.config || "data/assembly.json")
);
const tracks = JSON.parse(fs.readFileSync(argv.tracks || "data/tracks.json"));
const defaultSession = JSON.parse(
  fs.readFileSync(argv.session || "data/session.json")
);
const location = argv.loc;

async function time(cb) {
  const start = +Date.now();
  const ret = await cb();
  console.error(`Finished rendering: ${(+Date.now() - start) / 1000}s`);
  return ret;
}

async function renderRegion() {
  try {
    const model = createViewState({
      assembly,
      tracks,
      defaultSession,
    });
    const { view } = model.session;
    const { assemblyManager } = model;
    view.setWidth(1000);

    if (location) {
      await when(
        () =>
          assemblyManager.allPossibleRefNames &&
          assemblyManager.allPossibleRefNames.length &&
          model.session.view.initialized
      );

      if (!model.session.view.displayedRegions.length) {
        const assemblyState = model.assemblyManager.assemblies[0];
        const region =
          assemblyState && assemblyState.regions && assemblyState.regions[0];
        if (region) {
          model.session.view.setDisplayedRegions([getSnapshot(region)]);
        }
      }
      model.session.view.navToLocString(location);
    }

    const svg = await time(() => renderToSvg(view));
    console.log(svg);
  } catch (e) {
    console.error(e);
  }
}

renderRegion();
