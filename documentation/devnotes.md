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

node command run examples/example.yaml
node command view $/examples/weather.yaml
```




## Deploy
```
yarn upgrade syphonx-core --latest
yarn upgrade puppeteer --latest
yarn build
yarn test
npm publish
```
> Publish requires authenticator code
