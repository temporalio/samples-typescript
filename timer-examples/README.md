# Timer Reminder Example

This example shows

- how to use `sleep` to send a reminder email after some time elapses
- how to use `sleep` to create an Updatable Timer

## Steps to run the fast and slow examples

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Set up an account with [Mailgun](https://www.mailgun.com/)
4. Create a `.env` file with the following environment variables: `MAILGUN_API`, `MAILGUN_DOMAIN`, and `ADMIN_EMAIL`
5. Run `npm run build` to compile the project.
6. Run `npm run start` to start the worker. Leave the worker process running.
7. Run `npm run workflow-slow` to start the example. Should print out "Done" and send an email to the email specified in the `ADMIN_EMAIL` environment variable

## Updatable Timer examples

Run `npm run workflow-updating` to demonstrate Updatable Timer.

This example shows how to write reusable libraries that encompass the Workflow APIs.

`countdownWorkflow` is originally set to resolve after 1 day, however, the Workflow sends in a `setDeadlineSignal` that updates it to resolve in 1 second, and it does. You can see each step in the Worker log output, as well as the Temporal Web Timer settings.

```bash
[countdownWorkflow(6c0c152b-aead-4b1a-acf0-17e809acf0fc)] timer set for: Tue Nov 02 2021 03:03:57 GMT-0700 (Pacific Daylight Time)
[countdownWorkflow(6c0c152b-aead-4b1a-acf0-17e809acf0fc)] timer now set for: Mon Nov 01 2021 03:03:50 GMT-0700 (Pacific Daylight Time)
```
