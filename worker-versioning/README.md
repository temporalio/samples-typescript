# Worker Versioning

This sample demonstrates how to use Temporal's Worker Versioning feature to safely deploy updates to
workflow and activity code. It shows the difference between auto-upgrading and pinned workflows, and
how to manage worker deployments with different build IDs.

The sample creates multiple worker versions (1.0, 1.1, and 2.0) within one deployment and
demonstrates:

- **Auto-upgrading workflows**: Automatically and controllably migrate to newer worker versions
- **Pinned workflows**: Stay on the original worker version throughout their lifecycle
- **Compatible vs incompatible changes**: How to make safe updates using `patched`

## Running

1. Start a Temporal server with `temporal server start-dev`. See [Temporal Server](https://github.com/temporalio/cli/#installation).
   Ensure that you're using at least Server version 1.28.0 (CLI version 1.4.0).
2. Install dependencies with `npm install`.
3. In one terminal run the driver application: `npm run example`.
4. When prompted by the application, start the workers in separate terminals:
   - `npm run worker1`
   - `npm run worker1_1`
   - `npm run worker2`

Follow the prompts in the example to observe auto-upgrading workflows migrating to newer workers
while pinned workflows remain on their original versions.
