import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
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
		subtitle: 'Polls for new messages',
		description: 'Triggers when a new message is received in a Placet channel',
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
		properties: [
			{
				displayName: 'Channel',
				name: 'channelId',
				type: 'resourceLocator',
				required: true,
				default: { mode: 'list', value: '' },
				description: 'The Placet channel (agent) to poll for new messages',
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
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

		// Filter messages newer than last seen
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

		// Sort ascending by createdAt
		newMessages.sort((a, b) => {
			return new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime();
		});

		// Update static data with latest timestamp
		const latestMessage = newMessages[newMessages.length - 1];
		staticData.lastTimestamp = latestMessage.createdAt as string;

		// Acknowledge messages
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
