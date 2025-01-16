# Hello World with TLS

This sample demonstrates how to secure your Temporal application with in-transit TLS encryption.

This is required to connect with [Temporal Cloud](https://docs.temporal.io/cloud/security#encryption),
or to a self-hosted Temporal deployment that is [secured with TLS](https://docs.temporal.io/self-hosted-guide/security#encryption-in-transit-with-mtls).

## Running this sample

1. Install NPM dependencies:

   ```
   npm install   # or `pnpm` or `yarn`
   ```

2. Set and export the following environment variables, as appropriate for your Temporal cluster.

   - `TEMPORAL_ADDRESS` — gRPC endpoint of your Temporal cluster
   - `TEMPORAL_NAMESPACE` — Your namespace

   - `TEMPORAL_SERVER_ROOT_CA_CERT_PATH` — Path to a file containing the Root CA certificate
     to use to validate your _server_'s certificate. Omit to use CA certificates configured
     on your operating system.
   - `TEMPORAL_SERVER_NAME_OVERRIDE` — Set to override the target name (SNI) used for TLS host
     name checking. This can be useful when you have reverse proxy in front of temporal server,
     and you may want to override the SNI to direct traffic to the appropriate backend server
     based on custom routing rules. Oppositely, connections could be refused if the provided
     SNI does not match the expected host. Adding this override should be done with care.

   _(for mTLS authentication only)_

   - `TEMPORAL_CLIENT_CERT_PATH` — Path to a file containing your client certificate
   - `TEMPORAL_CLIENT_KEY_PATH` — Path to a file containing your client private key

   _(for API Key authentication only)_

   - `TEMPORAL_CLIENT_API_KEY` — The API Key used to identify this Client or Worker.

   Refer to the [Common Configurations](#common-configurations) section below for details.

3. Run the Worker:

```
npm run start.watch to start the Worker
```

4. From another shell, start a Workflow execution:

```
npm run workflow to run the Workflow
```

## Common Configurations

### Connection to a Temporal Cloud namespace with mTLS authentication

- **Namespace**: Make sure to configure the namespace as it appears in Temporal Cloud's web interface,
  including the account identifier suffix, e.g. `my-application-prod.abc45`.

- **Address**: Make sure to configure the mTLS endpoint as it appears in Temporal Cloud's web interface,
  e.g. `${namespace}.tmprl.cloud:7233`.

  Note that endpoints of the form `${region}.${provider}.api.temporal.io:7233` only support [API Key authentication](#connection-to-a-temporal-cloud-namespace-with-api-key-authentication). They will not work with mTLS authentication.

- **Server Root CA Certificate**: When connecting to Temporal Cloud, you generally do not need to
  provide a Root CA certificate to your Clients and Workers, as Temporal Cloud server certificates
  are signed by well known Root CAs. Simply leave that field out. Do not set this to the Root CA
  Certificate that you self-generated to sign your client certificates — that will not work.

Refer to [this documentation page](https://docs.temporal.io/cloud/certificates) for more details
regarding usage of mTLS authentication with Temporal Cloud.

### Connection to a Temporal Cloud namespace with API Key authentication

- **Namespace**: Make sure to configure the namespace as it appears in Temporal Cloud's web interface.
  It will look something like `my-application.abc45`.

- **Address**: Make sure to configure the API Key endpoint as it appears in Temporal Cloud's web interface.
  As noted above, this will be different from the address you'd use with mTLS. With API Key authentication,
  this endpoint address will look something like `${region}.${provider}.api.temporal.io:7233`.

- **Server Root CA Certificate**: When connecting to Temporal Cloud, you generally do not need to
  provide a Root CA certificate to your Clients and Workers, as Temporal Cloud server certificates
  are signed by well known Root CAs. Simply leave that field out.

Refer to [this documentation page](https://docs.temporal.io/cloud/api-keys) for more details
regarding usage of API Key authentication with Temporal Cloud.

### Connection to a Temporal Cloud namespace through AWS PrivateLink

- **Address**: Set this property to the PrivateLink endpoint address.
  It will look something like `com.amazonaws.vpce.${region}.${vpc-endpoint-identifier}:7233`.

- **Server Root CA Certificate**: When connecting to Temporal Cloud, you generally do not need to
  provide a Root CA certificate to your Clients and Workers, as Temporal Cloud server certificates
  are signed by well known Root CAs. Simply leave that field out.

- **Server Name Override**: Set this property to the mTLS endpoint as it appears in Temporal Cloud's web interface,
  e.g. `${namespace}.tmprl.cloud:7233`.

Refer to [this documentation page](https://docs.temporal.io/cloud/security/aws-privatelink) for more details
regarding usage connection to Temporal Cloud through AWS PrivateLink.

### Connection to a Self-Hosted cluster with mTLS authentication

You will need access to a self-hosted Temporal cluster configured with TLS or mTLS.
See [this server sample](https://github.com/temporalio/samples-server/tree/main/tls/tls-simple)
for a starter.

Note that Temporal CLI's dev server doesn't support TLS or mTLS configuration.

- **Server Root CA Certificate**: The Root CA Certificate that was used to sign your _server_'s
  certificate. Depending on your setup, this may or may not be the same as the CA certificate that
  was used to sign your Clients and Workers certificates. You may leave empty if your server's
  certificate can be validated using your operating system's Root CAs.

Refer to [this documentation page](https://docs.temporal.io/self-hosted-guide/security) for more details
regarding usage of mTLS to secure a self-hosted Temporal deployment.
