import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import {
	placetApiRequest,
	placetApiRequestFormData,
	downloadBinaryOutput,
	extractResourceLocatorValue,
} from '../../GenericFunctions';

export async function upload(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;

	const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);

	const formData: Record<string, unknown> = {
		channelId,
		file: {
			value: buffer,
			options: {
				filename: binaryData.fileName ?? 'file',
				contentType: binaryData.mimeType ?? 'application/octet-stream',
			},
		},
	};

	const responseData = await placetApiRequestFormData(this, '/files/upload', formData);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function download(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const fileId = this.getNodeParameter('fileId', index) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;

	const result = await downloadBinaryOutput.call(
		this,
		`/files/${fileId}/download`,
		`file-${fileId}`,
	);

	// Rename the binary key if needed
	if (binaryPropertyName !== 'data' && result.binary?.data) {
		result.binary[binaryPropertyName] = result.binary.data;
		delete result.binary.data;
	}

	return [result];
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index, ''));
	const limit = this.getNodeParameter('limit', index, 20) as number;

	const qs: IDataObject = { limit };
	if (channelId) qs.channel = channelId;

	const responseData = await placetApiRequest.call(this, 'GET', '/files', undefined, qs);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}
