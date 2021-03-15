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

function addRelativePaths(config, configPath) {
  if (typeof config === "object") {
    for (const key of Object.keys(config)) {
      if (typeof config[key] === "object") {
        addRelativePaths(config[key], configPath);
      } else if (key === "localPath") {
        config.localPath = path.resolve(configPath, config.localPath);
      }
    }
  }
}

export function readData(opts) {
  const {
    assembly: asm,
    config,
    tracks,
    session,
    fasta,
    aliases,
    bam,
    cram,
    bigwig,
    vcfgz,
    gffgz,
    hic,
    bedgz,
    bigbed,
    defaultSession,
  } = opts;

  const assemblyData = asm && fs.existsSync(asm) ? read(asm) : undefined;
  const tracksData = tracks ? read(tracks) : undefined;
  const configData = config ? read(config) : {};
  let sessionData = session ? read(session) : undefined;

  if (config) {
    addRelativePaths(configData, path.dirname(path.resolve(config)));
  }

  // the session.json can be a raw session or a json file with a "session"
  // attribute, which is what is exported via the "File->Export session" in
  // jbrowse-web
  if (sessionData?.session) {
    sessionData = sessionData.session;
  }

  // only export first view
  if (sessionData?.views) {
    sessionData.view = sessionData.views[0];
  }

  // use assembly from file if a file existed
  if (assemblyData) {
    configData.assembly = assemblyData;
  }
  // else check if it was an assembly name in a config file
  else if (configData.assemblies?.length) {
    configData.assembly = asm
      ? configData.assemblies.find((asm) => asm.name === asm)
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
    if (aliases) {
      configData.assembly.refNameAliases = {
        adapter: {
          type: "RefNameAliasAdapter",
          location: makeLocation(aliases),
        },
      };
    }
  }

  // throw if still no assembly
  if (!configData.assembly) {
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
      ...bam
        .filter((file) => !file.startsWith("height:"))
        .map((file) => ({
          type: "AlignmentsTrack",
          trackId: path.basename(file),
          name: path.basename(file),
          assemblyNames: [configData.assembly.name],
          adapter: {
            type: "BamAdapter",
            bamLocation: makeLocation(file),
            index: { location: makeLocation(file + ".bai") },
            sequenceAdapter: configData.assembly.sequence.adapter,
          },
        })),
    ];
  }
  if (cram) {
    configData.tracks = [
      ...configData.tracks,
      ...cram.map((file) => ({
        type: "AlignmentsTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "CramAdapter",
          cramLocation: makeLocation(file),
          craiLocation: makeLocation(file + ".crai"),
          sequenceAdapter: configData.assembly.sequence.adapter,
        },
      })),
    ];
  }
  if (bigwig) {
    configData.tracks = [
      ...configData.tracks,
      ...bigwig.map((file) => ({
        type: "QuantitativeTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "BigWigAdapter",
          bigWigLocation: makeLocation(file),
        },
      })),
    ];
  }

  if (vcfgz) {
    configData.tracks = [
      ...configData.tracks,
      ...vcfgz.map((file) => ({
        type: "VariantTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "VcfTabixAdapter",
          vcfGzLocation: makeLocation(file),
          index: {
            location: makeLocation(file + ".tbi"),
          },
        },
      })),
    ];
  }

  if (gffgz) {
    configData.tracks = [
      ...configData.tracks,
      ...gffgz.map((file) => ({
        type: "FeatureTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "Gff3TabixAdapter",
          gffGzLocation: makeLocation(file),
          index: {
            location: makeLocation(file + ".tbi"),
          },
        },
      })),
    ];
  }

  if (hic) {
    configData.tracks = [
      ...configData.tracks,
      ...hic.map((file) => ({
        type: "HicTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "HicAdapter",
          hicLocation: makeLocation(file),
        },
      })),
    ];
  }
  if (bigbed) {
    configData.tracks = [
      ...configData.tracks,
      ...bigbed.map((file) => ({
        type: "FeatureTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "BigBedAdapter",
          bigBedLocation: makeLocation(file),
        },
      })),
    ];
  }
  if (bedgz) {
    configData.tracks = [
      ...configData.tracks,
      ...bedgz.map((file) => ({
        type: "FeatureTrack",
        trackId: path.basename(file),
        name: path.basename(file),
        assemblyNames: [configData.assembly.name],
        adapter: {
          type: "BedTabixAdapter",
          bedGzLocation: makeLocation(file),
          index: {
            location: makeLocation(file + ".tbi"),
          },
        },
      })),
    ];
  }

  if (!defaultSession) {
    // don't use defaultSession from config.json file, can result in assembly
    // name confusion
    delete configData.defaultSession;
  }

  // only allow an external manually specified session
  if (sessionData) {
    configData.defaultSession = sessionData;
  }

  return configData;
}

export async function renderRegion(opts = {}) {
  const model = createViewState(readData(opts));
  const {
    loc,
    bam,
    cram,
    bigwig,
    vcfgz,
    hic,
    bigbed,
    bedgz,
    gffgz,
    configtracks = [],
    width,
  } = opts;

  const { view } = model.session;
  const { assemblyManager } = model;
  view.setWidth(width || 1500);
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
    if (loc === "all") {
      view.showAllRegionsInAssembly(assembly.name);
    } else {
      view.navToLocString(loc);
    }
  }
  const tracks = [
    bam,
    cram,
    bigwig,
    vcfgz,
    hic,
    bigbed,
    bedgz,
    gffgz,
    configtracks,
    inorder,
  ].flat();

  let currentTrack;

  // nice helper function from https://stackoverflow.com/questions/263965/
  const booleanize = (string) => (string === "false" ? false : !!string);

  function process(track, extra = () => {}) {
    // apply height to any track
    if (track.startsWith("height:")) {
      const [, height] = track.split(":");
      currentTrack.displays[0].setHeight(+height);
    }

    // apply sort to pileup
    else if (track.startsWith("sort:")) {
      const [, type, tag] = track.split(":");
      currentTrack.displays[0].PileupDisplay.setSortedBy(type, tag);
    }

    // apply color scheme to pileup
    else if (track.startsWith("color:")) {
      const [, type, tag] = track.split(":");
      if (currentTrack.displays[0].PileupDisplay) {
        currentTrack.displays[0].PileupDisplay.setColorScheme({ type, tag });
      } else {
        currentTrack.displays[0].setColor(type);
      }
    }

    // force track to render even if maxbpperpx limit hit...
    else if (track.startsWith("force:")) {
      const [, force] = track.split(":");
      if (Boolean(force)) {
        currentTrack.displays[0].setUserBpPerPxLimit(Number.MAX_VALUE);
      }
    } else if (track.startsWith("autoscale:")) {
      const [, autoscale] = track.split(":");
      currentTrack.displays[0].setAutoscale(autoscale);
    } else if (track.startsWith("minmax:")) {
      const [, min, max] = track.split(":");
      currentTrack.displays[0].setMinScore(+min);
      currentTrack.displays[0].setMaxScore(+max);
    } else if (track.startsWith("scaletype:")) {
      const [, scaletype] = track.split(":");
      currentTrack.displays[0].setScaleType(scaletype);
    } else if (track.startsWith("crosshatch:")) {
      const [, val] = track.split(":");
      currentTrack.displays[0].setCrossHatches(booleanize(val));
    } else if (track.startsWith("fill:")) {
      const [, val] = track.split(":");
      currentTrack.displays[0].setFill(booleanize(val));
    } else if (track.startsWith("resolution:")) {
      let [, val] = track.split(":");
      if (val === "fine") {
        val = 10;
      } else if (val === "superfine") {
        val = 100;
      }
      currentTrack.displays[0].setResolution(val);
    } else if (track.startsWith("color:")) {
      let [, val] = track.split(":");
      currentTrack.displays[0].setColor(val);
    }

    // show track
    else {
      currentTrack = view.showTrack(extra(track));
    }
  }
  tracks
    .filter((f) => !!f && !!f.trim())
    .forEach((track) => process(track, (extra) => path.basename(extra)));

  return renderToSvg(view, opts);
}
