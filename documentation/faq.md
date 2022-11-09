# What does SyphonX stand for?
**Syphon** stands for *syphoning* data from the web, and **X** stands for *anywhere*. We don't like the term *scraping* by the way because scraping hurts.


# How do SyphonX templates work?
A SyphonX template determines what data is extracted from the HTML and how to shape the resulting output. Data is extracted using CSS selectors and jQuery as shown below.

```yaml
url: https://www.example.com/
actions:
  - select:
    - name: name
      query: h1
    - name: description
      query: p
    - name: href
      query: $('a').attr('href')
```

The first two queries are simple CSS selectors to extract from the `<h1>` and `<p>` tags respectively, and the third query uses a jQuery selector to retrieve the HTML attribute from the matched `<a>` tag.

SyphonX fully supports *all* jQuery functionality, so anything that can be done with a CSS selector or jQuery can also be done in SyphonX.


# Is there a way to extract a substring from the selected text?
A regular expression can be used by adding an `extract` method to a selector which extracts text from the jQuery result.

Here's an example that extracts the matching word after the text of *"color: "* within any selected `<div>` element.
```yaml
select:
    name: color
    query: "$('div').extract('/color: ([a-z]+)/')"
```


# Is there a way to modify the selected text with a search and replace?
A regular expression can also be used to replace text within a jQuery result using the `replace` method.

Here's an example that replaces the word `group` with the word `category` within any selected `<div>` element. Regular Expressions are always designated with a `/` before and after. The `gi` are standard Regular Expression options, `g` to match *globally* (to replace all instead of just one) and `i` to *ignore* case.
```yaml
select:
    name: description
    query: "$('div').replace('/group/gi', 'category')"
```

# What if I need to click on a button to get the data to appear?
Use the `click` action to click on any interactive element in the DOM.

For example here is how to click on the first `<a class="buy-button">` and then select the contents of the `<h1>` tag.
```yaml
actions:
    - click: a.buy-button
    - select: h1
```

If the click navigates to a new page, add a `yield` action after `click` like so...
```yaml
actions:
    - click: a.buy-button
    - yield: null
    - select: h1
```

# What if the data I need doesn't show up right away in the DOM?
Use the `waitfor` action to wait for any element to appear before selecting the data.
```yaml
actions: 
    - waitfor: .search-results
    - select: .q
```
Any number of `waitfor`, `click`, and `select` actions can be sequenced together.


# How can I click on a button and then wait for data to appear before selecting?
A `waitfor` sub-action can be placed within a `click` action like so...
```yaml
actions: 
    - click: a.buy-button
    - waitfor:
        query: "#buybox"
        timeout: 10
        retry: 1
    - select: h1
```
The above example will click on `<a class="buy-button">` and wait-for an element with an id of `buybox` to appear. If the element doesn't appear within 10 seconds the click and wait-for will be repeated one time. Then the contents of the `<h1>` tag will be selected.



# Is there a way to get the HTML instead of text?
Add an `html` method to the selector which returns the outer HTML.
```yaml
select: $('div').html()
```
If you want the inner HTML instead then specify `inner` like so...
```yaml
select: $('div').html('inner')
```


# Sometimes selected URL's are not absolute, is there a way to make them so?
Use `format` to specify `href` format which prepends the site name when a non fully qualified URL is selected.
```yaml
select:
    name: image_url
    query: $('img').attr('src')
    format: href
```


# Is it possible to modify the DOM before selecting the data, for example to add a class or delete elements?
Use the `transform` action to modify the DOM using `addClass()`, `remove()`, `replaceWith()`, `wrap()` and other jQuery manipulators.

Here is an example that adds a `figure` class to all `<img>` elements contained by a `<p>` element...
```yaml
actions:
    - transform: $('p > img').addClass('figure')
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
