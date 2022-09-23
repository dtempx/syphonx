import puppeteer from "puppeteer";
import * as fs from "fs";
import * as cheerio from "cheerio";
import * as syphonx from "syphonx-core";
import * as path from "path";
import { fileURLToPath } from "url";
import { default as prompt } from "./prompt.js";
import { removeDOMRefs } from "./utilities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __jquery = fs.readFileSync(path.resolve(__dirname, "../jquery.slim.min.js"), "utf8");

const defaultBrowserOptions = {
    useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    headers: { "Accept-Language": "en-US,en" },
    viewport: { width: 1366, height: 768 }
};

interface BrowserOptions {
    useragent?: string;
    headers?: Record<string, string>;
    viewport?: { width: number, height: number };
}

interface OnlineOptions {
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
}

export async function online({ show = false, pause, includeDOMRefs = false, outputTransformedHTML = false, browserOptions, offline, timeout, ...options }: OnlineOptions): Promise<syphonx.ExtractResult> {
    if (!options.url)
        throw new Error("url not specified");
    if (!options.vars)
        options.vars = {};

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
            if (response.url() === options.url) {
                status = response.status();
            }
        });

        await page.goto(options.url, { waitUntil: "load", timeout });
        options.vars._http_status = status;
        await page.evaluate(__jquery);

        if (["before", "both"].includes(pause!) && show)
            await prompt("paused, hit enter to continue...");
    
        if (offline) {
            const html = await page.evaluate(() => document.querySelector("*")!.outerHTML);
            const root = cheerio.load(html);
            const result = await syphonx.extract({ ...options, root } as syphonx.ExtractState);
            return {
                ...result,
                ok: result.errors.length === 0,
                status: 0,
                online: false,
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
            state.vars._http_status = status;
            state = await page.evaluate(syphonx.extract, state as any);
        }

        if (outputTransformedHTML)
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);

        if (["after", "both"].includes(pause!) && show)
            await prompt("done, hit enter to continue...");

        return {
            ...state,
            ok: state.errors.length === 0,
            status,
            url,
            domain,
            origin,
            html,
            online: true,
            data: includeDOMRefs ? state.data : removeDOMRefs(state.data)
        };    
    }
    finally {
        if (page)
            await page.close();
        if (browser)
            await browser.close();
    }
}
