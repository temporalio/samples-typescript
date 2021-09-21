"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @@@SNIPSTART nodejs-hello-worker
const worker_1 = require("@temporalio/worker");
const path_1 = __importDefault(require("path"));
run().catch((err) => console.log(err));
async function run() {
    // Automatically locate and register Activities and Workflows relative to __dirname
    // (assuming package was bootstrapped with `npm init @temporalio`).
    // Worker connects to localhost by default and uses console error for logging.
    // Customize the Worker by passing more options to create().
    // create() tries to connect to the server and will throw if a connection could not be established.
    // You may create multiple Workers in a single process in order to poll on multiple task queues.
    // In order to configure the server connection parameters and other global options,
    // use the Core.install() method to configure the Rust Core SDK singleton.
    const worker = await worker_1.Worker.create({
        workDir: __dirname,
        nodeModulesPath: path_1.default.join(__dirname, '/../../node_modules'),
        taskQueue: 'tutorial',
    });
    // Start accepting tasks on the `tutorial` queue
    await worker.run();
}
// @@@SNIPEND
