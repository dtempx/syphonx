import { parseArgs } from "./lib/index.js";
import { fetchTemplate, loadTemplate } from "./lib/index.js";

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
        const template = await loadTemplate(args[1]);
        console.log(JSON.stringify(template, null, 2));    
    }
    else {
        const text = await fetchTemplate(args[1]);
        console.log(text.trim());
    }
}