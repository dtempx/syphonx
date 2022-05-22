import * as cheero from "cheerio";
import * as syphonx from "syphonx-core";

interface ExtractOptions {
    html: string;
    url: string;
    actions: syphonx.Action[];
}

export async function extract({ html, url, actions }: ExtractOptions): Promise<syphonx.ExtractResult> {
    const root = cheero.load(html);
    const result = await syphonx.extract({ url, actions, root });
    return result;
}
