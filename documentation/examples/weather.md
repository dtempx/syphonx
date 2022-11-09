First let's install SyphonX locally to speed things up—so we don't have to download the command every time we run it...
```bash
mkdir temp
cd temp
npm init -y
npm install syphonx
```

Run the following command to download a template from the cloud...
```
npx syphonx pull $/examples/weather.yaml
```

Instead of returning the weather as a string, let's modify the template to break the result down into seperate fields for temperature and conditions...
```yaml
url: https://weather.com/weather/today/
select:
  - name: temperature
    query: "[data-testid='TemperatureValue']:first"
  - name: conditions
    query: "[data-testid='wxPhrase']"
```

Run the template locally...
```
npx syphonx run weather.yaml
```

This should produce the following output...
```json
{
  "temperature": "54°",
  "conditions": "Cloudy"
}
```

Try some more examples...
* [Google Search](google-search.md)
* [Amazon Product Page](amazon-product-page.md)


[Back to top](/README.md)
