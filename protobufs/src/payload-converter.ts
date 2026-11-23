// @@@SNIPSTART typescript-protobuf-converter
import { DefaultPayloadConverterWithProtobufs } from '@temporalio/common/protobufs';
import root from '../protos/root';

export const payloadConverter = new DefaultPayloadConverterWithProtobufs({ protobufRoot: root });
// @@@SNIPEND
