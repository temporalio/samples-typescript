# Fetch ESM

Sample for configuring a Temporal project with TypeScript and [ES Modules](https://nodejs.org/api/esm.html).

Fundamental difference from CommonJS:

- [`package.json`](./package.json) has `"type": "module"` attribute.
- [`tsconfig.json`](./tsconfig.json) outputs in `esnext` format.
- Imports [must](https://nodejs.org/api/esm.html#esm_mandatory_file_extensions) include the `.js` file extension.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```
