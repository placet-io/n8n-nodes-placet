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
		displayName: 'Status',
		name: 'agentStatus',
		type: 'options',
		options: [
			{ name: 'Active', value: 'active' },
			{ name: 'Idle', value: 'idle' },
			{ name: 'Busy', value: 'busy' },
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
];
