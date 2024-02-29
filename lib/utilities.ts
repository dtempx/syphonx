export class ErrorMessage {
    message: string;
    constructor(message: string) {
        this.message = message;
    }
}

export function combineUrl(url: string, path: string): string {
    if (url && path) {
        return `${rtrim(url, "/")}/${ltrim(path, "/")}`;
    }
    else if (url) {
        return url;
    }
    else if (path) {
        return path;
    }
    else {
        return "";
    }
}

export function evaluateFormula(expression: string, args: Record<string, unknown> = {}): unknown {
    const keys = Object.keys(args);
    const values = keys.map(key => args[key]);
    const fn = new Function(...keys, `return ${expression}`);
    const result = fn(...values);
    return result;
}

export function empty(value: unknown): boolean {
    if (value === undefined)
        return true;
    else if (value === null)
        return true;
    else if (value === "")
        return true;
    else if (value instanceof Date)
        return false;
    else if (value instanceof Array)
        return value.length === 0;
    else if (typeof value === "object")
        return Object.keys(value).length === 0;
    else
        return false;
}

export function isObject(obj: unknown): boolean {
    return typeof obj === "object" && obj !== null && !(obj instanceof Array) && !(obj instanceof Date);
}

export function omit<T extends object, K extends [...(keyof T)[]]>(obj: T, ...keys: K): { [K2 in Exclude<keyof T, K[number]>]: T[K2] } {
    const result = {} as { [K in keyof typeof obj]: (typeof obj)[K] };
    let key: keyof typeof obj;
    for (key in obj)
        if (!(keys.includes(key)))
            result[key] = obj[key];
    return result;
}

export function parseUrl(url: string): { domain?: string, origin?: string } {
    if (url.startsWith("view-source:"))
        url = url.slice(12);
    if (/^https?:\/\//.test(url)) {
        const [protocol, , host] = url.split("/");
        const a = host.split(":")[0].split(".").reverse();
        return {
            domain: a.length >= 3 && a[0].length === 2 && a[1].length === 2 ? `${a[2]}.${a[1]}.${a[0]}` : a.length >= 2 ? `${a[1]}.${a[0]}` : undefined,
            origin: protocol && host ? `${protocol}//${host}` : undefined
        };    
    }
    return {};
}

export function randomize(low: number, high?: number): number {
    const r = Math.random();
    if (high && high > low)
        return low + r * (high - low);
    else
        return low * r;
}

export function subset(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const result = {} as Record<string, unknown>;
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result;
}

export function ltrim(text: string, pattern: string): string {
    while (text.startsWith(pattern)) {
        text = text.slice(pattern.length);
    }
    return text;
}

export function rtrim(text: string, pattern: string): string {
    while (text.endsWith(pattern)) {
        text = text.slice(0, -1 * pattern.length)
    }
    return text;
}

export function removeDOMRefs(obj: unknown): unknown {
    if (obj instanceof Array) {
        return obj.map(item => removeDOMRefs(item));
    }
    else if (isObject(obj) && typeof (obj as {}).hasOwnProperty === "function" && (obj as {}).hasOwnProperty("value")) {
        return removeDOMRefs((obj as { value: unknown }).value);
    }
    else if (isObject(obj)) {
        const source = obj as Record<string, unknown>;
        const target = {} as Record<string, unknown>;
        for (const key of Object.keys(obj as {})) {
            if (isObject(source[key]) && typeof (source[key] as {}).hasOwnProperty === "function" && (source[key] as {}).hasOwnProperty("value")) {
                target[key] = removeDOMRefs((source[key] as { value: unknown }).value); // unwrap value
            }
            else {
                target[key] = removeDOMRefs(source![key]);
            }
        }
        return target;
    }
    else {
        return obj;
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
