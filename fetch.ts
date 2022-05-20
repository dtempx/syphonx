import puppeteer from "puppeteer";
import * as fs from "fs";
import * as cheerio from "cheerio";
import * as syphonx from "syphonx-core";
import * as path from "path";
import { fileURLToPath } from "url";
import { prompt } from "./common/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __jquery = fs.readFileSync(path.resolve(__dirname, "./jquery.slim.min.js"), "utf8");

export interface FetchOptions {
    url: string;
    actions: syphonx.Action[];
    params?: {};
    html?: boolean;
    debug?: boolean;
    pause?: "before" | "after" | "both";
    headless?: boolean;
    offline?: boolean;
    waitUntil?: puppeteer.PuppeteerLifeCycleEvent,
    timeout?: number;
}

export interface FetchResult extends syphonx.ExtractResult {
    status?: number;
    html?: string;
}

export async function fetch(options: FetchOptions): Promise<FetchResult> {
    let browser: puppeteer.Browser | undefined = undefined;
    let page: puppeteer.Page | undefined = undefined;
    try {
        browser = await puppeteer.launch({
            headless: options.headless,
            args: [
                "--no-sandbox", // required to run within some containers
                "--disable-web-security", // enable accessing cross-domain iframe's
                "--disable-dev-shm-usage", // workaround for "Target closed" errors when capturing screenshots https://github.com/GoogleChrome/puppeteer/issues/1790
            ],
        });
    
        page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36");
        await page.setExtraHTTPHeaders({"Accept-Language": "en-US,en"});
        await page.setViewport({ width: 1366, height: 768 });

        let status: number|undefined = undefined;
        await page.on("response", response => {
            if (response.url() === options.url) {
                status = response.status();
                //console.log(response.url(), response.status(), response.statusText());
            }
            
        });

        await page.goto(options.url, {
            waitUntil: options.waitUntil,
            timeout: options.timeout
        });
    
        if (["before", "both", "1"].includes(options.pause!) &&!options.headless) {
            await prompt("paused, hit enter to continue...");
        }
    
        let result: syphonx.ExtractResult | undefined = undefined;
        let html = undefined;
    
        if (!options.offline) {
            await page.evaluate(__jquery); // https://stackoverflow.com/questions/46987516/inject-jquery-into-puppeteer-page
            result = await page.evaluate(syphonx.extract, options as any);
            if (options.html) {
                html = await page.evaluate(() => document.querySelector("*")!.outerHTML);
            }
        }
        else {
            html = await page.evaluate(() => document.querySelector("*")!.outerHTML);
            const root = cheerio.load(html);
            result = await syphonx.extract({ ...options, root });
        }
    
        if (["after", "both", "1"].includes(options.pause!) && !options.headless) {
            await prompt("done, hit enter to continue...");
        }
        
        return { ...result, status, html };    
    }
    finally {
        if (page)
            await page.close();
        if (browser)
            await browser.close();
    }
}
