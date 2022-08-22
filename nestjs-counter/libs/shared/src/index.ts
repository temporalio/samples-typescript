import { defineQuery, defineSignal } from '@temporalio/workflow';

export const taskQueue = 'nest-test';

export const incrementSignal = defineSignal<[number]>('increment');
export const getValueQuery = defineQuery<number>('getValue');
