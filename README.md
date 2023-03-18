SyphonX is the easiest way to extract data from any website without coding.

# Get Started

## From the Command-Line

Run the following from the command-line with Node.js v18 or higher...
```
npx syphonx run $/examples/weather.yaml
```

The above command should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.
```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```

## From Code

1. `npm init es6 -y` to create a new project
2. `yarn add syphonx` to install the syphonx dependency
3. `touch index.js` and add the code below to the file
```js
import * as syphonx from "syphonx"
const template = await syphonx.fetchTemplate("$/examples/weather.yaml")
const result = await syphonx.online(template)
console.log(result.data)
})();
```
4. `node index.js` to run

This should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.

```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```

* [Try it from the command-line](documentation/get-started-cli.md) *zero code—easiest way!*
* [Write some code](documentation/get-started-code.md) *also easy!*
