import { Action } from "syphonx-core";

export interface Script {
    actions: Action[];
    url?: string;
    key?: string;
    params?: Record<string, unknown>;
    waitUntil?: string;
    timeout?: number;
}
