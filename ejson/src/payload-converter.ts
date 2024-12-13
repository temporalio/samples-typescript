// @@@SNIPSTART typescript-ejson-converter
import { CompositePayloadConverter, UndefinedPayloadConverter } from '@temporalio/common';
import { EjsonPayloadConverter } from './ejson-payload-converter';

export const payloadConverter = new CompositePayloadConverter(
  new UndefinedPayloadConverter(),
  new EjsonPayloadConverter(),
);
// @@@SNIPEND
