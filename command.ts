#!/usr/bin/env node

import * as dotenv from "dotenv";
import { default as run } from "./run.js";

dotenv.config();

const command = process.argv[2];
const help = `Usage: syphonx <command> [<args>]
Available commands:
  run      runs a script to syphon data from a webpage

syhponx <command> --help for more information on a specific command
`;

if (process.argv.length < 3 || command === "--help") {
    console.log(help);
    process.exit();
}

(async () => {
    try {
        if (command === "run") {
            await run();
        }
        else {
            console.error("invalid command");
            console.log(help);
        }
        process.exit();
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
})();
