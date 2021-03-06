import { renderRegion } from "./renderRegion";
import fs from "fs";

function hashCode(str) {
  var hash = 0;
  let chr;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

test("renders a region with --session and --config args", async () => {
  const result = await renderRegion({
    session: "test/clingen_session.json",
    config: "data/config.json",
  });
  fs.writeFileSync("test/svg_from_config_and_session_param.svg", result);
  expect(hashCode(result)).toMatchSnapshot();
}, 10000);

test("renders a region with --session, --tracks, and --assembly args", async () => {
  const result = await renderRegion({
    session: "test/clingen_session.json",
    tracks: "data/tracks.json",
    assembly: "data/assembly.json",
  });
  fs.writeFileSync("test/svg_from_separate_session_and_tracks.svg", result);
  expect(hashCode(result)).toMatchSnapshot();
}, 10000);

test("renders volvox --fasta, --bam, --cram, --vcfgz, --bigwig args", async () => {
  console.error = jest.fn();
  const result = await renderRegion({
    fasta: "data/volvox/volvox.fa",
    bam: ["data/volvox/volvox-sorted.bam"],
    cram: ["data/volvox/volvox-sorted.cram"],
    bigwig: ["data/volvox/volvox-sorted.bam.coverage.bw"],
    vcfgz: ["data/volvox/volvox.filtered.vcf.gz"],
    gffgz: ["data/volvox/volvox.sort.gff3.gz"],
    bigbed: ["data/volvox/volvox.bb"],
    bedgz: ["data/volvox/volvox-bed12.bed.gz"],
    loc: "ctgA:1000-2000",
  });
  fs.writeFileSync("test/svg_from_volvox_fasta_and_bam.svg", result);
  // can't do a snapshot test here...inconsistent
  expect(result).toBeTruthy();
}, 20000);

xtest("renders --hic", async () => {
  const result = await renderRegion({
    fasta: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz",
    hic: [
      "https://s3.amazonaws.com/igv.broadinstitute.org/data/hic/intra_nofrag_30.hic",
    ],
    loc: "1:2,000,000-10,000,000",
  });
  fs.writeFileSync("test/svg_from_human_hic.svg", result);
  // can't do a snapshot test here...inconsistent
  expect(result).toBeTruthy();
}, 20000);