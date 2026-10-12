import type { DataConverter } from '@temporalio/common';

// Copy the application's actual converter configuration here. Codec order matters.
// For example:
// import { myCodec } from './custom-codec.js';
// export const dataConverter: DataConverter = {
//   payloadConverterPath: '/absolute/path/to/custom-payload-converter.cjs',
//   payloadCodecs: [myCodec],
// };
export const dataConverter: DataConverter = {};
