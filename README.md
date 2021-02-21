# jb2export

Static exports of JBrowse 2 rendering. This is a proof of concept work in
progress using beta branches of JBrowse 2 but has some nice early results

## Setup

This example currently uses the export_wiggle_svg branch, and uses that branch
to generate the svg outputs seen in these exports (just svg exports currently,
no png)

```
## setup jb2
git clone https://github.com/GMOD/jbrowse-components
git checkout export_svg_wiggle
yarn
cd ..

## setup jb2export
git clone git@github.com:cmdcolin/jb2export
cd jb2export
./setup_node_modules /path/to/jb2/installation
yarn build
```

The setup_node_modules performs builds of the plugins on the export_svg_wiggle
branch and copies them over (`yarn link` doesn't work well so they are manually
built and copied)

## Usage

First build the system with `yarn build` and generate dist/index.js, then we
can run the command with custom json

Simple

```
# generate out.svg using specified assembly, tracks, and session files
node dist/index.js --assembly assembly.json --tracks tracks.json --session session.json --loc  1:70,373,677..70,488,758 > out.svg
```

Params

- --assembly - path to a JSON file containing a jbrowse 2 assembly config e.g. [data/assembly.json](data/assembly.json)
- --tracks - path to a JSON file containing a list of jbrowse 2 track configs e.g. [data/tracks.json](data/tracks.json)
- --session - path to a JSON file containing a jbrowse 2 session config e.g. [data/session.json](data/session.json)
- --loc - a locstring to navigate to

If needed the svg can then be manually converted to png, for example using the
convert command from ImageMagick

    convert out.svg out.png

The inkscape command line does a slightly better job in some cases too,
particularly with the text because it handles dominant-baseline attribute

    inkscape --export-type png --export-filename out.png -w 2048 out.svg

The screenshot below uses inkscape

## Example

![](img/1.png)
