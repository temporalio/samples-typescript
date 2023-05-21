// json-module.js is generated with:
// pbjs -t json-module -w commonjs -o json-module.js protos/*.proto

// @@@SNIPSTART typescript-protobuf-root
const { patchProtobufRoot } = require('@temporalio/common/lib/protobufs');
const unpatchedRoot = require('./json-module');
module.exports = patchProtobufRoot(unpatchedRoot);
// @@@SNIPEND
