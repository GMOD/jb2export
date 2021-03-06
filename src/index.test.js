import { renderRegion } from "./renderRegion";
import fs from "fs";

test("renders a region with --session and --config args", async () => {
  const result = await renderRegion({
    session: "test/clingen_session.json",
    config: "data/config.json",
  });
  fs.writeFileSync("test/svg_from_config_and_session_param.svg", result);
  expect(result).toMatchSnapshot();
}, 10000);

test("renders a region with --session, --tracks, and --assembly args", async () => {
  const result = await renderRegion({
    session: "test/clingen_session.json",
    tracks: "data/tracks.json",
    assembly: "data/assembly.json",
  });
  fs.writeFileSync("test/svg_from_separate_session_and_tracks.svg", result);
  expect(result).toMatchSnapshot();
}, 10000);

test("renders volvox --fasta and --bam args", async () => {
  const result = await renderRegion({
    fasta: "data/volvox/volvox.fa",
    bam: "data/volvox/volvox-sorted.bam",
    loc: "ctgA:1000-2000",
  });
  fs.writeFileSync("test/svg_from_volvox_fasta_and_bam.svg", result);
  expect(result).toMatchSnapshot();
}, 20000);
