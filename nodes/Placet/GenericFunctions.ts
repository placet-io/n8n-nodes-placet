import type {
	IPollFunctions,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Extract the actual value from a resourceLocator parameter.
 * Handles both direct strings (from expressions) and RL objects.
 */
export function extractResourceLocatorValue(param: unknown): string {
	if (typeof param === 'string') return param;
	if (param && typeof param === 'object' && 'value' in param) {
		return (param as { value: string }).value;
	}
	return '';
}

/**
 * Make an authenticated API request to the Placet API.
 */
export async function placetApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] | Buffer | undefined = undefined,
	qs: IDataObject = {},
	options: Partial<IHttpRequestOptions> = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('placetApi');
	const baseUrl = (credentials.baseUrl as string) || 'http://localhost:3001';

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1${endpoint}`,
		headers: {
			Accept: 'application/json',
		},
		qs,
		...options,
	};

	if (body !== undefined && !(body instanceof Buffer)) {
		requestOptions.body = body;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'placetApi',
			requestOptions,
		)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Build a multipart/form-data body from fields (no external deps).
 */
function buildMultipartBody(fields: Record<string, unknown>): {
	body: Buffer;
	contentType: string;
} {
	const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
	const parts: Buffer[] = [];

	for (const [key, value] of Object.entries(fields)) {
		const header = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"`;

		if (value !== null && typeof value === 'object' && 'value' in value) {
			const entry = value as {
				value: Buffer;
				options?: { filename?: string; contentType?: string };
			};
			const filename = entry.options?.filename ?? key;
			const mime = entry.options?.contentType ?? 'application/octet-stream';
			parts.push(
				Buffer.from(`${header}; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`, 'utf8'),
				Buffer.from(entry.value),
				Buffer.from('\r\n', 'utf8'),
			);
		} else {
			parts.push(Buffer.from(`${header}\r\n\r\n${String(value)}\r\n`, 'utf8'));
		}
	}

	parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

	return {
		body: Buffer.concat(parts),
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}

/**
 * Upload a file to Placet via multipart form-data.
 */
export async function placetApiRequestFormData(
	ctx: IExecuteFunctions,
	endpoint: string,
	formData: Record<string, unknown>,
): Promise<IDataObject> {
	const credentials = await ctx.getCredentials('placetApi');
	const baseUrl = (credentials.baseUrl as string) || 'http://localhost:3001';

	const { body, contentType } = buildMultipartBody(formData);

	try {
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/api/v1${endpoint}`,
			headers: {
				Accept: 'application/json',
				'Content-Type': contentType,
			},
			body,
		};
		return (await ctx.helpers.httpRequestWithAuthentication.call(
			ctx,
			'placetApi',
			requestOptions,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(ctx.getNode(), error as JsonObject);
	}
}

/**
 * Download a file from Placet and return it as n8n binary data.
 */
export async function downloadBinaryOutput(
	this: IExecuteFunctions,
	endpoint: string,
	fallbackFileName: string,
): Promise<INodeExecutionData> {
	const credentials = await this.getCredentials('placetApi');
	const baseUrl = (credentials.baseUrl as string) || 'http://localhost:3001';

	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'placetApi', {
		method: 'GET',
		url: `${baseUrl}/api/v1${endpoint}`,
		returnFullResponse: true,
		encoding: 'arraybuffer',
	})) as { body: Buffer; headers: Record<string, string> };

	const contentType =
		response.headers?.['content-type']?.split(';')[0]?.trim() || 'application/octet-stream';

	let fileName = fallbackFileName;
	const disposition = response.headers?.['content-disposition'];
	if (disposition) {
		const match = /filename[^;=\n]*=["']?([^"';\n]+)["']?/i.exec(disposition);
		if (match?.[1]) {
			fileName = decodeURIComponent(match[1]);
		}
	}

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(response.body),
		fileName,
		contentType,
	);

	return {
		json: { fileName, mimeType: contentType },
		binary: { data: binaryData },
	} as unknown as INodeExecutionData;
}
