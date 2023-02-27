# Example 2: Extract data from raw HTML offline

1. `npm init es6 -y` to create a new project
2. `yarn add syphonx` to install the syphonx dependency
3. `touch index.js` and add the code below to the file
```js
import * as syphonx from "syphonx";

(async () => {
    try {
        const template = {"actions":[{"select":[{"query":[["h1"]]}]}]};
        const result = await syphonx.offline({ html: "<html><h1>Hello world!</h1></html>", ...template });
        console.log(result.data);
    }
    catch (err) {
        console.error(err);
    }
})();
```
4. `node index.js` to run

This should print `Hello world!` to the console.


# More
* [FAQ](faq.md)

[Go back](../README.md)
