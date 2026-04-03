import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { placetApiRequest, extractResourceLocatorValue } from '../../GenericFunctions';

export async function getPending(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index, ''));
	const qs: IDataObject = {};
	if (channelId) qs.channel = channelId;

	const responseData = await placetApiRequest.call(this, 'GET', '/reviews/pending', undefined, qs);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function get(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', index) as string;
	const responseData = await placetApiRequest.call(this, 'GET', `/reviews/${messageId}`);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}
