We can extend the [Google search example](google-search.md) to extract the questions that appear under *"People also ask"* as highlighted below.

<kbd><img src="images/google-search-3.png" /></kbd>

If you just want to see the solution, here is a revised template that does this.
```
npx syphonx view $/examples/google/search-3.yaml
npx syphonx run $/examples/google/search-3.yaml
```

If you want to make these modifications on your own, run the following command to download the original template from the cloud.
```
npx syphonx pull $/examples/google/search.yaml
```

Add a `people_also_ask` field to the bottom of the `select` statement.
```yaml
select:
  ...
  - name: people_also_ask
    repeated: true
    query: $('span:contains("People also ask")').closest('[data-initq]').find('[data-q] [role=button]').filter('/\\?$/')
```

In this case a jQuery selector is used to select the content. See the [details](google-search-3a.md) of how the questions are selected if interested.

The full template should now look like the following (with the `description` from the [previous example](google-search-2.md)).
```yaml
url: https://www.google.com/search?q=${search}
params:
  search: meme
select:
  - name: description
    query: "[data-attrid='wa:/description']"
  - name: search_result
    repeated: true
    query: "#search .g:has([data-header-feature])"
    select:
      - name: name
        query: "[data-header-feature] a h3"
      - name: excerpt
        query: "[data-content-feature]:has(span)"
      - name: href
        query: $('[data-header-feature] a').attr('href')
  - name: people_also_ask
    repeated: true
    query: $('span:contains("People also ask")').closest('[data-initq]').find('[data-q] [role=button]').filter('/\\?$/')
```

Run the template and we should see the new `people_also_ask` data in the output.
```json
{
  "description": "...",
  "search_result": [],
  "people_also_ask": [
    "What is an example of meme?",
    "What is considered as meme?",
    "Who invented a meme?",
    "How does meme pronounce?"
  ]
}
```

[Back to top](/README.md)
