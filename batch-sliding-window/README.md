# Batch Sliding Window

This sample demonstrates a batch processing workflow that maintains a sliding window of record processing workflows.

A `SlidingWindowWorkflow` starts a configured number (sliding window size) of `RecordProcessorWorkflow` children in parallel. Each child processes a single record. When a child completes, a new child is started.

The `SlidingWindowWorkflow` calls continue-as-new after starting a preconfigured number of children to keep its history size bounded. A `RecordProcessorWorkflow` reports its completion through a signal to its parent, which allows notification of a parent that called continue-as-new.

A single instance of `SlidingWindowWorkflow` has limited window size and throughput. To support larger window size and overall throughput, multiple instances of `SlidingWindowWorkflow` run in parallel.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

The workflow will process 90 records using a sliding window of 10 parallel workers across 3 partitions, with a page size of 5 records per continue-as-new iteration.
