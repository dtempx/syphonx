# Example 1: Run a template to extract from offline HTML content

1. `npm init es6 -y` to create a new project
2. `yarn add syphonx` to install the syphonx dependency
3. `touch index.js` and add the code below to the file
4. `node index.js` to run

This should print `hello` to the console.

```js
import * as syphonx from "syphonx";

(async () => {
    try {
        const template = {"actions":[{"select":[{"query":[["h1"]]}]}]};
        const result = await syphonx.offline({ html: "<html><h1>hello</h1></html>", ...template });
        console.log(result.data);
    }
    catch (err) {
        console.error(err);
    }
})();
```