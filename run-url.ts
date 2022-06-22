import * as fs from "fs";
import { extract, fetch, loadJSON, subset, insert, FetchResult, Script } from "./common/index.js";

export default async function (args: Record<string, string>): Promise<void> {
    const script: Script = args[1] ? await loadJSON(args[1]) : { actions: [] };
    const url = args.url || script.url;
    if (!url && !args[2]) {
        console.log("url not specified");
        process.exit(1);
    }

    const dataset = script.key ? script.key.split("/").filter(text => text.length > 0)[0] : "";
    const table = "syphonx";
    if (!dataset && args.out === "bigquery") {
        console.log("invalid or undefined script key required for insert");
        process.exit(1);
    }

    let result: FetchResult;
    if (!args[2]) {
        result = await fetch({
            url: url!,
            actions: script.actions,
            headless: !args.show,
            pause: args.pause as any,
            offline: !!args.offline,
            waitUntil: args.waituntil || script.waitUntil as any,
            timeout: parseInt(args.timeout) || script.timeout,
            html: args.out === "html",
            debug: !!args.debug
        });
    }
    else {
        const html = fs.readFileSync(args[2], "utf8");
        result = await extract({
            url,
            actions: script.actions,
            html
        });
    }

    if (args.insert) {
        const id = await insert({ dataset, table, key: script.key || "default", tag: args.tag, result });
        console.log(`${id} inserted to ${dataset}.${table}`);
    }
    else if (args.out === "json") {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        if (args.out === "html") {
            console.log(result.html);
        }

        if (script.actions.length > 0) {
            const data = args.filter && typeof result.data === "object" && result.data !== null ? 
            subset(result.data as Record<string, unknown>, args.filter.split(",").map(value => value.trim())) : result.data;

            console.log();
            console.log(JSON.stringify({ url, domain: result.domain, data }, null, 2));

            if (!!args.debug) {
                console.log();
                console.log("DEBUG");
                console.log(result.log);
            }

            if (!result.ok) {
                console.log();
                console.log("ERRORS");
                console.error(JSON.stringify(result.errors, null, 2));
            }
        }
    }
}
