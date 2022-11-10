import { customAlphabet } from "nanoid/non-secure";

// https://zelark.github.io/nano-id-cc/
// ~448 years needed in order to have a 1% probability of at least one collision at a rate of 1M identifiers generated per hour
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 15);

export function uid() {
    return nanoid();    
}
