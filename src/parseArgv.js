export default function parseArgv(argv) {
  const map = [];
  while (argv.length) {
    const val = argv[0].slice(2);
    argv = argv.slice(1);
    const next = argv.slice(1).findIndex((arg) => arg.startsWith("-"));
    if (next !== -1) {
      map.push([val, argv.slice(0, next + 1)]);
      argv = argv.slice(next + 1);
    } else {
      map.push([val, argv]);
      break;
    }
  }
  return map;
}
