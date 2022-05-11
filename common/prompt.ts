import * as readline from "readline";

export default function(message: string): Promise<string> {
    const stdio = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise<string>(resolve =>
        stdio.question(message, response => {
            resolve(response);
            stdio.close();
        }));
}
