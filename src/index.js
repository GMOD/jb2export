import "regenerator-runtime/runtime";
import fs from "fs";

import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";
import {
  createViewState,
  createJBrowseTheme,
  JBrowseLinearGenomeView,
  ThemeProvider,
} from "@jbrowse/react-linear-genome-view";
import { renderToSvg } from "@jbrowse/plugin-linear-genome-view";
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

(async () => {
  try {
    const state = createViewState({
      assembly,
      tracks,
      defaultSession,
    });
    state.session.view.setWidth(1000);
    console.time("duration");
    const start = +Date.now();
    console.log(await renderToSvg(state.session.view));
    console.error(`Finished rendering: ${(+Date.now() - start) / 1000}s`);
  } catch (e) {
    console.error(e);
  }
})();
