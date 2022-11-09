import * as fs from "async-file";
import * as yaml from "js-yaml";
import JSON5 from "json5";
import fetch from "node-fetch";
import { Action } from "syphonx-core";
import { combineUrl } from "./utilities.js";
import { yamlToJson } from "./yaml.js";

export interface Template {
    actions: Action[];
    url?: string;
    key?: string;
    params?: Record<string, unknown>;
    waitUntil?: string;
    timeout?: number;
}

const storageUrl = "https://storage.googleapis.com/syphonx/";

export async function loadTemplate(file: string): Promise<Template> {
    let text;
    if (file.startsWith("$")) {
        const url = combineUrl(storageUrl, file.slice(1));
        const response = await fetch(url);
        text = await response.text();
    }
    else {
        text = await fs.readTextFile(file);
    }

    if (file.endsWith(".json")) {
        const obj = JSON5.parse(text);
        return obj as Template;
    }
    else {
        const obj = yaml.load(text) as any;
        const template = yamlToJson(obj);
        return template;
    }
}

export async function fetchTemplate(file: string): Promise<string> {
    let text;
    if (file.startsWith("$")) {
        const url = combineUrl(storageUrl, file.slice(1));
        const response = await fetch(url);
        text = await response.text();
    }
    else {
        text = await fs.readTextFile(file);
    }
    return text;
}
