Run the command below to extract information from an Amazon product-page: https://www.amazon.com/dp/${B081FGTPB7}/
```
npx syphonx run $/examples/amazon/product-page.yaml
```

This should produce output similar to the following...
```json
{
  "name": "Amazon Basics AA 1.5 Volt Performance Alkaline Batteries - Pack of 8",
  "price": "$7.34",
  "availability": "In Stock."
}
```

Here is the template that produced this result...
```yaml
url: https://www.amazon.com/dp/${asin}/
params:
  asin: B081FGTPB7
select:
  - name: name
    query: "#title"
  - name: price
    query: "#buybox .a-price .a-offscreen:first"
  - name: availability
    query: "#availability:first"
```

Run the command again with your own product...
```
npx syphonx run $/examples/amazon/product-page.yaml --params="{asin:'B0787D6SGQ'}"
```

[Back to top](/README.md)
