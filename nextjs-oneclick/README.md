# Next.js + Temporal Example

This example shows how to use [Temporal](https://docs.temporal.io/) with Next.js. 


## Instructions

```bash
cd nextjs-oneclick # git clone or navigate into this folder
npm i
npm run dev
```

The `dev` script does 3 things:

- runs `next dev` which opens the frontend on [localhost:3000](http://localhost:3000)
- runs `temporal:dev` which runs the Temporal Worker, Workflows, and Activities code through the TypeScript compiler in watch mode
- runs `temporal:worker` which runs the compiled `worker.ts` file

Now you can go to http://localhost:3000/api/workflow and see the result:

```json
{"result":"Hello, Temporal!"}
```

## Deploy

We haven't worked out the deploy story yet but eventually we'd love for you to deploy this example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/next.js/tree/canary/examples/with-tailwindcss&project-name=with-tailwindcss&repository-name=with-tailwindcss)
