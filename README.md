# jb2export

Static exports of JBrowse 2 rendering. This is a proof of concept work in
progress using beta branches of JBrowse 2 but has some nice early results

The output is currently svg which can be converted to png if needed

## Setup

Note that this is not yet published to NPM but when it is you can install via

```bash
npm install -g jb2export
```

Then you will have a command `jb2export` that can be used.

To use it now, see [developer guide](DEVELOPER.md) for details

## Usage

First build the system with `yarn build` and generate dist/index.js, then we
can run the command with custom json

Simple invocation using assembly, tracks, and session JSON files

```bash
# generate out.svg using specified assembly, tracks, and session files
jb2export \
  --assembly assembly.json \
  --tracks tracks.json
  --session  session.json \
  --loc  1:70,373,677..70,488,758 > out.svg
```

Params

- --assembly - path to a JSON file containing a jbrowse 2 assembly config e.g.
  [data/assembly.json](data/assembly.json)
- --tracks - path to a JSON file containing a list of jbrowse 2 track configs
  e.g. [data/tracks.json](data/tracks.json)
- --session - path to a JSON file containing a jbrowse 2 session config e.g.
  [data/session.json](data/session.json)
- --config - path to a JSON file containing a full jbrowse 2 config e.g.
  [data/config.json](data/config.json)
- --loc - a locstring to navigate to

## Convert to PNG

These should all aim to convert the SVG to PNG, using a 2048px width (height
inferred) in all examples. The ImageMagick `convert` command currently gives
some bad text placement but other examples look ok

The examples should also be loadable in Adobe Illustrator or Inkscape

```
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

The example below generated from SVG with Inkscape

## Example

![](img/1.png)

```

```
