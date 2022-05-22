import * as uuid from "uuid";
import { BigQuery } from "@google-cloud/bigquery";
import { ExtractResult } from "syphonx-core";

const bigquery = new BigQuery();

interface InsertParams {
    dataset: string;
    table: string;
    key: string;
    id?: string;
    tag?: string;
    result: ExtractResult
}

export default async function({ dataset, table, id = uuid.v4(), key, tag, result }: InsertParams): Promise<string> {
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