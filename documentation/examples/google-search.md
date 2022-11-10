Run the command below to extract information from a Google search: https://www.google.com/search?q=meme
```
npx syphonx run $/examples/google/search.yaml
```

This should produce output similar to the following...
```json
{
  "search_result": [
    {
      "name": "Meme Definition & Meaning - Merriam-Webster",
      "excerpt": "The meaning of MEME is an amusing or interesting item (such as a captioned picture or video) or genre of items that is spread widely online especially ...",
      "href": "https://www.merriam-webster.com/dictionary/meme"
    },
    {
      "name": "Meme - Wikipedia",
      "excerpt": "A meme (/miːm/ MEEM) is an idea, behavior, or style that spreads by means of imitation from person to person within a culture and often carries symbolic ...",
      "href": "https://en.wikipedia.org/wiki/Meme"
    },
    {
      "name": "Meme Generator - Imgflip",
      "excerpt": "Insanely fast, mobile-friendly meme generator. Caption memes or upload your own images to make custom memes .",
      "href": "https://imgflip.com/memegenerator"
    },
    {
      "name": "Know Your Meme: Internet Meme Database",
      "excerpt": "Know Your Meme is a website dedicated to documenting Internet phenomena: viral videos, image macros, catchphrases, web celebs and more.",
      "href": "https://knowyourmeme.com/"
    }
  ]
}
```

The output should reflect the selected content on the page...
<kbd><img src="images/google-search.png" /></kbd>

> Of course Google has an API for this, but we're just learning here.

Here is the template that produced this result...
```yaml
url: https://www.google.com/search?q=${search}
params:
  search: meme
select:
  - name: search_result
    repeated: true
    query: "#search .g:has([data-header-feature])"
    select:
      - name: name
        query: "[data-header-feature] a h3"
      - name: excerpt
        query: "[data-content-feature]:has(span)"
      - name: href
        query: $('[data-header-feature] a').href()
```

Notice the `search_result` is a repeated object with a CSS selector that sets the context for multiple search results to be retrieved. Each search result is extracted with the `name` and `excerpt` properties retrieved using a CSS selector and the `href` property using a jQuery selector to grab the HTML attribute.

This template is parameter-driven so we can run the command again with with a different search query...
```
npx syphonx run $/examples/google/search.yaml --params="{search:'restaurants'}"
```

What if we also wanted to extract the description that appears above the search results, or the *"People also ask"* section? [Continue](google-search-2.md)

[Back to top](/README.md)
