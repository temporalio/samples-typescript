# Temporal External Client Configuration Samples

This directory contains TypeScript samples that demonstrate how to use the Temporal SDK's external client configuration feature. This feature allows you to configure a `Client` using a TOML file and/or programmatic overrides, decoupling connection settings from your application code.

## Prerequisites

To run, first see [README.md](../README.md) for prerequisites.

## Configuration File

The [`config.toml`](./config.toml) file defines three profiles for different environments:

- `[profile.default]`: A working configuration for local development.
- `[profile.staging]`: A configuration with an intentionally **incorrect** address (`localhost:9999`) to demonstrate how it can be corrected by an override.
- `[profile.prod]`: A non-runnable, illustrative-only configuration showing a realistic setup for Temporal Cloud with placeholder credentials. This profile is not used by the samples but serves as a reference.

## Samples

The following TypeScript scripts demonstrate different ways to load and use these configuration profiles.

### [`load-from-file.ts`](./src/load-from-file.ts)

This sample shows the most common use case: loading the `default` profile from the `config.toml` file.

### [`load-profile.ts`](./src/load-profile.ts)

This sample demonstrates loading the `staging` profile by name (which has an incorrect address) and then correcting the address programmatically. This highlights the recommended approach for overriding configuration values at runtime.

## Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. Run any of the samples:
   - `npm run load-default` - Load and connect using the default profile
   - `npm run load-profile` - Load staging profile and override the incorrect address

### Expected Output

**Running `npm run load-default`:**

```
--- Loading default profile from config.toml ---
Loaded 'default' profile from /path/to/config.toml.
  Address: localhost:7233
  Namespace: default
  gRPC Metadata: {"my-custom-header":"development-value","trace-id":"dev-trace-123"}

Attempting to connect to client...
✅ Client connected successfully!
```

**Running `npm run load-profile`:**

```
--- Loading 'staging' profile with programmatic overrides ---
The 'staging' profile in config.toml has an incorrect address (localhost:9999).
We'll programmatically override it to the correct address.

Loaded 'staging' profile from /path/to/config.toml with overrides.
  Address: localhost:7233 (overridden from localhost:9999)
  Namespace: staging

Attempting to connect to client...
✅ Client connected successfully!
```
