import "regenerator-runtime/runtime";
import { createViewState } from "@jbrowse/react-linear-genome-view";
import { getSnapshot } from "mobx-state-tree";
import { renderToSvg } from "@jbrowse/plugin-linear-genome-view";
import { when } from "mobx";
import path from "path";
import fs from "fs";

function read(file) {
  return JSON.parse(fs.readFileSync(file));
}
function makeLocation(file) {
  return file.startsWith("http") ? { uri: file } : { localPath: file };
}
function shortid() {
  return `${Math.random()}`;
}

export function readData(opts) {
  const {
    assembly,
    config,
    tracks,
    session,
    fasta,
    refAliases,
    bam,
    cram,
  } = opts;

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
      ? configData.assemblies.find((asm) => asm.name === assembly)
      : configData.assemblies[0];
  }
  // else load fasta from command line
  else if (fasta) {
    const bgzip = fasta.endsWith("gz");

    configData.assembly = {
      name: path.basename(fasta),
      sequence: {
        type: "ReferenceSequenceTrack",
        trackId: "refseq",
        adapter: {
          type: bgzip ? "BgzipFastaAdapter" : "IndexedFastaAdapter",
          fastaLocation: makeLocation(fasta),
          faiLocation: makeLocation(fasta + ".fai"),
          gziLocation: bgzip ? makeLocation(fasta + ".gzi") : undefined,
        },
      },
    };
    if (refAliases) {
      configData.assembly.refNameAlaises = {
        adapter: {
          type: "RefNameAliasAdapter",
          location: makeLocation(refAliases),
        },
      };
    }
  }

  // else throw
  else {
    throw new Error(
      "no assembly specified, --assembly can accept an assembly name to look for in the --config file supplied, or if --config is not used, --assembly can be a path to a JSON file"
    );
  }

  if (tracksData) {
    configData.tracks = tracksData;
  } else if (!configData.tracks) {
    configData.tracks = [];
  }

  if (bam) {
    configData.tracks = [
      ...configData.tracks,
      {
        type: "AlignmentsTrack",
        trackId: path.basename(bam),
        name: path.basename(bam),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "BamAdapter",
          bamLocation: makeLocation(bam),
          index: { type: "BAI", location: makeLocation(bam + ".bai") },
          sequenceAdapter: configData.assembly.sequence.adapter,
        },
      },
    ];
  }
  if (cram) {
    configData.tracks = [
      ...configData.tracks,
      {
        type: "AlignmentsTrack",
        trackId: path.basename(cram),
        name: path.basename(cram),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "CramAdapter",
          cramLocation: makeLocation(cram),
          craiLocation: makeLocation(cram + ".crai"),
          sequenceAdapter: configData.assembly.sequence.adapter,
        },
      },
    ];
  }

  if (sessionData) {
    configData.defaultSession = sessionData;
  }

  return configData;
}

export async function renderRegion(opts = {}) {
  const model = createViewState(readData(opts));
  const { loc, bam, cram } = opts;
  const { view } = model.session;
  const { assemblyManager } = model;
  view.setWidth(1000);
  await when(() => {
    return (
      assemblyManager.allPossibleRefNames &&
      assemblyManager.allPossibleRefNames.length &&
      model.session.view.initialized
    );
  });
  if (loc) {
    const assembly = assemblyManager.assemblies[0];

    const region = assembly.regions[0];
    if (region) {
      view.setDisplayedRegions([getSnapshot(region)]);
    }
    view.navToLocString(loc);
  }
  if (bam) {
    view.showTrack(path.basename(bam));
  }
  if (cram) {
    view.showTrack(path.basename(cram));
  }

  return renderToSvg(view, opts);
}
