import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { placetApiRequest, extractResourceLocatorValue } from '../../GenericFunctions';

export async function send(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

	const body: IDataObject = { channelId };
	if (text) body.text = text;
	if (additionalFields.status) body.status = additionalFields.status;
	if (additionalFields.metadata) {
		body.metadata =
			typeof additionalFields.metadata === 'string'
				? JSON.parse(additionalFields.metadata)
				: additionalFields.metadata;
	}
	if (additionalFields.attachmentIds) {
		body.attachmentIds = (additionalFields.attachmentIds as string).split(',').map((s) => s.trim());
	}

	const responseData = await placetApiRequest.call(this, 'POST', '/messages', body);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function requestApproval(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const inputMode = this.getNodeParameter('inputMode', index) as string;
	const waitForResponse = this.getNodeParameter('waitForResponse', index, true) as boolean;

	let review: IDataObject;

	if (inputMode === 'customJson') {
		const reviewJson = this.getNodeParameter('reviewJson', index) as string;
		review = typeof reviewJson === 'string' ? JSON.parse(reviewJson) : reviewJson;
	} else {
		const approvalOptions = this.getNodeParameter(
			'approvalOptions.values',
			index,
			[],
		) as IDataObject[];
		const allowComment = this.getNodeParameter('allowComment', index) as boolean;
		const expiresInSeconds = this.getNodeParameter('expiresInSeconds', index) as number;

		review = {
			type: 'approval',
			payload: {
				options: approvalOptions.map((o) => ({
					id: o.id,
					label: o.label,
					style: o.style,
				})),
				allowComment,
			},
			expiresInSeconds,
		};
	}

	const body: IDataObject = { channelId, review };
	if (text) body.text = text;

	if (waitForResponse) {
		const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
		const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
		body.webhookUrl = `${resumeUrl}/${nodeId}`;
	}

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function requestSelection(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const inputMode = this.getNodeParameter('inputMode', index) as string;
	const waitForResponse = this.getNodeParameter('waitForResponse', index) as boolean;

	let review: IDataObject;

	if (inputMode === 'customJson') {
		const reviewJson = this.getNodeParameter('reviewJson', index) as string;
		review = typeof reviewJson === 'string' ? JSON.parse(reviewJson) : reviewJson;
	} else {
		const selectionMode = this.getNodeParameter('selectionMode', index) as string;
		const selectionItems = this.getNodeParameter(
			'selectionItems.values',
			index,
			[],
		) as IDataObject[];
		const expiresInSeconds = this.getNodeParameter('expiresInSeconds', index) as number;

		review = {
			type: 'selection',
			payload: {
				mode: selectionMode,
				items: selectionItems.map((item) => {
					const mapped: IDataObject = { id: item.id, label: item.label };
					if (item.description) mapped.description = item.description;
					return mapped;
				}),
			},
			expiresInSeconds,
		};
	}

	const body: IDataObject = { channelId, review };
	if (text) body.text = text;

	if (waitForResponse) {
		const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
		const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
		body.webhookUrl = `${resumeUrl}/${nodeId}`;
	}

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function requestForm(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const inputMode = this.getNodeParameter('inputMode', index) as string;
	const waitForResponse = this.getNodeParameter('waitForResponse', index) as boolean;

	let review: IDataObject;

	if (inputMode === 'customJson') {
		const reviewJson = this.getNodeParameter('reviewJson', index) as string;
		review = typeof reviewJson === 'string' ? JSON.parse(reviewJson) : reviewJson;
	} else {
		const formFields = this.getNodeParameter('formFields.values', index, []) as IDataObject[];
		const submitLabel = this.getNodeParameter('submitLabel', index) as string;
		const expiresInSeconds = this.getNodeParameter('expiresInSeconds', index) as number;

		const fields = formFields.map((f) => {
			const field: IDataObject = {
				type: f.type,
				name: f.name,
				label: f.label,
			};
			if (f.required) field.required = true;
			if (f.placeholder) field.placeholder = f.placeholder;
			if (f.defaultValue) field.defaultValue = f.defaultValue;
			if (f.selectOptions) {
				const selectOpts = (f.selectOptions as IDataObject).values as IDataObject[] | undefined;
				if (selectOpts && selectOpts.length > 0) {
					field.options = selectOpts.map((o) => ({
						value: o.value,
						label: o.label,
					}));
				}
			}
			return field;
		});

		const payload: IDataObject = { fields };
		if (submitLabel) payload.submitLabel = submitLabel;

		review = {
			type: 'form',
			payload,
			expiresInSeconds,
		};
	}

	const body: IDataObject = { channelId, review };
	if (text) body.text = text;

	if (waitForResponse) {
		const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
		const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
		body.webhookUrl = `${resumeUrl}/${nodeId}`;
	}

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function requestTextInput(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const inputMode = this.getNodeParameter('inputMode', index) as string;
	const waitForResponse = this.getNodeParameter('waitForResponse', index) as boolean;

	let review: IDataObject;

	if (inputMode === 'customJson') {
		const reviewJson = this.getNodeParameter('reviewJson', index) as string;
		review = typeof reviewJson === 'string' ? JSON.parse(reviewJson) : reviewJson;
	} else {
		const expiresInSeconds = this.getNodeParameter('expiresInSeconds', index) as number;
		const payload: IDataObject = {};

		const placeholder = this.getNodeParameter('textInputPlaceholder', index) as string;
		const prefill = this.getNodeParameter('textInputPrefill', index) as string;
		const markdown = this.getNodeParameter('textInputMarkdown', index) as boolean;

		if (placeholder) payload.placeholder = placeholder;
		if (prefill) payload.prefill = prefill;
		payload.markdown = markdown;

		review = {
			type: 'text-input',
			payload,
			expiresInSeconds,
		};
	}

	const body: IDataObject = { channelId, review };
	if (text) body.text = text;

	if (waitForResponse) {
		const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
		const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
		body.webhookUrl = `${resumeUrl}/${nodeId}`;
	}

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function get(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', index) as string;
	const responseData = await placetApiRequest.call(this, 'GET', `/messages/${messageId}`);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function getMany(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const limit = this.getNodeParameter('limit', index) as number;
	const additionalFields = this.getNodeParameter(
		'getManyAdditionalFields',
		index,
		{},
	) as IDataObject;

	const qs: IDataObject = { channel: channelId, limit };
	if (additionalFields.cursor) qs.cursor = additionalFields.cursor;
	if (additionalFields.search) qs.search = additionalFields.search;

	const responseData = await placetApiRequest.call(this, 'GET', '/messages', undefined, qs);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function deleteMessage(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', index) as string;
	const responseData = await placetApiRequest.call(this, 'DELETE', `/messages/${messageId}`);
	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function requestPlugin(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const text = this.getNodeParameter('text', index) as string;
	const inputMode = this.getNodeParameter('inputMode', index) as string;
	const waitForResponse = this.getNodeParameter('waitForResponse', index) as boolean;

	let review: IDataObject;

	if (inputMode === 'customJson') {
		const reviewJson = this.getNodeParameter('reviewJson', index) as string;
		review = typeof reviewJson === 'string' ? JSON.parse(reviewJson) : reviewJson;
	} else {
		const pluginObj = this.getNodeParameter('pluginName', index) as IDataObject;
		const pluginName = pluginObj.value as string;
		const fieldsParam = this.getNodeParameter('pluginFields', index) as {
			value: IDataObject | null;
			schema: Array<{ id: string; type: string }>;
		};
		const expiresInSeconds = this.getNodeParameter('expiresInSeconds', index) as number;

		const parsedFields: IDataObject = { ...(fieldsParam.value || {}) };
		if (fieldsParam.value && fieldsParam.schema) {
			for (const field of fieldsParam.schema) {
				const val = parsedFields[field.id];
				if ((field.type === 'array' || field.type === 'object') && typeof val === 'string') {
					parsedFields[field.id] = JSON.parse(val as string);
				}
			}
		}

		review = {
			type: pluginName,
			payload: parsedFields,
			expiresInSeconds,
		};
	}

	const body: IDataObject = { channelId, review };
	if (text) body.text = text;

	if (waitForResponse) {
		const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
		const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
		body.webhookUrl = `${resumeUrl}/${nodeId}`;
	}

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}

export async function sendAndWait(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId', index));
	const messageText = this.getNodeParameter('message', index) as string;
	const approvalValues = this.getNodeParameter('approvalOptions.values', index, {}) as IDataObject;
	const options = this.getNodeParameter('options', index, {}) as IDataObject;

	const approvalType = (approvalValues.approvalType as string) || 'double';
	const approveLabel = (approvalValues.approveLabel as string) || 'Approve';
	const disapproveLabel = (approvalValues.disapproveLabel as string) || 'Decline';

	const approvalOpts: IDataObject[] = [{ id: 'approve', label: approveLabel, style: 'primary' }];
	if (approvalType === 'double') {
		approvalOpts.push({ id: 'reject', label: disapproveLabel, style: 'danger' });
	}

	const review: IDataObject = {
		type: 'approval',
		payload: {
			options: approvalOpts,
			allowComment: false,
		},
	};

	const body: IDataObject = { channelId, review };

	let text = messageText;
	if (options.appendAttribution) {
		text = text
			? `${text}\n\n_This message was sent automatically with n8n_`
			: '_This message was sent automatically with n8n_';
	}
	if (text) body.text = text;

	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', index) as string;
	const nodeId = this.evaluateExpression('{{ $nodeId }}', index) as string;
	body.webhookUrl = `${resumeUrl}/${nodeId}`;

	const responseData = (await placetApiRequest.call(
		this,
		'POST',
		'/messages',
		body,
	)) as IDataObject;

	return this.helpers.returnJsonArray(responseData as IDataObject);
}
