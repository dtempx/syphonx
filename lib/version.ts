import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export function version(): string {
    const { version } = JSON.parse(fs.readFileSync(path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../package.json"), "utf8"));
    return version;
}
