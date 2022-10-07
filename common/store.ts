import { Script } from "./script.js";
import { combineUrl, loadJSON } from "./index.js";
import fetch from "node-fetch";

const storageUrl = "https://storage.googleapis.com/syphonx/";

export async function load(file: string): Promise<Script> {
    if (file.startsWith("$")) {
        const url = combineUrl(storageUrl, file.slice(1));
        const response = await fetch(url);
        const data = await response.json();
        return data as Script;
    }
    else {
        const data = await loadJSON(file);
        return data as Script;
    }
}