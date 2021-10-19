# Next.js + Temporal Example

This example shows how to use [Temporal](https://docs.temporal.io/) with Next.js.

## Instructions

```bash
cd nextjs-ecommerce-oneclick # navigate into this folder
npm i
npm run dev
```

The `dev` script does 3 things:

- runs `next dev` which opens the frontend on [localhost:3000](http://localhost:3000)
- runs `temporal:dev` which runs the Temporal Worker, Workflows, and Activities code through the TypeScript compiler in watch mode
- runs `temporal:worker` which runs the compiled `worker.ts` file

Now you can go to http://localhost:3000/api/hello and see the result:

```json
{ "name": "John Doe" }
```

## Demo

There are two versions of this for development purposes.

- http://localhost:3000/ (index) shows a realistic ecommerce situation where some of the state is managed on the frontend.
  - You can see a demo of this at our Sept 2021 meetup: https://youtu.be/JQ6FRTnQWFI
- http://localhost:3000/barebones shows buttons for the raw API calls which can be useful for learning and debugging.

![image](https://user-images.githubusercontent.com/6764957/135000553-6ac7d0b7-d2fb-4901-aee1-73251de33f67.png)

- Click "Buy item"
- Click "Get State" anytime
- Things to try
  - View workflow state in Temporal Web
  - Click "Cancel Buy" within 5 seconds

## Deploy

We haven't worked out the deploy story yet but eventually we'd love for you to deploy this example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/next.js/tree/canary/examples/with-tailwindcss&project-name=with-tailwindcss&repository-name=with-tailwindcss)
