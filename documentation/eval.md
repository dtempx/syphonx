```
const { data, ...extra } = params;
const context = this.context();
const args = {
    ...this.state.vars,
    ...this.state,
    ...context,
    data: removeDOMRefs(merge(this.state.data, data)),
    ...extra
} as Record<string, unknown>;
```

```
...this.state.vars,
    __instance
    __context
```

```
...this.state
    url
    domain
    origin
    params
    errors
    debug
    log
    vars
```

```
...context
    Array<{ name: string, value: unknown, parent: {...} }>
```
