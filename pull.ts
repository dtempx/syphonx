import * as fs from "async-file";
import * as path from "path";
import * as syphonx from "syphonx-lib";
import { parseArgs } from "./lib/index.js";

export default async function () {
    const args = parseArgs({
        required: {
            0: "commmand",
            1: "template file"
        }
    });
    const file = path.resolve(path.basename(args[1]));
    const text = await syphonx.fetchTemplateSource(args[1]);
    await fs.writeTextFile(file, text);
    console.log(file);
}
