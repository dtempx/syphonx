import * as path from "path";
import * as async from "async-parallel";
import * as syphonx from "syphonx-lib";
import JSON5 from "json5";
import { BigQuery } from "@google-cloud/bigquery";
import { EventEmitter } from "events";
import { insert, online, loadTemplate, parseUrl, randomize, sleep } from "./lib/index.js";

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

    const dataset = args.query.split(".")[0]; // todo: specify dataset in config
    const table = "syphonx"; // todo: specify table in config
    const query = args.query.includes(" ") ? args.query : `SELECT * FROM ${args.query}`; // extra fields pass as params to syphonx
    const response = await bigquery.query(query);
    const rows = response[0] as QueryResult[];
    console.log(`${rows.length} rows returned from ${args.query}`);

    const root = "./scripts"; //TODO: set root directory context based on config
    const templates: Record<string, syphonx.Template> = {};
    for (const key of Array.from(new Set(rows.map(row => row.key)))) {
        const file = path.resolve(`${root}${key}.json`);
        try {
            templates[key] = await loadTemplate(file);
            console.log(`TEMPLATE LOADED: ${file}`);
        }
        catch (err) {
            console.error(`TEMPLATE ERROR: ${file}: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
            process.exit(1);
        }
    }

    const ok = rows.every(row => {
        const template = templates[row.key];
        if (!row.key && !template.key)
            return false;
        else if (!row.url && !template.url)
            return false;
        return true;
    });
    if (!ok) {
        console.error(`All rows must have a url and a key.`);
        process.exit(1);
    }

    const maxErrors = args.maxErrors ? parseInt(args.maxErrors) : Infinity;
    const maxConsecutiveErrors = args.maxConsecutiveErrors ? parseInt(args.maxConsecutiveErrors) : Infinity;
    
    const skip = args.skip ? parseInt(args.skip) : 0;
    const limit = args.limit ? parseInt(args.limit) : Infinity;

    let i = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    let errors = 0;
    let consecutiveErrors = 0;
    let retryCount = 0;
    let tmin = Infinity;
    let tmax = 0;
    let tavg = 0;

    const t0 = new Date().valueOf();
    try {
        await async.each(rows, async row => {
            if (i < (skip - 1) || i >= limit) {
                i += 1;
                return;
            }                
            if (errors >= maxErrors)
                return;
            if (consecutiveErrors >= maxConsecutiveErrors)
                return;
            const t1 = new Date().valueOf();
            const { url, ...params } = row;
            const template = templates[row.key];
            const key = template.key || "default";
            const tag = args.tag;
            try {
                const result = await online({
                    ...template,
                    url,
                    params: { ...template.params, ...params, ...(args.params ? JSON5.parse(args.params) : undefined) },
                    pause: args.pause === "1" ? "before" : (args.pause as "before" | "after" | "both" | undefined),
                    show: !!args.show,
                    timeout: parseInt(args.timeout) || template.timeout,
                    offline: !!args.offline,
                    retries: parseInt(args.retries) || 0,
                    onRetry: async ({ retry, retries, result }) => {
                        const a = args.snooze ? args.snooze.split(",").map(value => parseInt(value)) : [10, 60];
                        const t = randomize(a[0], a[1]);
                        const [error] = result.errors || [];
                        console.log(`ERROR ${url}\n${error?.message}\nRETRY #${retry}/${retries}, snoozing for ${Math.ceil(t)} seconds...`);
                        await sleep(t * 1000);
                        retryCount += 1;
                    }
                });
                if (result.ok || args.onerror === "insert") {
                    const t2 = new Date().valueOf();
                    const elapsed = t2 - t1;
                    const id = await insert({ dataset, table, url, key, tag, elapsed, result });
                    succeeded += 1;
                    console.log(`[${++i}/${rows.length}] ${url} inserted to ${dataset}.${table} key=${key} id=${id} elapsed=${((elapsed) / 1000).toFixed(1)}s${!result.ok ? ` (${result.errors?.length} errors)` : ""}`);
                    tmin = elapsed < tmin ? elapsed : tmin;
                    tmax = elapsed > tmax ? elapsed : tmax;
                    tavg = (tavg + elapsed) / 2;
                }
                else {
                    skipped += 1;
                    const t2 = new Date().valueOf();
                    console.log(`[${++i}/${rows.length}] ${url} elapsed=${((t2 - t1) / 1000).toFixed(1)}s SKIPPED\nERROR ${result.errors?.map(error => JSON.stringify(error)).join("\n")}`);
                }
    
                if (result.ok) {
                    consecutiveErrors = 0;
                }
                else {
                    errors += 1;
                    consecutiveErrors += 1;
                }
    
                if (args.snooze && concurrency === 1) {
                    const a = args.snooze.split(",").map(value => parseInt(value));
                    const t = randomize(a[0], a[1]);
                    if (t > 10)
                        console.log(`snoozing for ${Math.ceil(t)} seconds...`);
                    await sleep(t * 1000);
                }
            }
            catch (err) {
                console.log("ERROR", err);
                if (args.onerror === "insert") {
                    const { domain, origin } = parseUrl(url);
                    const result = {
                        url,
                        domain,
                        origin,
                        errors: [{
                            code: "external-error" as any,
                            message: err instanceof Error ? err.message : JSON.stringify(err),
                            level: 0
                        }],
                        ok: false
                    };
                    const id = await insert({ dataset, table, url, key, tag, result });
                    const t2 = new Date().valueOf();
                    console.log(`[${++i}/${rows.length}] ${url} inserted to ${dataset}.${table} key=${key} id=${id} elapsed=${((t2 - t1) / 1000).toFixed(1)}s failed\nERROR ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                }
                else {
                    console.error(`[${++i}/${rows.length}] ${url} failed\nERROR ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                }
                failed += 1;
            }
        }, concurrency);
    }
    catch (err) {
        console.error(`FATAL ERROR\n${JSON.stringify(err, null, 2)}`);
        process.exit(1);
    }

    if (errors > maxErrors)
        console.error(`${maxErrors} errors exceeded`);

    if (consecutiveErrors > maxConsecutiveErrors)
        console.error(`${maxConsecutiveErrors} consecutive errors exceeded`);

    const t3 = new Date().valueOf();
    console.log(`${succeeded} inserted, ${failed} failed, ${skipped} skipped, ${retryCount} retries, ${(tmin / 1000).toFixed(1)}s min, ${(tmax / 1000).toFixed(1)}s max, ${(tavg / 1000).toFixed(1)}s avg, ${Math.floor((t3 - t0) / 60000)} minutes total`);

    if (args.after && succeeded > 0) {
        const query = args.after.includes(" ") ? args.after : `CALL ${args.after}()`;
        console.log(`running after ${args.after}...`)
        await bigquery.query(query);
    }
}
