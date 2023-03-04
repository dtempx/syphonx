rm -rf dist
rm *.js
rm *.js.map
rm *.d.ts
find ./lib -name "*.js" -type f -delete
find ./lib -name "*.js.map" -type f -delete
find ./lib -name "*.d.ts" -type f -delete
