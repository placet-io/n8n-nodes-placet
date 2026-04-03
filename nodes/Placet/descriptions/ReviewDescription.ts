import type { INodeProperties } from 'n8n-workflow';

export const reviewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['review'],
			},
		},
		options: [
			{
				name: 'Get Pending',
				value: 'getPending',
				description: 'List all pending reviews',
				action: 'Get pending reviews',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a review by message ID',
				action: 'Get a review',
			},
		],
		default: 'getPending',
	},
];

export const reviewFields: INodeProperties[] = [
	// -- Get Pending --
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Optional: filter pending reviews by channel',
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
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['getPending'],
			},
		},
	},

	// -- Get --
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		description: 'The message ID that contains the review',
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['get'],
			},
		},
	},
];
