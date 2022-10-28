# What does SyphonX stand for?
**Syphon** stands for *syphoning* data from the web, and **X** stands for *anywhere*. We don't like the term *scraping* by the way because scraping hurts.


# How do SyphonX templates work?
A SyphonX template determines what data is extracted from the HTML and how to shape the resulting output. Data is extracted using jQuery which is expressed using the `"$"` property as shown below.

```
{
    "name": "title",
    "$": [["h1"]]
}
```

In this example the contents of the `<h1>` tag are assigned to the `title` property.

Below are some more examples comparing jQuery and SyphonX selectors.

jQuery                                                           | SyphonX
---------------------------------------------------------------- | ---------------------------------------------------------
`$('div')`                                                       | `[["div"]]`
`$('a').attr('href')`                                            | `[["a",["attr","href"]]]`
`$('img[src*=/employee/]').attr('src')`                          | `[["img[src*=/employee/]",["attr","src"]]]`
`$('h4:contains("Admitted")').closest('.panel').find('ul > li')` | `[["h4:contains('Admitted')",["closest",".panel"],["find","ul > li"]]`

SyphonX fully supports *all* jQuery functionality, so anything that can be done with jQuery can also be done in SyphonX.


# Why are there double brackets in the selectors?
Because for some websites the same information may be found at different places within the DOM from page to page.

For example a price may be designated as `<div class="price">$9.99</div>` on one page but as `<span id="price">$9.99<span>` on another. Defining a selector like the below will catch both cases.

```
{
    "name": "price",
    "$": [[".price"],["#price"]]
}
```

Of course, you could also do it like this...
```
{
    "name": "price",
    "$": [[".price, #price"]]
}
```

In this case these two examples will produce identical results. However more complex scenarios may require breaking it down to seperate selectors.


# Is there a way to extract a substring from the selected text?
A regular expression can be used by adding an `extract` method to a selector which extracts text from the jQuery result.

Here's an example that extracts the matching word after the text of *"color: "* within any selected `<div>` element.
```
{
    "name": "color",
    "$": [["div",["extract","/color: ([a-z]+)/"]]]
}
```


# Is there a way to modify the selected text with a search and replace?
A regular expression can also be used to replace text within a jQuery result using the `replace` method.

Here's an example that replaces the word `group` with the word `category` within any selected `<div>` element. Regular Expressions are always designated with a `/` before and after. The `gi` are standard Regular Expression options, `g` to match *globally* (to replace all instead of just one) and `i` to *ignore* case.
```
{
    "name": "description",
    "$": [["div",["replace","/group/gi","category"]]]
}
```

# What if I need to click on a button to get the data to appear?
Use the `click` action to click on any interactive element in the DOM.

For example here is how to click on the first `<a class="buy-button">`.
```
{
    "actions": [
        { "click": { "$": [["a.buy-button"]] } },
        { "select": [
            ...
        ]}
        ...
    ]
}
```

If the click navigates to a new page, add a `yield` action after `click` like so...
```
{
    "actions": [
        { "click": { "$": [["a.buy-button"]] } },
        { "yield": null },
        { "select": [
            ...
        ]}
    ]
}
```

# What if the data I need doesn't show up right away in the DOM?
Use the `waitfor` action to wait for any element to appear before selecting the data.
```
{
    "actions": [
        { "waitfor": { "$": [[".search-results"]] } },
        { "select": [
            ...
        ]}
    ]
}
```
Any number of `waitfor`, `click`, and `select` actions can be sequenced together.


# How can I click on a button and then wait for data to appear before selecting?
A `waitfor` sub-action can be placed within a `click` action like so...
```
{
    "click": {
        "$": [["a.buy-button"]]
    },
    "waitfor": {
        "$": [["#buybox"]],
        "timeout": 10,
        "retry": 1
    }
}
```
The above example will click on `<a class="buy-button">` and wait-for an element with an id of `buybox` to appear. If the element doesn't appear within 10 seconds the click and wait-for will be repeated one time. 


# When selecting, only the first hit is returned—is there a way to return all hits?
By default SyphonX only returns the first hit when `repeated` is `false` (which is the default), but you can easily get all hits.

If you want all hits within a single string specify the `all` option...
```
{
    "name": "channels",
    "all": true,
    "$": [["ul > li"]]
}
```
The above option returns the items seperated by a space. Specify `"format": "multiline"` for newline seperated output. If tab or comma seperated output is desired, use the `replace` method to transform the newlines.

If you want multiple hits in an array, specify the `repeated` option...
```
{
    "name": "channels",
    "repeated": true,
    "$": [["ul > li"]]
}
```


# Is there a way to get the HTML instead of text?
Add an `html` method to the selector which returns the outer HTML.
```
{
    "name": "image_url",
    "$": [["div",["html"]]]
}
```
If you want the inner HTML instead then specify `inner` like so...
```
{
    "name": "image_url",
    "$": [["div",["html","inner"]]]
}
```


# Sometimes selected URL's are not absolute, is there a way to make them so?
Use `format` to specify `href` format which prepends the site name when a non fully qualified URL is selected.
```
{
    "name": "image_url",
    "$": [["img",["attr","src"]]],
    "format": "href"
}
```

# Is it possible to modify the DOM before selecting the data, for example to add a class or delete elements?
Use the `transform` action to modify the DOM using `addClass()`, `remove()`, `replaceWith()`, `wrap()` and other jQuery manipulators.

Here is an example that adds a `figure` class to all `<img>` elements contained by a `<p>` element...
```
    "actions": [
        {
            "transform": [
                { "$": ["p > img",["addClass","figure"]] }
            ]
        },
        "select": [
            ...
        ]
    ]
```
Any number of transforms can be expressed within a transform action, and they are executed in the order they are defined.


# How can I click through multiple pages, selecting data on each page?
This can be done using the `repeat` action, see the [pager](examples/pager.md) example for details.


# How can I select all the data on a page after scrolling all the way down on an infinite scroller page?
This can be done using the `repeat` action, see the [infinite scroller](examples/infinite-scroller.md) example for details.




# My selector isn't working, how can I troubleshoot it?
There are several ways to troubleshoot with SyphonX.

Show the page as it's being captured...
```
npx syphonx run $/examples/example.json --show
```

Show the page with a pause so the page can be inspected before extracting...
```
npx syphonx run $/examples/example.json --show --pause
```

Show detailed log output...
```
npx syphonx run $/examples/example.json --out=log
```
