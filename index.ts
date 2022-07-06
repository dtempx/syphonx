import { Action } from "syphonx-core";
import { extract, fetch, FetchResult } from "./common/index.js";

export { ExtractResult } from "syphonx-core";
export * from "./load.js";

export interface RunOptions {
    url: string;
    actions: Action[];
    html?: string;
}

export interface RunResult extends FetchResult {
}

export async function run({ url, actions, html }: RunOptions): Promise<RunResult> {
    if (!html) {
        const result = await fetch({
            url,
            actions,
            headless: false,
            pause: undefined,
            offline: false,
            waitUntil: undefined,
            timeout: undefined,
            html: false,
            debug: false
        });
        return result;
    }
    else {
        const result = await extract({
            url,
            actions,
            html
        });
        return result;
    }
}