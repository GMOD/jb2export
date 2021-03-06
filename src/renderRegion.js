import "regenerator-runtime/runtime";
import { createViewState } from "@jbrowse/react-linear-genome-view";
import { renderToSvg } from "@jbrowse/plugin-linear-genome-view";
import { when } from "mobx";
import fs from "fs";

function read(file) {
  return JSON.parse(fs.readFileSync(file));
}
export function readData(opts) {
  const { assembly, config, tracks, session } = opts;

  const assemblyData =
    assembly && fs.existsSync(assembly) ? read(assembly) : undefined;
  const tracksData = tracks ? read(tracks) : undefined;
  const sessionData = session ? read(session) : undefined;
  const configData = config ? read(config) : {};

  // use assembly from file if a file existed
  if (assemblyData) {
    configData.assembly = assemblyData;
  }

  // else check if it was an assembly name in a config file
  else if (configData.assemblies?.length) {
    configData.assembly = assembly
      ? configData.assemblies.find((asm) => {
          asm.name === assembly;
        })
      : configData.assemblies[0];
  }

  // else throw
  else {
    throw new Error(
      "no assembly specified, --assembly can accept an assembly name to look for in the --config file supplied, or if --config is not used, --assembly can be a path to a JSON file"
    );
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
