import playwright, { Browser, BrowserContext, Page } from "playwright";
import * as syphonx from "syphonx-lib";
import { default as prompt } from "./prompt.js";

import {
    evaluateFormula,
    omit,
    parseUrl,
    sleep,
    ErrorMessage
}
from "./utilities.js";

import {
    invokeAsyncMethod,
    ExtractState,
    SyphonXApi
}
from "syphonx-lib";

const script = new Function('state', `return ${syphonx.script}(state)`) as (state: ExtractState) => ExtractState;

const defaults = {
    useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
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
        if (retry >= retries || result.errors?.some((error: any) => error.level <= 0)) //todo: why is errors of type any?
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

    const originalUrl = encodeURI(evaluateFormula(`\`${options.url}\``, { params: options.params }) as string);
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

        if (["before", "both"].includes(pause!) && show)
            await prompt("paused, hit enter to continue...");

        let html: string | undefined = undefined;
        if (options.offline)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        const api = new SyphonXApi();
        const result = await api.run({
            template: options,
            url: originalUrl,
            html,
            unwrap: !includeDOMRefs,
            onExtract: async state => {
                const result = await page!.evaluate<ExtractState, ExtractState>(script, state);
                return result;
            },
            onGoback: async ({ timeout, waitUntil }) => {
                const response = await page!.goBack({ timeout, waitUntil });
                const status = response?.status();
                return { status };
            },
            onHtml: async () => {
                const html = await page!.evaluate(() => document.querySelector("*")!.outerHTML);
                return html;
            },
            onLocator: async ({ frame, selector, method, params }) => {
                let locator = undefined as playwright.Locator | undefined;
                if (frame)
                    locator = await page!.frameLocator(frame).locator(selector);
                else
                    locator = await page!.locator(selector);
        
                const result = await invokeAsyncMethod(locator, method, params);
                return result;
            },
            onNavigate: async ({ url, timeout, waitUntil }) => {
                const response = await page!.goto(url, { timeout, waitUntil });
                const status = response?.status();
                return { status };
            },
            onReload: async ({ timeout, waitUntil }) => {
                const response = await page!.reload({ timeout, waitUntil });
                const status = response?.status();
                return { status };
            },
            onScreenshot: async ({ selector, fullPage, ...options }) => {
                const path = `./screenshots/${new Date().toLocaleString("en-US", { hour12: false }).replace(/:/g, "-").replace(/\//g, "-").replace(/,/g, "")}.png`;
                let clip: { x: number, y: number, height: number, width: number } | undefined = undefined;
                if (selector)
                    clip = await page!.evaluate(() => document.querySelector(selector)?.getBoundingClientRect());
                await page!.screenshot({ ...options, path, clip, fullPage });
            },
            onYield: async ({ timeout, waitUntil }) => {
                await page!.waitForLoadState(waitUntil, { timeout });
            }
        });

        if (outputTransformedHTML)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        if (["after", "both"].includes(pause!) && show)
            await prompt("done, hit enter to continue...");

        return {
            ...omit(result, "actions"),
            ok: result.errors.length === 0,
            status,
            url: result.url,
            domain: result.domain,
            origin: result.origin,
            originalUrl,
            html,
            online: !options.offline,
            data: result.data
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
