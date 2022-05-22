export interface Script {
    actions: any;
    url: string;
    key: string;
    params: Record<string, unknown>;
    waitUntil?: string;
    timeout?: number;
}
