import { BigQuery } from "@google-cloud/bigquery";
import { ExtractResult } from "syphonx-core";
import { uid } from "./uid.js";
import { parseUrl } from "./utilities.js";

const bigquery = new BigQuery();

interface InsertParams {
    dataset: string;
    table: string;
    key: string;
    url?: string;
    id?: string;
    tag?: string;
    elapsed?: number;
    result: Partial<ExtractResult>
}

export default async function({ dataset, table, url, id = uid(), key, tag, elapsed, result }: InsertParams): Promise<string> {
    if (!url)
        url = result.url;
    const { domain } = parseUrl(url!);
    await bigquery.dataset(dataset).table(table).insert([{
        timestamp: new Date(),
        id,
        key,
        url,
        domain,
        elapsed,
        ok: result.ok,
        online: result.online,
        params: JSON.stringify(result.params),
        data: JSON.stringify(result.data),
        errors: result.errors,
        tag
    }]);
    return id;
}