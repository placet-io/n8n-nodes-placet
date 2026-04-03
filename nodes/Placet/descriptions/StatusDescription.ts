import type { INodeProperties } from 'n8n-workflow';

export const statusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['status'],
			},
		},
		options: [
			{
				name: 'Ping',
				value: 'ping',
				description: 'Send a heartbeat ping to Placet',
				action: 'Ping',
			},
		],
		default: 'ping',
	},
];

export const statusFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'The channel (agent) to send the heartbeat for',
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
				resource: ['status'],
				operation: ['ping'],
			},
		},
	},
	{
		displayName: 'Status',
		name: 'agentStatus',
		type: 'options',
		options: [
			{ name: 'Active', value: 'active' },
			{ name: 'Busy', value: 'busy' },
			{ name: 'Error', value: 'error' },
			{ name: 'Offline', value: 'offline' },
		],
		default: 'active',
		description: 'The agent status to report',
		displayOptions: {
			show: {
				resource: ['status'],
				operation: ['ping'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'statusMessage',
		type: 'string',
		default: '',
		description: 'Optional status message (max 500 characters)',
		displayOptions: {
			show: {
				resource: ['status'],
				operation: ['ping'],
			},
		},
	},
];
