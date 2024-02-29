import * as fs from "fs";

export function version(): string {
    const { version } = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    return version;
}
