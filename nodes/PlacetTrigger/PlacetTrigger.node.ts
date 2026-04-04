import type {
	IHookFunctions,
	IPollFunctions,
	IWebhookFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { placetApiRequest, extractResourceLocatorValue } from '../Placet/GenericFunctions';

export class PlacetTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Placet Trigger',
		name: 'placetTrigger',
		icon: 'file:placet.svg',
		group: ['trigger'],
		version: [1],
		description: 'Starts the workflow on a Placet event',
		defaults: {
			name: 'Placet Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
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
				path: 'placet-webhook',
			},
		],
		properties: [
			{
				displayName:
					'Each Placet channel (agent) can only have one active webhook at a time',
				name: 'placetTriggerNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						events: ['message:created', 'review:expired', 'review:responded'],
					},
				},
			},
			{
				displayName: 'Trigger On',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{
						name: 'Message Created',
						value: 'message:created',
						description: 'Trigger when a new message is sent in the channel (webhook)',
						action: 'On message created',
					},
					{
						name: 'New Messages (Polling)',
						value: 'poll',
						description:
							'Periodically poll for new messages at a regular interval instead of using a webhook',
						action: 'On new message (polling)',
					},
					{
						name: 'Review Expired',
						value: 'review:expired',
						description: 'Trigger when a review request expires (webhook)',
						action: 'On review expired',
					},
					{
						name: 'Review Responded',
						value: 'review:responded',
						description: 'Trigger when a user responds to a review request (webhook)',
						action: 'On review responded',
					},
				],
				default: [],
			},
			{
				displayName: 'Channel',
				name: 'channelId',
				type: 'resourceLocator',
				required: true,
				default: { mode: 'list', value: '' },
				description: 'The Placet channel (agent) to receive events from',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchChannels',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. clxyz456',
					},
				],
			},
			{
				displayName: 'Acknowledge Messages',
				name: 'acknowledgeMessages',
				type: 'boolean',
				default: true,
				description:
					'Whether to automatically acknowledge received messages (sets delivery status to agent_received)',
				displayOptions: {
					show: {
						events: ['poll'],
					},
				},
			},
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
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const events = this.getNodeParameter('events') as string[];
				const hasWebhookEvents = events.some((e) => e !== 'poll');
				if (!hasWebhookEvents) return true;

				const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId'));
				const webhookUrl = this.getNodeWebhookUrl('default');

				const agents = (await placetApiRequest.call(this, 'GET', '/agents')) as IDataObject[];
				const agent = agents.find((a) => a.id === channelId);

				return agent?.webhookUrl === webhookUrl;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const events = this.getNodeParameter('events') as string[];
				const hasWebhookEvents = events.some((e) => e !== 'poll');
				if (!hasWebhookEvents) return true;

				const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId'));
				const webhookUrl = this.getNodeWebhookUrl('default');

				await placetApiRequest.call(this, 'POST', '/agents/setWebhook', {
					url: webhookUrl,
					channelId,
				});

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const events = this.getNodeParameter('events') as string[];
				const hasWebhookEvents = events.some((e) => e !== 'poll');
				if (!hasWebhookEvents) return true;

				const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId'));

				try {
					await placetApiRequest.call(this, 'POST', '/agents/deleteWebhook', {
						channelId,
					});
				} catch {
					// Ignore errors during cleanup
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;

		const events = this.getNodeParameter('events') as string[];
		const webhookEvents = events.filter((e) => e !== 'poll');
		const eventType = body.event as string | undefined;

		if (eventType && webhookEvents.length > 0 && !webhookEvents.includes(eventType)) {
			return { webhookResponse: 'OK' };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const events = this.getNodeParameter('events') as string[];
		if (!events.includes('poll')) return null;

		const channelId = extractResourceLocatorValue(this.getNodeParameter('channelId'));
		const acknowledgeMessages = this.getNodeParameter('acknowledgeMessages') as boolean;

		const staticData = this.getWorkflowStaticData('node');
		const lastTimestamp = staticData.lastTimestamp as string | undefined;

		const qs: IDataObject = {
			channel: channelId,
			limit: 50,
		};

		const response = (await placetApiRequest.call(
			this,
			'GET',
			'/messages',
			undefined,
			qs,
		)) as IDataObject;
		const messages =
			(response.data as IDataObject[] | undefined) ?? (Array.isArray(response) ? response : []);

		if (!messages.length) {
			return null;
		}

		let newMessages = messages;
		if (lastTimestamp) {
			newMessages = messages.filter((msg) => {
				const createdAt = msg.createdAt as string;
				return new Date(createdAt) > new Date(lastTimestamp);
			});
		}

		if (!newMessages.length) {
			return null;
		}

		newMessages.sort((a, b) => {
			return new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime();
		});

		const latestMessage = newMessages[newMessages.length - 1];
		staticData.lastTimestamp = latestMessage.createdAt as string;

		if (acknowledgeMessages) {
			for (const msg of newMessages) {
				try {
					await placetApiRequest.call(
						this,
						'POST',
						`/messages/${msg.id as string}/ack`,
						undefined,
						{
							channel: channelId,
						},
					);
				} catch {
					// Ignore ack errors — message may already be acked
				}
			}
		}

		const returnData: INodeExecutionData[] = newMessages.map((msg) => ({
			json: msg,
		}));

		return [returnData];
	}
}
