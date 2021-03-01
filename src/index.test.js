import { renderRegion } from "./index";
import fs from "fs";

test("renders a region", async () => {
  const result = await renderRegion({ session: "test/simpleSVG.json" });
  fs.writeFileSync("test/simpleSVG.svg", result);
  expect(result).toMatchSnapshot();
}, 10000);
