import * as syphonx from "syphonx-lib";
import * as fs from "fs";
import JSON5 from "json5";
import { insert, loadTemplate, offline, online, subset } from "./lib/index.js";

export default async function (args: Record<string, string>): Promise<void> {
    //todo: refactor to use api to load the template
    const template: syphonx.Template = args[1] ? await loadTemplate(args[1]) : { actions: [] };
    const url = args.url || template.url;
    if (!url && !args[2]) {
        console.log("url not specified");
        process.exit(1);
    }

    const output = args.out ? args.out.split(",") : ["data"];
    const debug = output.includes("log");
    const params = { ...template.params, ...(args.params ? JSON5.parse(args.params) : undefined) };

    const dataset = (template as any).key ? (template as any).key.split("/").filter((text: string) => text.length > 0)[0] : ""; //todo: remove key from template
    const table = "syphonx";

    const t1 = new Date().valueOf();
    let result: Partial<syphonx.ExtractResult>;
    if (!args[2]) {
        const pause = args.pause === "1" ? "before" : (args.pause as "before" | "after" | "both" | undefined);
        const show = !!args.show || !!pause;
        result = await online({
            ...template,
            url: url!,
            params,
            show,
            pause,
            debug,
            proxy: args.proxy,
            timeout: parseInt(args.timeout) || template.timeout,
            offline: !!args.offline,
            includeDOMRefs: !!args.metadata,
            outputTransformedHTML: output.includes("html:post")
        });
    }
    else {
        const html = fs.readFileSync(args[2], "utf8");
        result = await offline({
            ...template,
            html,
            url,
            params,
            debug,
            includeDOMRefs: !!args.metadata
        });
    }

    if (args.insert) {
        if (result.ok || args.onerror === "insert") {
            const t2 = new Date().valueOf();
            const elapsed = t2 - t1;
            //todo: url has a "view-source:" prefix here for akerman/people
            const id = await insert({ dataset, table, url, key: (template as any).key || "default", tag: args.tag, elapsed, result }); // todo: remove key from template
            console.log(`${url} inserted to ${dataset}.${table} key=${(template as any).key} id=${id} elapsed=${((elapsed) / 1000).toFixed(1)}s${!result.ok ? ` (${result.errors?.length} errors)` : ""}`);
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
                console.log(JSON.stringify(result.vars));
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
