# Timer Examples

This example shows how to use [`sleep`](https://typescript.temporal.io/api/namespaces/workflow/#sleep) to:

- Send a notification to the customer if their order is taking longer than expected: [`src/workflows.ts`](./src/workflows.ts)
- Create an `UpdatableTimer` that can be slept on, and at the same time, have its duration updated via Signals: [`src/updatable-timer.ts`](./src/updatable-timer.ts)

## Running the sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. _Optional_: Set up an account with [Mailgun](https://www.mailgun.com/) and create a `.env` file with the following environment variables: `MAILGUN_API`, `MAILGUN_DOMAIN`, and `ADMIN_EMAIL`. `ADMIN_EMAIL` is the email address your Mailgun emails will be sent to. You can use the `.env.example` file as a template.
1. `npm run start.watch` to start the Worker.

### Email notification

In another shell, enter `npm run workflow-slow` to run the Workflow. The Workflow should return:

```
Order completed!
```

And the Worker should log (in the first shell):

```
Sending email: Order processing is taking longer than expected, but don't worry—the job is still running!
```

If we run `npm run workflow-fast`, then the Worker shouldn't send an email.

### Updatable Timer

Run `npm run workflow-updating` to demonstrate the Updatable Timer.

This example shows how to write reusable libraries that encompass Workflow APIs.

[`countdownWorkflow`](./src/updatable-timer.ts) is originally set to resolve after 1 day; however, the Workflow sends in a `setDeadlineSignal` that updates it to resolve in 1 second, and it does. You can see each step in the Worker log output, as well as the [Temporal Web](https://docs.temporal.io/docs/system-tools/web-ui/#using-temporal-web-for-development) Timer settings.

```bash
[countdownWorkflow(6c0c152b-aead-4b1a-acf0-17e809acf0fc)] timer set for: Tue Nov 02 2021 03:03:57 GMT-0700 (Pacific Daylight Time)
[countdownWorkflow(6c0c152b-aead-4b1a-acf0-17e809acf0fc)] timer now set for: Mon Nov 01 2021 03:03:50 GMT-0700 (Pacific Daylight Time)
[countdownWorkflow(d0a3cb4d-05b1-4cfa-af25-c9223fd34140)] countdown done!
```
