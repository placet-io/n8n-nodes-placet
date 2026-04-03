import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import * as message from './message/index';
import * as review from './review/index';
import * as file from './file/index';
import * as status from './status/index';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter('resource', 0) as string;
	const operation = this.getNodeParameter('operation', 0) as string;

	for (let i = 0; i < items.length; i++) {
		try {
			let result: INodeExecutionData[] = [];

			if (resource === 'message') {
				switch (operation) {
					case 'send':
						result = await message.send.call(this, i);
						break;
					case 'requestApproval':
						result = await message.requestApproval.call(this, i);
						break;
					case 'requestSelection':
						result = await message.requestSelection.call(this, i);
						break;
					case 'requestForm':
						result = await message.requestForm.call(this, i);
						break;
					case 'requestTextInput':
						result = await message.requestTextInput.call(this, i);
						break;
					case 'requestPlugin':
						result = await message.requestPlugin.call(this, i);
						break;
					case 'sendAndWait':
						result = await message.sendAndWait.call(this, i);
						break;
					case 'get':
						result = await message.get.call(this, i);
						break;
					case 'getMany':
						result = await message.getMany.call(this, i);
						break;
					case 'delete':
						result = await message.deleteMessage.call(this, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown message operation: ${operation}`,
							{ itemIndex: i },
						);
				}
			} else if (resource === 'review') {
				switch (operation) {
					case 'getPending':
						result = await review.getPending.call(this, i);
						break;
					case 'get':
						result = await review.get.call(this, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown review operation: ${operation}`, {
							itemIndex: i,
						});
				}
			} else if (resource === 'file') {
				switch (operation) {
					case 'upload':
						result = await file.upload.call(this, i);
						break;
					case 'download':
						result = await file.download.call(this, i);
						break;
					case 'getMany':
						result = await file.getMany.call(this, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown file operation: ${operation}`, {
							itemIndex: i,
						});
				}
			} else if (resource === 'status') {
				switch (operation) {
					case 'ping':
						result = await status.ping.call(this, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown status operation: ${operation}`, {
							itemIndex: i,
						});
				}
			} else {
				throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
					itemIndex: i,
				});
			}

			returnData.push(...result);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: (error as Error).message },
					pairedItem: { item: i },
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
