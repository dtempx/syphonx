import * as path from "path";
import * as async from "async-parallel";
import { BigQuery } from "@google-cloud/bigquery";
import { EventEmitter } from "events";
import { fetch, loadJSON, sleep, insert, tryParseJSON, Script } from "./common/index.js";

const bigquery = new BigQuery();

interface QueryResult {
    url: string;
    key: string;
}

export default async function (args: Record<string, string>): Promise<void> { 
    const concurrency = parseInt(args.concurrency) || 1;
    const emitter = new EventEmitter();
    if (concurrency > emitter.getMaxListeners())
        emitter.setMaxListeners(concurrency);

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
                const id = await insert({ dataset, table, key: script.key || "default", tag: args.tag, result });
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
}
