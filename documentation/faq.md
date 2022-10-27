# How do selectors work?
SyphonX selectors are based on jQuery and expressed using the `"$"` property in a SyphonX template.

```json
{
    "name": "title",
    "$": [["h1"]]
}
```

In this example the contents of the `<h1>` tag are extracted to the `title` property in output.

Below are some more examples comparing jQuery and SyphonX selectors.

jQuery                                                           | SyphonX
---------------------------------------------------------------- | ---------------------------------------------------------
`$('div')`                                                       | `[["div"]]`
`$('a').attr('href')`                                            | `[["a",["attr","href"]]]`
`$('img[src*=/employee/]').attr('src')`                          | `[["img[src*=/employee/]",["attr","src"]]]`
`$('h4:contains("Admitted")').closest('.panel').find('ul > li')` | `[["h4:contains('Admitted')",["closest",".panel"],["find","ul > li"]]`

> SyphonX fully supports *all* jQuery functionality, so anything that can be done with jQuery can also be done in SyphonX. Any arbitrary jQuery expression (of any complexity) can be expressed in SyphonX.


# Why are there double brackets in the selectors?
Because for some websites the same information may be found at different places within the DOM from page to page.

For example a price may be designated as `<div class="price">$9.99</div>` on one page but as `<span id="price">$9.99<span>` on another. Defining a selector like the below will catch both cases.

```json
{
    "name": "price",
    "$": [[".price"],["#price"]]
}
```

Of course, you could also do it like this...
```json
{
    "name": "price",
    "$": [[".price, #price"]]
}
```

In this case these two examples will produce identical results. However more complex scenarios may require breaking it down to seperate selectors.


# Is there a way to extract a substring from matched text?
Yes, Regular Expressions can be used by adding an `extract` method to a selector which extracts text from the jQuery result.

Here's an example that extracts the matching word after the text of *"color: "* within any matching `<div>` element.
```json
{
    "name": "color",
    "$": [["div",["extract","/color: ([a-z]+)/"]]]
}
```


# Is there a way to search and replace matched text?
Yes, Regular Expressions can also be used to replace text within a jQuery result using the `replace` method.

Here's an example that replaces the word `group` with the word `category` within any matching `<div>` element. Regular Expressions are always designated with a `/` before and after. The `gi` are standard Regular Expression options, `g` to match *globally* (to replace all instead of just one) and `i` to *ignore* case.
```json
{
    "name": "description",
    "$": [["div",["replace","/group/gi","category"]]]
}
```

# When selecting only the first hit is returned, is there a way to return all hits?
Yes, by default SyphonX only returns the first hit when `repeated` is `false` (which is the default), but you can easily get all hits.

If you want all hits within a single string specify the `all` option...
```json
{
    "name": "channels",
    "all": true,
    "$": [["ul > li"]]
}
```
The above option returns the items seperated by a space. Specify `"format": "multiline"` for newline seperated output. If tab or comma seperated output is desired, use the `replace` method to transform the newlines.

If you want multiple hits in an array, specify the `repeated` option...
```json
{
    "name": "channels",
    "repeated": true,
    "$": [["ul > li"]]
}
```


# Is there a way to get the HTML instead of text?
Yes, add the `html` method to the selector which return the outer HTML.
```json
{
    "name": "image_url",
    "$": [["div",["html"]]],
    "format": "href"
}
```
If the inner HTML is desired then specify `inner` like so...
```json
{
    "name": "image_url",
    "$": [["div",["html","inner"]]],
    "format": "href"
}
```


# Sometimes when selecting URL's they are relative, is there a way to make them absolute?
Yes, use `format` to specify `href` format.
```json
{
    "name": "image_url",
    "$": [["img",["attr","src"]]],
    "format": "href"
}
```
