# DevNotes

## Setup
```
git clone https://github.com/dtempx/syphonx.git
cd syphonx
yarn build
```

# Test
```
node command --help
node command --version
node command run --help
node command run $/examples/example.json
node command run test.json
node command run test.json --show
node command run test.json --show --pause
node command run test.json --out=html
node command run test.json --out=html:post
node command run test.json --out=log
node command run test.json --out=data,log
node command run test.json test.html
node command run test.json test.html --out=data,log
node command run test.json --offline
```

# Test JSON Templates
```
node command run examples/example.json
node command run examples/amazon.json
node command run examples/google.json
node command run $/examples/example.json
```


# Test YAML Templates
```
node command run examples/example.yaml
node command run examples/example2.yaml
node command run examples/weather.yaml
node command run examples/weather2.yaml
node command run examples/google/search.yaml
node command run examples/google/search.yaml --params="{search:'restaurants near me'}"
node command run examples/amazon/product-page.yaml
node command run examples/amazon/product-page.yaml --params="{asin:'B0787D6SGQ'}"
node command run $/examples/weather.yaml
node command view $/examples/weather.yaml
node command view $/examples/weather.yaml --json
```

## Symbolic Linking
1. Run `yarn link` from this project
2. Run `yarn link syphonx` from other project
3. Run `npx syphonx --version` to verify

[More info](https://medium.com/@debshish.pal/publish-a-npm-package-locally-for-testing-9a00015eb9fd)



## Deploy
```
yarn upgrade syphonx-lib --latest
yarn upgrade puppeteer --latest
yarn build
yarn test
npm publish
```
> Publish requires authenticator code
