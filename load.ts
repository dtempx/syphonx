import { loadJSON, Script } from "./common/index.js";

export async function load(file: string): Promise<Script> {
    const script = await loadJSON(file);
    // todo: validate against schema
    return script;
}
