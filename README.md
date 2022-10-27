# SyphonX

SyphonX is a simple and powerful way to extract data from anywhere on the web without writing complicated procedural code.

### Get Started

Simply run the following from the command-line anywhere Node.js 14 or higher is installed...

```
npx syphonx run $/examples/example.json
```

This should produce the following output which extracts information from the simple webpage at https://www.example.com/.
```json
{
  "name": "Example Domain",
  "description": "This domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\nMore information...",
  "href": "https://www.iana.org/domains/example"
}
```

### How does it work?

Information from the page was extracted using the following template...
```json
{
  "url": "https://www.example.com/",
  "actions": [
    {
      "select": [
        {
            "name": "name",
            "$": [["h1"]]
        },
        {
            "name": "description",
            "$": [["p"]]
        },
        {
            "name": "href",
            "$": [["a",["attr","href"]]]
        }
      ]
    }
  ]
}
```

As seen above this template extracts `name`, `description`, and `href` from the target [webpage](https://www.example.com/). The `"$"` properties in the template define how data is extracted, and these are basically just [jQuery](https://api.jquery.com/) selectors.

This template was downloaded from the cloud at `$/examples/example.json`, but you can also run templates locally.


### Want to know more?
* [Try some more examples](documentation/install.md)
* [SyphonX API Documentation](documentation/overview.md)
* [FAQ](documentation/faq.md)
