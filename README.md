SyphonX is a simple and powerful way to extract data from any website without writing complicated procedural code.


# Get Started
Run the following from the command-line anywhere Node.js is installed...
```
npx syphonx run $/examples/example.yaml
```

The above command should produce the following output which is the result of extracting data from [this page](https://www.example.com/).
```json
{
  "name": "Example Domain",
  "description": "This domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\nMore information...",
  "href": "https://www.iana.org/domains/example"
}
```

# How does it work?
Data was extracted from the page using a template from the cloud, `$/examples/example.yaml` in this case, which can be viewed by running the following command...

```
npx syphonx view $/examples/example.yaml
```

```yaml
url: https://www.example.com/
select:
  - name: name
    query: $('h1')
  - name: description
    query: $('p')
  - name: href
    query: $('a').attr('href')
```

This template uses [jQuery](https://api.jquery.com/) to query the DOM for `<h1>`, `<p>` and `<a>` and assigns to `name`, `description`, and `href` respectively.

Of course the template can be modified and run locally. [Try it now!](documentation/example.md)


# Want to know more?
* [Try some more examples](documentation/install.md)
* [FAQ](documentation/faq.md)
* [SyphonX API Documentation](documentation/overview.md)
