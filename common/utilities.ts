export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
