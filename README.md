# jb2export

Static exports of JBrowse 2 rendering. This is a proof of concept work in
progress using beta branches of JBrowse 2 but has some nice early results

The output is currently SVG which should be loadable in Adobe Illustrator or
Inkscape. The output can also be manually converted to PNG if needed.

## Screenshot

![](img/1.png)

## Setup

Note that this is not yet published to NPM but when it is you can install via

```bash
npm install -g jb2export
```

Then you will have a command `jb2export` that can be used.

To use it now, see [developer guide](DEVELOPER.md) for details

## Example usages

This will show some example usages

### Use with local files

We can call this script on local files, and it doesn't require a web browser,
not even a headless webbrowser, it just runs a node script and React SSR is
used to create the SVG

```bash
## generate an indexed fasta e.g. fai file
samtools faidx yourfile.fa

## generate an indexed BAM
samtools index yourfile.bam


## simple rendering of a your local files
jb2export --fasta yourfile.fa --bam yourfile.bam --loc 1:1,000,000-1,001,000
```

The file out.svg is created by default, use --out to customize

### Use with remote files

This example shows using remote files, e.g. with human hg19 and several tracks

Note the use of --aliases to smooth over refname differences e.g. fasta
contains 1 for chr1, and bigbed contains chr1, gff contains NC_000001.10

```

jb2export --fasta https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz \
  --aliases https://jbrowse.org/genomes/hg19/hg19_aliases.txt  \
  --bigbed https://hgdownload.soe.ucsc.edu/gbdb/hg19/bbi/clinvar/clinvarMain.bb \
  --gffgz https://jbrowse.org/genomes/hg19/ncbi_refseq/GRCh37_latest_genomic.sort.gff.gz \
  --bigwig https://jbrowse.org/genomes/hg19/reads_lr_skbr3.fa_ngmlr-0.2.3_mapped.bam.regions.bw \
  --loc 1:48,683,542..48,907,531
```

### Customizing track

In addition to possibly specifying custom track configuration files, sometimes
specializing specifically track state is helpful. This example helps color and
sort by the read group (RG) tag

```bash
jb2export --fasta data/volvox/volvox.fa \
  --bam data/volvox/volvox-rg.bam color:tag:RG sort:tag:RG height:400 \
  --loc ctgA:609..968
```

You can see that instead of adding extra dash dash --flags, it is a colon based
syntax that follows a track definition.

The color and sort are specific to pileup, and height can apply to any track.
More options may be described here soon

### Use with a jbrowse config.json (remote files in the config.json)

A config.json can be specified, and then we just refer to trackIds in this
file, and extra tracks can also be supplied that are outside of the config e.g.
with --bam

```bash
jb2export --config data/config.json \
  --assembly hg19 \
  --configtracks hg00096_highcov clinvar_cnv_hg19 \
  --bam custom_bam.bam \
  --loc 1:1,000,000-1,100,000
```

### Use with a jbrowse config.json (local files in the config.json)

The jbrowse CLI tool (e.g. npm install -g @jbrowse/cli) refers to "uri" paths
by default, but you replace them with localPath like this

```js

  //replace this:
  "vcfGzLocation": {
    "uri": "volvox.dup.vcf.gz"
  },

  //with this:
  "vcfGzLocation": {
    "localPath": "volvox.dup.vcf.gz"
  }
```

Then you can call it like above

```bash
jb2export --config data/volvox/config.json \
  --assembly volvox
  --configtracks volvox_sv \
  --loc ctgA:1-50,000
```

The localPaths will be resolved relative to the file that is supplied so in
this example we would resolve data/volvox/volvox.dup.vcf.gz if "localPath":
"volvox.dup.vcf.gz" is used, and `--config data/volvox/config.json` is passed

See data/volvox/config.json for a config that contains localPaths, or
data/config.json for a config that just contains URLs

## Parameters

### Assembly params

- --fasta - filename or http(s) URL for a indexed or bgzip indexed FASTA file
- --aliases - tab separated "refName aliases" with column 1 matching the FASTA,
  and other columns being aliases

### Track params

Specify these with a filename (local to the computer) or a http(s) URL. Can
specify it multiple times e.g. --bam file1.bam --bam file2.bam

- --bigbed
- --gffgz
- --bedgz
- --vcfgz
- --bigwig
- --bam
- --cram
- --hic (wip)

### Config file params (optional)

- --assembly - path to a JSON file containing a jbrowse 2 assembly config e.g.
  [data/assembly.json](data/assembly.json), can be used in place of --fasta
- --tracks - path to a JSON file containing a list of jbrowse 2 track configs
  e.g. [data/tracks.json](data/tracks.json)
- --session - path to a JSON file containing a jbrowse 2 session config e.g.
  [data/session.json](data/session.json)
- --config - path to a JSON file containing a full jbrowse 2 config e.g.
  [data/config.json](data/config.json)

### Other

- --loc - a locstring to navigate to
- --out - file to write the svg to
- --fullSvg - the canvas based tracks such as wiggle, read pileups, and hic are
  rasterized to a PNG inside the svg by default. if you want it in all SVG then
  use this flag but note that filesize may be much larger

## Convert to PNG

The PNG above was made with inkscape. Most methods for converting from SVG to
PNG should be OK, but imagemagick may produce some somewhat weird formatting.
Here are a couple methods you can try

```bash
## with inkscape

sudo apt install inkscape
inkscape --export-type png --export-filename out.png -w 2048 out.svg

## with librsvg

sudo apt install librsvg2-bin
rsvg-convert -w 2048 out.svg -o out.png

## with imagemagick

sudo apt install imagemagick
convert -size 2048x out.svg out.png

```

## Notes

Currently does not fully respect the order that you specify tracks, so if you
have --bam 1.bam --bigwig file.bw --bam 2.bam then it will order it bw,1,2
