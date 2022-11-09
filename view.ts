import { parseArgs } from "./lib/index.js";
import { fetchTemplate } from "./lib/index.js";

export default async function () {
    const args = parseArgs({
        required: {
            0: "commmand",
            1: "template file"
        }
    });
    const text = await fetchTemplate(args[1]);
    console.log(text);
}
