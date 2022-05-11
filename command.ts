#!/usr/bin/env node

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as uuid from "uuid";
import * as async from "async-parallel";
import { BigQuery } from "@google-cloud/bigquery";
import { fetch, FetchResult } from "./fetch.js";
import { extract } from "./extract.js";
import { loadJSON, parseArgs, sleep, subset, tryParseJSON } from "./common/index.js";
import { EventEmitter } from "events";

dotenv.config();

const bigquery = new BigQuery();

const args = parseArgs({
    optional: {
        0: "syphonx extract script file",
        1: "html file for offline processing",
        url: "specifies a url to fetch",
        show: "shows browser window",
        pause: "pause before or after extract",
        filter: "comma separated list of keys to filter output",
        offline: "force offline processing only",
        debug: "enable debug mode",
        id: "unique identifier for extract, autogenerated if not specified",
        query: "runs a query to obtain list of pages to fetch",
        after: "calls a procedure after all pages are fetched",
        onerror: "determines whether to insert data if there is an error (insert, skip, default=skip)",
        params: "override params",
        concurrency: "specifies number of pages to fetch concurrently",
        snooze: "time to snooze between pages from same domain",
        waituntil: "when to consider navigation complete: load, domcontentloaded, networkidle0, networkidle2",
        timeout: "navigation timeout in milliseconds (default=30000)",
        tag: "tags inserted data",
        out: "specifies output as default, html, json, bigquery",
    },
    validate: args => {
        if (!args[0] && args.out !== "html" && !args.query)
            return "Specify a script file";

        if (args.pause && !args.show)
            args.show = "1";
    }
});

interface QueryResult {
    url: string;
    key: string;
}

interface Script {
    actions: any;
    url: string;
    key: string;
    params: Record<string, unknown>;
    waitUntil?: string;
    timeout?: number;
}

const concurrency = parseInt(args.concurrency) || 1;
const emitter = new EventEmitter();
if (concurrency > emitter.getMaxListeners())
    emitter.setMaxListeners(concurrency);

(async () => {
    try {
        if (args.query) {
            const dataset = args.query.split(".")[0];
            const table = "syphonx";
            const query = args.query.includes(" ") ? args.query : `SELECT * FROM ${args.query}`; // extra fields pass as params to syphonx
            const response = await bigquery.query(query);
            const rows = response[0] as QueryResult[];
            console.log(`${rows.length} rows returned from ${args.query}`);

            const root = "./scripts"; //TODO: set root directory context based on config
            const scripts: Record<string, Script> = {};
            for (const key of Array.from(new Set(rows.map(row => row.key)))) {
                const file = path.resolve(`${root}${key}.json`);
                try {
                    scripts[key] = await loadJSON(file);
                    console.log(`SCRIPT LOADED: ${file}`);
                }
                catch (err) {
                    console.error(`SCRIPT ERROR: ${file}: ${err instanceof Error ? err.message : err}`);
                    process.exit(1);
                }
            }

            const ok = rows.every(row => {
                const script = scripts[row.key];
                if (!row.key && !script.key)
                    return false;
                else if (!row.url && !script.url)
                    return false;
                return true;
            });
            if (!ok) {
                console.error(`All rows must have a url and a key.`);
                process.exit(1);
            }

            let i = 0;
            let succeeded = 0;
            let failed = 0;
            let skipped = 0;
            const t0 = new Date().valueOf();
            await async.each(rows, async row => {
                const id = uuid.v4();
                const t1 = new Date().valueOf();
                const { url, key, ...params } = row;
                const script = scripts[key];
                try {
                    const result = await fetch({
                        ...script,
                        url,
                        params: { ...script.params, ...params, ...tryParseJSON(args.params, false) },
                        headless: !args.show,
                        pause: args.pause as any,
                        offline: !!args.offline,
                        waitUntil: args.waituntil || script.waitUntil as any,
                        timeout: parseInt(args.timeout) || script.timeout
                    });
                    if (result.ok || args.onerror === "insert") {
                        await bigquery.dataset(dataset).table(table).insert([{
                            timestamp: new Date(),
                            key,
                            id,
                            domain: result.domain,
                            url: result.url,
                            params: JSON.stringify(result.params),
                            data: JSON.stringify(result.data),
                            ok: result.ok,
                            online: result.online,
                            errors: result.errors,
                            tag: args.tag
                        }]);
                        succeeded += 1;
                        const t2 = new Date().valueOf();
                        console.log(`[${++i}/${rows.length}] ${id} inserted to ${dataset}.${table} (${t2 - t1}ms, ${result.ok ? "ok" : `${result.errors?.length} errors`})`);
                    }
                    else {
                        skipped += 1;
                        const t2 = new Date().valueOf();
                        console.log(`[${++i}/${rows.length}] ${url} skipped (${t2 - t1}ms)\n${result.errors?.map(error => JSON.stringify(error)).join("\n")}`);
                    }
                    if (args.snooze && concurrency === 1) {
                        console.log(`snoozing for ${args.snooze} seconds...`);
                        await sleep(parseInt(args.snooze) * 1000);
                    }
            }
                catch (err) {
                    console.error(`[${++i}/${rows.length}] ${url} error\n${err instanceof Error ? err.message : err}`);
                    failed += 1;
                }
            }, concurrency);
            const t3 = new Date().valueOf();
            console.log(`${succeeded} inserted, ${failed} failed, ${skipped} skipped (${((t3 - t0) / 60000).toFixed(1)} min)`);

            if (args.after && succeeded > 0) {
                const query = args.after.includes(" ") ? args.after : `CALL ${args.after}()`;
                console.log(`running after ${args.after}...`)
                await bigquery.query(query);
            }
            process.exit();
        }

        const script: Script = args[0] ? await loadJSON(args[0]) : { actions: [] };
        const url = args.url || script.url;
        if (!url) {
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
        if (!args[1]) {
            result = await fetch({
                url,
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
            const html = fs.readFileSync(args[1], "utf8");
            result = await extract({
                url,
                actions: script.actions,
                html
            });
        }

        if (args.out === "bigquery") {
            const id = args.id || uuid.v4();
            await bigquery.dataset(dataset).table(table).insert([{
                timestamp: new Date(),
                key: script.key,
                id,
                domain: result.domain,
                url: result.url,
                params: JSON.stringify(script.params),
                data: JSON.stringify(result.data),
                ok: result.ok,
                online: result.online,
                errors: result.errors,
                tag: args.tag
            }]);
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
                    console.log(`${result.errors?.length} ERRORS`);
                    console.error(JSON.stringify(result.errors, null, 2));
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        if (!args.show)
            process.exit(1);
    }
})();
