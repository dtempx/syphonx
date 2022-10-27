Run the command below to extract information from a Google search: https://www.google.com/search?q=meme
```
npx syphonx run $/examples/google.json
```

This should produce output similar to the following...
```json
{
  "search_result": [
    {
      "name": "Meme Generator - Imgflip",
      "excerpt": "Insanely fast, mobile-friendly meme generator. Caption memes or upload your own images to make custom memes .",
      "href": "https://imgflip.com/memegenerator"
    },
    {
      "name": "Meme - Wikipedia",
      "excerpt": "A meme (/miːm/ MEEM) is an idea, behavior, or style that spreads by means of imitation from person to person within a culture and often carries symbolic ...",
      "href": "https://en.wikipedia.org/wiki/Meme"
    },
    {
      "name": "Meme Definition & Meaning - Merriam-Webster",
      "excerpt": "The meaning of MEME is an amusing or interesting item (such as a captioned picture or video) or genre of items that is spread widely online especially ...",
      "href": "https://www.merriam-webster.com/dictionary/meme"
    },
    {
      "name": "Know Your Meme: Internet Meme Database",
      "excerpt": "Know Your Meme is a website dedicated to documenting Internet phenomena: viral videos, image macros, catchphrases, web celebs and more.",
      "href": "https://knowyourmeme.com/"
    },
    {
      "name": "meme | Definition, Meaning, History, & Facts - Britannica",
      "excerpt": "Oct 4, 2022 — meme , unit of cultural information spread by imitation. The term meme (from the Greek mimema, meaning “imitated”) was introduced in 1976 by ...",
      "href": "https://www.britannica.com/topic/meme"
    },
    {
      "name": "Search & Discover Funny Memes, Photos & Videos | Memes",
      "excerpt": "Memes is your source for the best & newest Memes , Funny Pictures, and hilarious videos. Find memes or make them with our Meme Generator.",
      "href": "https://memes.com/"
 item in the ...",
      "href": "https://www.dictionary.com/browse/meme"
    }
  ]}
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

[Back to top](../../README.md)
