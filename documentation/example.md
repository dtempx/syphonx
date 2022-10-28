First let's install SyphonX locally to speed things up—so we don't have to download the command every time we run it...
```bash
mkdir temp
cd temp
npm init -y
npm install syphonx
```

Run the following command to download a template from the cloud...
```
npx syphonx pull $/examples/example.yaml
```

Edit the template to add an `html` property to the output that captures the HTML of the second `<p>` in the DOM...
```yaml
url: https://www.example.com/
select:
  - name: name
    query: $('h1')
  - name: description
    query: $('p')
  - name: href
    query: $('a').attr('href')
  - name: html # added
    query: $('p:nth-child(2)').html() # added
```

Run the template locally...
```
npx syphonx run example.yaml
```

This should produce the following output...
```json
{
  "name": "Example Domain",
  "description": "This domain is for use in illustrative examples in documents. You may use this\ndomain in literature without prior coordination or asking for permission.\nMore information...",
  "href": "https://www.iana.org/domains/example",
  "html": "<p><a href=\"https://www.iana.org/domains/example\">More information...</a></p>"
}
```

[Back to top](/README.md)
