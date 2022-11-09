SyphonX is the easiest way to extract data from any website without coding.


# Get Started
Run the following from the command-line anywhere Node.js is installed...
```
npx syphonx run $/examples/weather.yaml
```

The above command should produce an output similar to the below which is the result of extracting the current weather conditions from https://weather.com/weather/today/.
```json
"Anaheim, CA As of 6:55 pm PST 54° Cloudy Day 67° • Night 49° Cloudy alertLevel2 Gale Warning +6 More"
```

# How does it work?
Data was extracted from the page using a template from the cloud, `$/examples/weather.yaml` in this case, which can be viewed by running the following command...

```
npx syphonx view $/examples/weather.yaml
```

```yaml
url: https://weather.com/weather/today/
select: "[data-testid='CurrentConditionsContainer']"
```

This template uses a ["CSS Selector"](https://www.w3schools.com/cssref/css_selectors.php) to query the DOM for an element with a `data-testid` attribute equal to `CurrentConditionsContainer` and returns the result.

Of course the template can be modified and run locally. [Try it now!](documentation/examples/weather.md)


# Want to know more?
* [Try some more examples](documentation/install.md)
* [FAQ](documentation/faq.md)
* [SyphonX API Documentation](documentation/overview.md)
