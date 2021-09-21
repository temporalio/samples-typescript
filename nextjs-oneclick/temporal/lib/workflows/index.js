"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.example = void 0;
// @@@SNIPSTART nodejs-hello-workflow
const workflow_1 = require("@temporalio/workflow");
const { greet } = (0, workflow_1.createActivityHandle)({
    startToCloseTimeout: '1 minute',
});
/** A workflow that simply calls an activity */
const example = (name) => {
    return {
        async execute() {
            return await greet(name);
        },
    };
};
exports.example = example;
// @@@SNIPEND
