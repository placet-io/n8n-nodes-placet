import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	ResourceMapperFields,
	ResourceMapperField,
	IDataObject,
} from 'n8n-workflow';
import { WAIT_INDEFINITELY, NodeOperationError } from 'n8n-workflow';

import { router } from './actions/router';
import { placetApiRequest } from './GenericFunctions';

function mapJsonSchemaType(schemaType: string | undefined): string {
	switch (schemaType) {
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'array':
			return 'array';
		case 'object':
			return 'object';
		default:
			return 'string';
	}
}

import { messageOperations, messageFields } from './descriptions/MessageDescription';
import { reviewOperations, reviewFields } from './descriptions/ReviewDescription';
import { fileOperations, fileFields } from './descriptions/FileDescription';
import { statusOperations, statusFields } from './descriptions/StatusDescription';

export class Placet implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Placet',
		name: 'placet',
		icon: 'file:placet.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Placet Human-in-the-Loop API',
		defaults: {
			name: 'Placet',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'placetApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				responseData: '',
				path: '={{ $nodeId }}',
				restartWebhook: true,
				isFullPath: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Review',
						value: 'review',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Agent Status',
						value: 'status',
					},
				],
				default: 'message',
			},
			...messageOperations,
			...messageFields,
			...reviewOperations,
			...reviewFields,
			...fileOperations,
			...fileFields,
			...statusOperations,
			...statusFields,
		],
	};

	methods = {
		listSearch: {
			async searchChannels(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const response = (await placetApiRequest.call(this, 'GET', '/agents')) as IDataObject[];

				const agents = Array.isArray(response) ? response : [];

				return {
					results: agents
						.filter(
							(a) =>
								!filter ||
								((a.name as string) || (a.id as string))
									.toLowerCase()
									.includes(filter.toLowerCase()),
						)
						.map((a) => ({
							name: (a.name as string) || (a.id as string),
							value: a.id as string,
						})),
				};
			},
			async searchPlugins(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const response = (await placetApiRequest.call(this, 'GET', '/plugins')) as IDataObject[];

				const plugins = Array.isArray(response) ? response : [];

				return {
					results: plugins
						.filter(
							(p) =>
								!filter ||
								((p.displayName as string) || (p.name as string))
									.toLowerCase()
									.includes(filter.toLowerCase()),
						)
						.map((p) => ({
							name: (p.displayName as string) || (p.name as string),
							value: p.name as string,
						})),
				};
			},
		},
		resourceMapping: {
			async getPluginFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const pluginObj = this.getNodeParameter('pluginName', 0) as IDataObject | null;
				if (!pluginObj?.value) return { fields: [] };

				const plugin = (await placetApiRequest.call(
					this,
					'GET',
					`/plugins/${pluginObj.value}`,
				)) as IDataObject;

				const inputSchema = plugin.inputSchema as IDataObject | undefined;
				if (!inputSchema?.properties) return { fields: [] };

				const properties = inputSchema.properties as Record<string, IDataObject>;
				const requiredFields = (inputSchema.required as string[]) || [];

				const fields: ResourceMapperField[] = Object.entries(properties).map(([key, prop]) => {
					const base: ResourceMapperField = {
						id: key,
						displayName: key,
						required: requiredFields.includes(key),
						defaultMatch: false,
						canBeUsedToMatch: false,
						display: true,
						type: (prop.enum
							? 'options'
							: mapJsonSchemaType(prop.type as string)) as ResourceMapperField['type'],
					};
					if (prop.enum) {
						base.options = (prop.enum as string[]).map((e) => ({
							name: e,
							value: e,
						}));
					}
					return base;
				});

				return { fields };
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const result = await router.call(this);

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const reviewOps = [
			'requestApproval',
			'requestSelection',
			'requestForm',
			'requestTextInput',
			'requestPlugin',
		];

		const shouldWait =
			resource === 'message' &&
			(operation === 'sendAndWait' ||
				(reviewOps.includes(operation) &&
					(this.getNodeParameter('waitForResponse', 0, false) as boolean)));

		if (shouldWait) {
			let waitTill: Date;

			if (operation === 'sendAndWait') {
				waitTill = WAIT_INDEFINITELY as Date;
				const limitOptions = this.getNodeParameter(
					'options.limitWaitTime.values',
					0,
					{},
				) as IDataObject;

				if (Object.keys(limitOptions).length) {
					if (limitOptions.limitType === 'afterTimeInterval') {
						let waitAmount = limitOptions.resumeAmount as number;
						if (limitOptions.resumeUnit === 'minutes') waitAmount *= 60;
						if (limitOptions.resumeUnit === 'hours') waitAmount *= 60 * 60;
						if (limitOptions.resumeUnit === 'days') waitAmount *= 60 * 60 * 24;
						waitTill = new Date(Date.now() + waitAmount * 1000);
					} else {
						waitTill = new Date(limitOptions.maxDateAndTime as string);
					}

					if (isNaN(waitTill.getTime())) {
						throw new NodeOperationError(this.getNode(), 'Could not configure Limit Wait Time', {
							description: 'Invalid date format',
						});
					}
				}
			} else {
				const maxWaitMinutes = this.getNodeParameter('maxWaitMinutes', 0, 1440) as number;
				waitTill =
					maxWaitMinutes > 0
						? new Date(Date.now() + maxWaitMinutes * 60 * 1000)
						: (WAIT_INDEFINITELY as Date);
			}

			await this.putExecutionToWait(waitTill);
			return [this.getInputData()];
		}

		return result;
	}

	webhook = async function (this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	};
}
