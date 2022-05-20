#!/usr/bin/env node

import * as dotenv from "dotenv";
import { default as get } from "./get.js";

dotenv.config();

const command = process.argv[2];
const help = `Usage: syphonx <command> [<args>]
Available commands:
  get      gets a webpage and extracts data

syhponx <command> --help for more information on a specific command
`;

if (process.argv.length < 3 || command === "--help") {
    console.log(help);
    process.exit();
}

(async () => {
    try {
        if (command === "get") {
            await get();
        }
        else {
            console.error("invalid command");
            console.log(help);
        }
        process.exit();
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
    }
})();
