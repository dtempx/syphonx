# How do selectors work?
SyphonX selectors are based on jQuery and expressed using the `"$"` property in a SyphonX template.

```json
{
    "name": "title",
    "$": [["h1"]]
}
```

Below are some more examples comparing jQuery and SyphonX selectors.

jQuery                                                           | SyphonX
---------------------------------------------------------------- | ---------------------------------------------------------
`$('div')`                                                       | `[["div"]]`
`$('a').attr('href')`                                            | `[["a",["attr","href"]]]`
`$('img[src*=/employee/]').attr('src')`                          | `[["img[src*=/employee/]",["attr","src"]]]`
`$('h4:contains("Admitted")').closest('.panel').find('ul > li')` | `[["h4:contains('Admitted')",["closest",".panel"],["find","ul > li"]]`

> SyphonxX fully supports *all* jQuery functionality, so anything that can be done with jQuery can also be done in SyphonX. Any arbitrary jQuery expression (of any complexity) can be expressed in SyphonX.

# How do Regular Expressions work within a selector?
Regular Expressions can be defined using the `extract` method in a selector to extract text from a jQuery result.

Here's an example that extracts the matching word after `color: ` within any matching `<div>` element.
```json
{
    "name": "color",
    "$": [["div",["extract","/color: ([a-z]+)/"]]]
}
```

Regular Expressions can also be used to replace text within a jQuery result using the `replace` method.

Here's an example that replaces the word `group` with the word `category` within any matching `<div>` element.
```json
{
    "name": "description",
    "$": [["div",["replace","/group/gi","category"]]]
}

```

# Sometimes selected URL's are relative, is there a way to make them absolute?
Yes, use `format` to specify `href` format.
```json
{
    "name": "image_url",
    "$": [["img",["attr","src"]]],
    "format": "href"
}
```
