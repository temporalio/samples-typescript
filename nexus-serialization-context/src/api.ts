import * as nexus from 'nexus-rpc';

export const syncEchoService = nexus.service('SyncEchoService', { echo: nexus.operation<string, string>() });
export const asyncEchoService = nexus.service('AsyncEchoService', { echoAsync: nexus.operation<string, string>() });
