npx tsc
npx tsc -p tsconfig.esm.json
echo '{"type":"module"}' > dist/esm/package.json
npx tsc -p tsconfig.cjs.json
echo '{"type":"commonjs"}' > dist/cjs/package.json
cp node_modules/jquery/dist/jquery.slim.min.js dist/
cp node_modules/jquery/dist/jquery.slim.min.map dist/
