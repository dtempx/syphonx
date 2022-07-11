import * as syphonx from "syphonx-core";
import * as fs from "fs";
import { insert, loadJSON, offline, online, subset, tryParseJSON, Script } from "./common/index.js";

export default async function (args: Record<string, string>): Promise<void> {
    const script: Script = args[1] ? await loadJSON(args[1]) : { actions: [] };
    const url = args.url || script.url;
    if (!url && !args[2]) {
        console.log("url not specified");
        process.exit(1);
    }

    const output = args.out ? args.out.split(",") : ["data"];
    const debug = output.includes("log");
    const params = { ...script.params, ...tryParseJSON(args.params, false) };

    const dataset = script.key ? script.key.split("/").filter(text => text.length > 0)[0] : "";
    const table = "syphonx";

    let result: syphonx.ExtractResult;
    if (!args[2]) {
        const pause = args.pause === "1" ? "before" : (args.pause as "before" | "after" | "both" | undefined);
        const show = !!args.show || !!pause;
        result = await online({
            ...script,
            url: url!,
            params,
            show,
            pause,
            debug,
            timeout: parseInt(args.timeout) || script.timeout,
            offline: !!args.offline,
            browserOptions: {}, // todo: not supported yet
            includeDOMRefs: false,
            outputTransformedHTML: output.includes("html:post")
        });
    }
    else {
        const html = fs.readFileSync(args[2], "utf8");
        result = await offline({
            ...script,
            html,
            url,
            params,
            debug,
            includeDOMRefs: false
        });
    }

    if (args.insert) {
        if (result.ok || args.onerror === "insert") {
            const id = await insert({ dataset, table, key: script.key || "default", tag: args.tag, result });
            console.log(`${id} inserted to ${dataset}.${table}`);
        }
    }
    else {
        if (output.includes("data")) {
            if (args.filter)
                result.data = subset(result.data as Record<string, unknown>, args.filter.split(",").map(value => value.trim()));
            console.log(JSON.stringify(result.data, null, 2));
            console.log();
        }
    
        if (output.includes("log")) {
            if (!args[2] && !args.offline)
                console.log(`status: ${result.status}`);
            if (result.log) {
                console.log(result.log);
                console.log();
            }
        }
    
        if (output.includes("html") || output.includes("html:post")) {
            console.log(result.html);
            console.log();
        }
    }

    if (!result.ok) {
        console.error("ERRORS");
        console.error(JSON.stringify(result.errors, null, 2));
    }
}
