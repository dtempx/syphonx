import * as syphonx from "syphonx-lib";
import { parseArgs } from "./lib/index.js";

export default async function () {
    const args = parseArgs({
        required: {
            0: "commmand",
            1: "template file"
        },
        optional: {
            json: "view template in JSON format"
        }
    });

    if (args.json) {
        const template = await syphonx.fetchTemplate(args[1]);
        console.log(JSON.stringify(template, null, 2));    
    }
    else {
        const text = await syphonx.fetchTemplateSource(args[1]);
        console.log(text.trim());
    }
}