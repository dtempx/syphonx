import { default as runQuery } from "./run-query.js";
import { default as runUrl } from "./run-url.js";
import { parseArgs } from "./lib/index.js";

export default async function () {
    const args = parseArgs({
        optional: {
            0: "commmand",
            1: "template file",
            2: "html file for offline processing",
            url: "specifies a url to fetch",
            show: "shows browser window",
            pause: "pause before or after extract",
            filter: "comma separated list of keys to filter output",
            offline: "force offline processing only",
            id: "unique identifier for extract, autogenerated if not specified (ignored in query mode)",
            query: "runs a query to obtain list of pages to fetch",
            after: "calls a procedure after all pages are fetched",
            onerror: "determines whether to insert data if there is an error (insert, skip, default=skip)",
            params: "override params",
            concurrency: "specifies number of pages to fetch concurrently in query mode (default=1)",
            snooze: "time (in seconds) to snooze between pages from same domain in query mode, specify a number like '5,10' for a random interval, ignored if concurrency is specified, also used for retries",
            retries: "number of times to retry on a timeout in query mode (default=0)",
            maxErrors: "maximum number of errors before aborting in query mode (default=Infinity)",
            maxConsecutiveErrors: "maximum number of consecutive errors before aborting in query mode (default=Infinity)",
            skip: "number of rows returned in query mode to skip (default=0)",
            limit: "limit number of rows returned in query mode to process (default=Infinity)",
            timeout: "navigation timeout in milliseconds (default=30000)",
            tag: "tags inserted data",
            metadata: "include metadata in output data",
            out: "determines output (data, html, log), specify html:post for post transformed HTML",
            insert: "specifies to insert to configured data target (ignored in query mode)"
        },
        validate: args => {
            if (!args[1] && !args.query && !args.version)
                return "Specify a script file";
        }
    });
 
    if (args.query)
        await runQuery(args);
    else
        await runUrl(args);
}
