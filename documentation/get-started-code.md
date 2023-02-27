# Example 1: Extract data from a web page online

1. `npm init es6 -y` to create a new project
2. `yarn add syphonx` to install the syphonx dependency
3. `touch index.js` and add the code below to the file
```js
(async () => {
    try {
        const template = await syphonx.fetchTemplate("$/examples/weather.yaml");
        const result = await syphonx.online(template);
        console.log(result.data);
    }
    catch (err) {
        console.error(err);
    }
})();
```
4. `node index.js` to run

This should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.

```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```


# More
* [Extract data from raw HTML offline](get-started-code-2.md)
* [FAQ](faq.md)

[Go back](../README.md)