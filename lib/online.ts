import playwright, { Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as cheerio from "cheerio";
import * as syphonx from "syphonx-lib";
import * as path from "path";
import { fileURLToPath } from "url";
import { default as prompt } from "./prompt.js";
import { evaluateFormula, omit, parseUrl, removeDOMRefs, sleep, ErrorMessage } from "./utilities.js";

// @ts-ignore error TS1343: The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', or 'nodenext'.
//const __jquery = fs.readFileSync(path.resolve(typeof __dirname === undefined ? fileURLToPath(new URL(".", import.meta.url)) : __dirname, "../jquery.slim.min.js"), "utf8");
const __jquery = fs.readFileSync(path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../dist/jquery.slim.min.js"), "utf8");

const defaults = {
    useragent: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    headers: { "Accept-Language": "en-US,en" },
    viewport: { width: 1366, height: 768 }
};

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
    proxy?: string;
    useragent?: string;
    headers?: Record<string, string>;
    viewport?: { width: number, height: number };
    waitUntil?: syphonx.DocumentLoadState;
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
    let browser: Browser | undefined = undefined;
    let context: BrowserContext | undefined = undefined;
    let page: Page | undefined = undefined;
    const headless = !show;
    const args = [
        "--no-sandbox", // required to run within some containers
        "--disable-web-security", // enable accessing cross-domain iframe's
        "--disable-dev-shm-usage", // workaround for "Target closed" errors when capturing screenshots https://github.com/GoogleChrome/puppeteer/issues/1790
    ];
    if (options.proxy)
        args.push(`--proxy-server=${options.proxy}`);

    try {
        browser = await playwright.chromium.launch({ headless, args });
        context = await browser.newContext({ userAgent: options.useragent || defaults.useragent });
        page = await context.newPage();
        await page.setExtraHTTPHeaders({ ...defaults.headers, ...options.headers });
        await page.setViewportSize(options.viewport || defaults.viewport);

        let status = 0;
        await page.on("response", response => {
            if (response.url() === originalUrl) {
                status = response.status();
            }
        });

        const timeout = typeof options.timeout === "number" ? options.timeout * 1000 : undefined;
        const waitUntil = options.waitUntil;
        await page.goto(originalUrl, { timeout, waitUntil });
        if (waitUntil)
            await page.waitForURL(originalUrl, { timeout, waitUntil });

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
            if (state.yield.params?.waitUntil)
                await page.waitForLoadState(state.yield.params.waitUntil, { timeout: state.yield.timeout || timeout });
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
        let code: syphonx.ExtractErrorCode = "external-error";
        let message = err instanceof Error ? err.message : JSON.stringify(err);
        let level = 0;

        if (message === "Protocol error (Runtime.callFunctionOn): Execution context was destroyed.") {
            level = 1;
        }
        else if (message.startsWith("net::ERR_NO_SUPPORTED_PROXIES")) {
            message = "Unsupported proxy URL. Passing username and password in proxy URL is not supported.";
        }

        const { domain, origin } = parseUrl(originalUrl);
        return {
            ok: false,
            url: originalUrl,
            domain,
            origin,
            errors: [{ code, message, level }],
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
