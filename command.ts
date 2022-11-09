#!/usr/bin/env node

import * as dotenv from "dotenv";
import { default as run } from "./run.js";
import { default as view } from "./view.js";
import { default as pull } from "./pull.js";
import { version } from "./lib/index.js";

dotenv.config();

const command = process.argv[2];
const help = `Usage: syphonx <command> [<args>]
Available commands:
  run      Runs a script to syphon data from a webpage
  view     Views a script from the cloud
  pull     Pull templates from the cloud

syhponx <command> --help  for more information on a specific command
syphonx --version  displays the current syphonx version
`;

if (process.argv[2] === "--version") {
    console.log(version());
    process.exit();
}

if (process.argv.length < 3 || command === "--help") {
    console.log(help);
    process.exit();
}

(async () => {
    try {
        if (command === "run") {
            await run();
        }
        else if (command === "view") {
            await view();
        }
        else if (command === "pull") {
            await pull();
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
