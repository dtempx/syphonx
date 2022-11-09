import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function version(): string {
    const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));
    return version;
}
