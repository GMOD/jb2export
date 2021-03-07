# More examples

This one overcomes the "Zoom in to see data" for a specific track using force:true

```
jb2export --config data/config.json \
  --loc 1:1,100,000-1,200,000 \
  --assembly hg19 \
  --configtracks hg00096_lowcov force:true
```
