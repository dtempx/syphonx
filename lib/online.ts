import puppeteer from "puppeteer";
import * as fs from "fs";
import * as cheerio from "cheerio";
import * as syphonx from "syphonx-lib";
import * as path from "path";
import { fileURLToPath } from "url";
import { default as prompt } from "./prompt.js";
import { evaluateFormula, omit, parseUrl, removeDOMRefs, sleep, ErrorMessage } from "./utilities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __jquery = fs.readFileSync(path.resolve(__dirname, "../jquery.slim.min.js"), "utf8");

const defaults = {
    useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
    headers: { "Accept-Language": "en-US,en" },
    viewport: { width: 1366, height: 768 }
};

function asPuppeteerLifeCycleEvent(state: syphonx.DocumentLoadState | syphonx.DocumentLoadState[] | undefined): puppeteer.PuppeteerLifeCycleEvent | puppeteer.PuppeteerLifeCycleEvent[] | undefined {
    if (state instanceof Array)
        return state.map(value => asPuppeteerLifeCycleEvent(value) as puppeteer.PuppeteerLifeCycleEvent);
    else if (state === "load")
        return "load";
    else if (state === "domcontentloaded")
        return "domcontentloaded";
    else if (state === "networkidle")
        return "networkidle2";
    else if (state === "none")
        return undefined;
    else
        return "load";
}

export interface RetryParams {
    retry: number;
    retries: number;
    result: Partial<syphonx.ExtractResult>;
}

export interface OnlineOptions {
    actions: syphonx.Action[];
    url: string;
    params?: Record<string, unknown>;
    vars?: Record<string, unknown>;
    show?: boolean;
    pause?: "before" | "after" | "both";
    debug?: boolean;
    timeout?: number; // seconds
    offline?: boolean;
    useragent?: string;
    headers?: Record<string, string>;
    viewport?: { width: number, height: number };
    waitUntil?: syphonx.DocumentLoadState | syphonx.DocumentLoadState[] | undefined;
    includeDOMRefs?: boolean;
    outputTransformedHTML?: boolean;
    retries?: number;
    onRetry?: (params: RetryParams) => Promise<void>;
}

export async function online({ retries = 0, onRetry, ...options}: OnlineOptions): Promise<Partial<syphonx.ExtractResult>> {
    let result = {} as Partial<syphonx.ExtractResult>;
    let retry = 0;
    while (retry <= retries) {
        result = await tryOnline(options);
        if (result.ok)
            break;
        if (retry >= retries || result.errors?.some(error => error.level <= 0))
            break;
        if (onRetry)
            await onRetry({ retry: ++retry, retries, result });
        else
            await sleep(++retry === 1 ? 5000 : 30000);
    }
    return result;
}

async function tryOnline({ show = false, pause, includeDOMRefs = false, outputTransformedHTML = false, ...options }: OnlineOptions): Promise<Partial<syphonx.ExtractResult>> {
    if (!options.url || typeof options.url !== "string")
        throw new ErrorMessage("url not specified");
    if (!options.vars)
        options.vars = {};

    const originalUrl = evaluateFormula(`\`${options.url}\``, options.params) as string;
    let browser: puppeteer.Browser | undefined = undefined;
    let page: puppeteer.Page | undefined = undefined;
    try {
        browser = await puppeteer.launch({
            headless: !show,
            args: [
                "--no-sandbox", // required to run within some containers
                "--disable-web-security", // enable accessing cross-domain iframe's
                "--disable-dev-shm-usage", // workaround for "Target closed" errors when capturing screenshots https://github.com/GoogleChrome/puppeteer/issues/1790
            ],
        });

        page = await browser.newPage();
        await page.setUserAgent(options.useragent || defaults.useragent);
        await page.setExtraHTTPHeaders({ ...defaults.headers, ...options.headers });
        await page.setViewport(options.viewport || defaults.viewport);

        let status = 0;
        await page.on("response", response => {
            if (response.url() === originalUrl) {
                status = response.status();
            }
        });

        const timeout = typeof options.timeout === "number" ? options.timeout * 1000 : undefined;
        const waitUntil = asPuppeteerLifeCycleEvent(options.waitUntil);
        await page.goto(originalUrl, { timeout, waitUntil });
        options.vars.__status = status;
        await page.evaluate(__jquery);

        if (["before", "both"].includes(pause!) && show)
            await prompt("paused, hit enter to continue...");
    
        if (options.offline) {
            const html = await page.evaluate(() => document.querySelector("*")!.outerHTML);
            const root = cheerio.load(html);
            const result = await syphonx.extract({ ...options, root, url: originalUrl } as syphonx.ExtractState);
            return {
                ...result,
                ok: result.errors.length === 0,
                status: 0,
                online: false,
                originalUrl,
                html: root.html(),
                data: includeDOMRefs ? result.data : removeDOMRefs(result.data)
            };
        }

        let html = "";
        if (!outputTransformedHTML)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        let { url, domain, origin, ...state } = await page.evaluate(syphonx.extract, options as any);
        while (state.yield) {
            await page.waitForNavigation({
                timeout: state.yield.timeout ? state.yield.timeout : timeout,
                waitUntil: state.yield.waitUntil ? asPuppeteerLifeCycleEvent(state.yield.waitUntil) : waitUntil
            });
            await page.evaluate(__jquery);
            state.yield === undefined;
            state.vars.__status = status;
            if (["before", "both"].includes(pause!) && show)
                await prompt(`paused at step #${state.yield?.step}, hit enter to continue...`);
            state = await page.evaluate(syphonx.extract, state as any);
        }

        if (outputTransformedHTML)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        if (["after", "both"].includes(pause!) && show)
            await prompt("done, hit enter to continue...");

        return {
            ...omit(state, "actions"),
            ok: state.errors.length === 0,
            status,
            url,
            domain,
            origin,
            originalUrl,
            html,
            online: true,
            data: includeDOMRefs ? state.data : removeDOMRefs(state.data)
        };    
    }
    catch (err) {
        const { domain, origin } = parseUrl(originalUrl);
        return {
            ok: false,
            url: originalUrl,
            domain,
            origin,
            errors: [{
                code: "external-error",
                message: err instanceof Error ? err.message : JSON.stringify(err),
                level: 1
            }],
            online: true
        };
    }
    finally {
        if (page)
            await page.close();
        if (browser)
            await browser.close();
    }
}
