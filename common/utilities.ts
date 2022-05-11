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

export function subset(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const result = {} as Record<string, unknown>;
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result;
}
