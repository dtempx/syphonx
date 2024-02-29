SyphonX is a tool that extracts data from HTML data, transforming it into JSON of any shape or size. It combines the power of CSS Selectors and jQuery, Regular Expressions, and Javascript into a declarative template format to elegantly solve the simplest to the most complex data extraction problems.

# Try it now from the Command-Line
Run the following from the command-line with Node.js v18 or higher...
```
npx syphonx run $/examples/weather.yaml
```

The above command should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.
```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```

[Learn more](documentation/get-started-cli.md)


# Try it now from Code
1. `npm init es6 -y` to create a new project
2. `yarn add syphonx` to install the syphonx dependency
3. `touch index.js` and add the code below to the file
```js
import * as syphonx from "syphonx"
const template = await syphonx.fetchTemplate("$/examples/weather.yaml")
const result = await syphonx.online(template)
console.log(result.data)
```
4. `node index.js` to run

This should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.

```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```
