import puppeteer from "puppeteer";
import * as fs from "fs";
import * as cheerio from "cheerio";
import * as syphonx from "syphonx-core";
import * as path from "path";
import { fileURLToPath } from "url";
import { default as prompt } from "./prompt.js";
import { evaluateFormula, omit, parseUrl, removeDOMRefs, sleep, ErrorMessage } from "./utilities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __jquery = fs.readFileSync(path.resolve(__dirname, "../jquery.slim.min.js"), "utf8");

const defaultBrowserOptions = {
    useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    headers: { "Accept-Language": "en-US,en" },
    viewport: { width: 1366, height: 768 }
};

export interface BrowserOptions {
    useragent?: string;
    headers?: Record<string, string>;
    viewport?: { width: number, height: number };
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
    timeout?: number;
    offline?: boolean;
    browserOptions?: BrowserOptions;
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
        if (retry >= retries || !result.errors?.some(error => ["select-timeout", "external-error", "waitfor-timeout"].includes(error.code)))
            break;
        if (onRetry)
            await onRetry({ retry: ++retry, retries, result });
        else
            await sleep(++retry === 1 ? 5000 : 30000);
    }
    return result;
}

async function tryOnline({ show = false, pause, includeDOMRefs = false, outputTransformedHTML = false, browserOptions, offline, timeout, ...options }: OnlineOptions): Promise<Partial<syphonx.ExtractResult>> {
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
        const { useragent, headers, viewport } = { ...defaultBrowserOptions, ...browserOptions };
        await page.setUserAgent(useragent);
        await page.setExtraHTTPHeaders(headers);
        await page.setViewport(viewport);

        let status = 0;
        await page.on("response", response => {
            if (response.url() === originalUrl) {
                status = response.status();
            }
        });

        await page.goto(originalUrl, { waitUntil: "load", timeout });
        options.vars.__http_status = status;
        await page.evaluate(__jquery);

        if (["before", "both"].includes(pause!) && show)
            await prompt("paused, hit enter to continue...");
    
        if (offline) {
            const html = await page.evaluate(() => document.querySelector("*")!.outerHTML);
            const root = cheerio.load(html);
            const result = await syphonx.extract({ ...options, root, url: originalUrl } as syphonx.ExtractState);
            return {
                ...result,
                ok: result.errors.length === 0,
                status: 0,
                online: false,
                //originalUrl,
                html: root.html(),
                data: includeDOMRefs ? result.data : removeDOMRefs(result.data)
            };
        }

        let html = "";
        if (!outputTransformedHTML)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        let { url, domain, origin, ...state } = await page.evaluate(syphonx.extract, options as any);
        while (state.yield) {
            await page.waitForNavigation({ waitUntil: "load", timeout: state.yield.timeout });
            state.yield === undefined;
            state.vars.__http_status = status;
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
            //originalUrl,
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
                code: "external-error" as any,
                message: err instanceof Error ? err.message : JSON.stringify(err)
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
