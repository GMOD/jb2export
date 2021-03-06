# Developer guide

This codebase currently uses a dev branch of jbrowse-components, namely the
export_wiggle_svg branch, and uses that branch to generate the svg outputs seen
in these exports

To setup jb2export, you can use

```bash
## setup jb2
git clone https://github.com/GMOD/jbrowse-components
git checkout export_svg_wiggle
yarn
cd ..

## setup jb2export
git clone git@github.com:cmdcolin/jb2export
cd jb2export
./setup_node_modules all /path/to/jb2/installation
yarn build
```

The setup_node_modules performs builds of the plugins on the export_svg_wiggle
branch and copies them over (`yarn link` doesn't work well so they are manually
built and copied)
