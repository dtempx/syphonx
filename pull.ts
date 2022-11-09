import * as fs from "async-file";
import * as path from "path";
import { parseArgs } from "./lib/index.js";
import { fetchTemplate } from "./lib/index.js";

export default async function () {
    const args = parseArgs({
        required: {
            0: "commmand",
            1: "template file"
        }
    });
    const file = path.resolve(path.basename(args[1]));
    const text = await fetchTemplate(args[1]);
    await fs.writeTextFile(file, text);
    console.log(file);
}
