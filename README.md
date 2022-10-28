SyphonX is a simple and powerful way to extract data from anywhere on the web without writing complicated procedural code.


# Get Started

Run the following from the command-line anywhere Node.js is installed...
```
npx syphonx run $/examples/example.json
```

The above command should produce the following output which is the result of extracting information from [this page](https://www.example.com/).
```json
{
  "name": "Example Domain",
  "description": "This domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\nMore information...",
  "href": "https://www.iana.org/domains/example"
}
```

# How does it work?

Information from the page was extracted using the following template...
```
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

This template extracts from the `<h1>`, `<p>` and `<a>` elements on the page and assigns to `name`, `description`, and `href` respectively. The `"$"` properties in the template define how data is extracted, which are basically [jQuery](https://api.jquery.com/) selectors.

This template was downloaded from the cloud at `$/examples/example.json`, but templates can also be run locally.


# Want to know more?
* [Try some more examples](documentation/install.md)
* [SyphonX API Documentation](documentation/overview.md)
* [FAQ](documentation/faq.md)
