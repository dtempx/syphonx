Run the command below to extract information from a Google search: https://www.google.com/search?q=meme
```
npx syphonx run $/examples/google.json
```

This should produce output similar to the following...
```json
{
  "search_result": [
    {
      "name": "Meme - Wikipedia",
      "excerpt": "A meme (/miːm/ MEEM) is an idea, behavior, or style that spreads by means of imitation from person to person within a culture and often carries symbolic ...",
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
    },
    {
      "name": "What Is a Meme? - Lifewire",
      "excerpt": "Sep 16, 2022 — A meme is a virally transmitted image embellished with text, usually sharing pointed commentary on cultural symbols, social ideas, ...",
      "href": "https://www.lifewire.com/what-is-a-meme-2483702"
    },
    {
      "name": "meme | Definition, Meaning, History, & Facts - Britannica",
      "excerpt": "Oct 4, 2022 — meme , unit of cultural information spread by imitation. The term meme (from the Greek mimema, meaning “imitated”) was introduced in 1976 by ...",
      "href": "https://www.britannica.com/topic/meme"
    },
    {
      "name": "The Meaning and History of Memes - The New York Times",
      "excerpt": "Feb 14, 2022 — Webster's New World College Dictionary defines a meme as “a concept, belief, or practice conceived as a unit of cultural information that may be ...",
      "href": "https://www.nytimes.com/2022/01/26/crosswords/what-is-a-meme.html"
    },
    {
      "name": "Meme Definition & Meaning - Dictionary.com",
      "excerpt": "meme · a cultural item that is transmitted by repetition and replication in a manner analogous to the biological transmission of genes. · a cultural item in the ...",
      "href": "https://www.dictionary.com/browse/meme"
    },
    {
      "name": "meme - Wiktionary",
      "excerpt": null,
      "href": "https://en.wiktionary.org/wiki/meme"
    }
  ]
}
```

Here is the template that produced this result...
```json
{
    "url": "https://www.google.com/search?q=meme",
    "actions": [
        {
            "select": [
                {
                    "name": "search_result",
                    "repeated": true,
                    "$": [["#search .g:visible"]],
                    "select": [
                        {
                            "name": "name",
                            "$": [["[data-header-feature] a h3"]]
                        },
                        {
                            "name": "excerpt",
                            "$": [["[data-content-feature]:has(span)"]]
                        },
                        {
                            "name": "href",
                            "$": [["[data-header-feature] a",["attr","href"]]]
                        }
                    ]
                }
            ]
        }
    ]
}
```

Run the command again with your own search...
```
npx syphonx run $/examples/google.json --url=https://www.google.com/search?q=restaurants+near+me
```

[Back to top](/README.md)
