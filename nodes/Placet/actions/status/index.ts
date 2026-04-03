import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { placetApiRequest } from '../../GenericFunctions';

export async function ping(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const agentStatus = this.getNodeParameter('agentStatus', index) as string;
	const responseData = await placetApiRequest.call(this, 'POST', '/status/ping', {
		status: agentStatus,
	});
	return this.helpers.returnJsonArray(responseData as IDataObject);
}
