# SyphonX

SyphonX is a simple and powerful way to extract data from anywhere on the web without writing complicated procedural code.

### Get Started

Simply run the following from the command-line anywhere [Node.js 14](https://nodejs.org/) or higher is installed...

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


### Want to know more?
* [Try some more examples](documentation/install.md)
* [SyphonX API Documentation](documentation/overview.md)
* [FAQ](documentation/faq.md)
