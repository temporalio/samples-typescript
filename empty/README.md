# Starter project

This is an empty project that is scaffolded out when you run `npx @temporalio/create@latest ./myfolder` and choose the `empty` option.

* Add your Activity Definitions to `src/activities.ts`.
* Add your Workflow Definitions to `src/workflows.ts`.
* Modify the `src/client.ts` file and replace `YOUR_WORKFLOW` with the name of your Workflow.

This project contains scaffolded tests in `src/mocha` which you must update in order to get them to pass:

* Modify `src/mocha/activities.test.ts`:
    * Replace `YOUR_ACTIVITY` so it references your Activity.
    * Then add your assertions.
* Modify `src/mocha/workflows.test.ts`:
    * Replace `YOUR_WORKFLOW` so it references your Workflow
    * Update the arguments array so it reflects your inputs. 
    * Then add your assertions.
* Modify `src/mocha/workflows-mocks.test.ts`:
    * Replace `YOUR_ACTIVITY` with your Activity name and replace the mocked function with your own code.
    * Replace `YOUR_WORKFLOW` so it references your Workflow and update the arguments array so it reflects your inputs. 
    * Then add your assertions.

## Running the code

Install dependencies with `npm install`.

Run `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).

The `package.json` file contains scripts for running the client, the Worker, and the tests.

1. In a shell, run `npm run start.watch` to start the Worker and reload it when code changes..
1. In another shell, run `npm run workflow` to run the Workflow Client.
1. Run `npm test` to run the tests.
1. Run `npm run format` to format your code according to the rules in `.prettierrc`.
1. Run `npm run lint` to lint your code according to the rules in `eslintrc.js`.

