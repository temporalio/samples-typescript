# http

## How to use

This example currently doesn't work. It looks like the [vm isolate](https://www.npmjs.com/package/isolated-vm) is causing `http` to become an empty object when the `makeHTTPRequest()` activity runs, because there's no way to [use `require()` with `isolated-vm`](https://github.com/laverdet/isolated-vm/issues/121).