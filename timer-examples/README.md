# Timer Reminder Example

This example shows

- how to use `sleep` to send a reminder email after some time elapses
- how to use `sleep` to create an Updatable Timer

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Set up an account with [Mailgun](https://www.mailgun.com/)
4. Create a `.env` file with the following environment variables: `MAILGUN_API`, `MAILGUN_DOMAIN`, and `ADMIN_EMAIL`
5. Run `npm run build` to compile the project.
6. Run `npm run start` to start the worker. Leave the worker process running.
7. Run `npm run workflow-slow` to start the example. Should print out "Done" and send an email to the email specified in the `ADMIN_EMAIL` environment variable
8. Run `npm run workflow-updating`.
