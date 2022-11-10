import { BigQuery } from "@google-cloud/bigquery";
import { ExtractResult } from "syphonx-core";
import { uid } from "./uid.js";

const bigquery = new BigQuery();

interface InsertParams {
    dataset: string;
    table: string;
    key: string;
    id?: string;
    tag?: string;
    result: Partial<ExtractResult>
}

export default async function({ dataset, table, id = uid(), key, tag, result }: InsertParams): Promise<string> {
    await bigquery.dataset(dataset).table(table).insert([{
        timestamp: new Date(),
        id,
        key,
        domain: result.domain,
        url: result.url,
        params: JSON.stringify(result.params),
        data: JSON.stringify(result.data),
        ok: result.ok,
        online: result.online,
        errors: result.errors,
        tag
    }]);
    return id;
}