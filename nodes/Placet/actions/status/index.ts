import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { placetApiRequest, extractResourceLocatorValue } from '../../GenericFunctions';

export async function ping(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const agentId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const agentStatus = this.getNodeParameter('agentStatus', index) as string;
	const statusMessage = this.getNodeParameter('statusMessage', index) as string;

	const body: IDataObject = {
		agentId,
		status: agentStatus,
	};
	if (statusMessage) body.message = statusMessage;

	const responseData = await placetApiRequest.call(this, 'POST', '/status/ping', body);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}
