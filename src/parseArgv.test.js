import parseArgv from "./parseArgv";

test("parse", () => {
  expect(
    parseArgv(
      "--bam dad.bam color:red --vcf variants.vcf --bam mom.bam".split(" ")
    )
  ).toEqual([
    ["bam", ["dad.bam", "color:red"]],
    ["vcf", ["variants.vcf"]],
    ["bam", ["mom.bam"]],
  ]);
});
