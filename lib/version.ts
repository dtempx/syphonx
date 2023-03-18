import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export function version(): string {
    // @ts-ignore error TS1343: The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', or 'nodenext'.
    //const { version } = JSON.parse(fs.readFileSync(path.resolve(typeof require === undefined ? fileURLToPath(new URL(".", import.meta.url)) : __dirname, "../package.json"), "utf8"));
    const { version } = JSON.parse(fs.readFileSync(path.resolve(typeof __dirname === undefined ? fileURLToPath(new URL(".", import.meta.url)) : eval("__dirname"), "../package.json"), "utf8"));
    return version;
}
