import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a message',
				action: 'Delete a message',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a message by ID',
				action: 'Get a message',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'List messages in a channel',
				action: 'Get many messages',
			},
			{
				name: 'Request Approval',
				value: 'requestApproval',
				description: 'Send a message with approval buttons and optionally wait for a response',
				action: 'Request approval',
			},
			{
				name: 'Request Form',
				value: 'requestForm',
				description: 'Send a message with a dynamic form and optionally wait for a response',
				action: 'Request form input',
			},
			{
				name: 'Request Plugin Review',
				value: 'requestPlugin',
				description:
					'Send a message with a plugin-based review (fields loaded from the plugin schema) and optionally wait for a response',
				action: 'Request plugin review',
			},
			{
				name: 'Request Selection',
				value: 'requestSelection',
				description: 'Send a message with a selection list and optionally wait for a response',
				action: 'Request selection',
			},
			{
				name: 'Request Text Input',
				value: 'requestTextInput',
				description:
					'Send a message with a free-form text input and optionally wait for a response',
				action: 'Request text input',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send a text message to a channel',
				action: 'Send a message',
			},
			{
				name: 'Send and Wait for Response',
				value: 'sendAndWait',
				description: 'Send a review request and wait for the human response',
				action: 'Send and wait for response',
			},
		],
		default: 'send',
	},
];

// ── Shared fields ──────────────────────────────────────────────────────

const channelIdField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The Placet channel (agent) ID',
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
};

const messageIdField: INodeProperties = {
	displayName: 'Message ID',
	name: 'messageId',
	type: 'string',
	required: true,
	default: '',
	description: 'The ID of the message',
};

const waitForResponseField: INodeProperties = {
	displayName: 'Wait for Response',
	name: 'waitForResponse',
	type: 'boolean',
	default: true,
	description:
		'Whether to wait for the user to respond before continuing the workflow. If enabled, the node blocks until the review is completed, expired, or times out.',
};

const maxWaitMinutesField: INodeProperties = {
	displayName: 'Max Wait (Minutes)',
	name: 'maxWaitMinutes',
	type: 'number',
	default: 1440,
	description: 'Maximum time to wait for a response in minutes (default: 1440 = 24 hours)',
};

const inputModeField: INodeProperties = {
	displayName: 'Input Mode',
	name: 'inputMode',
	type: 'options',
	options: [
		{
			name: 'Simple',
			value: 'simple',
			description: 'Use the built-in form fields',
		},
		{
			name: 'Custom JSON',
			value: 'customJson',
			description: 'Provide the full review object as JSON',
		},
	],
	default: 'simple',
	description: 'How to configure the review request',
};

const customReviewJsonField: INodeProperties = {
	displayName: 'Review JSON',
	name: 'reviewJson',
	type: 'json',
	default: '{}',
	description:
		'The full review object as JSON. Must include "type" and "payload". See the <a href="https://docs.placet.io">Placet docs</a> for the schema.',
};

const expiresInSecondsField: INodeProperties = {
	displayName: 'Expires In (Seconds)',
	name: 'expiresInSeconds',
	type: 'number',
	default: 86400,
	description: 'Time in seconds until the review expires (default: 86400 = 24 hours)',
};

// ── Send fields ────────────────────────────────────────────────────────

export const messageFields: INodeProperties[] = [
	// -- Send --
	{
		...channelIdField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: [
					'send',
					'requestApproval',
					'requestSelection',
					'requestForm',
					'requestTextInput',
					'requestPlugin',
					'getMany',
				],
			},
		},
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: 'The message text (supports Markdown)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: [
					'send',
					'requestApproval',
					'requestSelection',
					'requestForm',
					'requestTextInput',
					'requestPlugin',
				],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Info', value: 'info' },
					{ name: 'Success', value: 'success' },
					{ name: 'Warning', value: 'warning' },
					{ name: 'Error', value: 'error' },
				],
				default: 'info',
				description: 'The visual status indicator of the message',
			},
			{
				displayName: 'Metadata (JSON)',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Arbitrary metadata to attach to the message',
			},
			{
				displayName: 'Attachment IDs',
				name: 'attachmentIds',
				type: 'string',
				default: '',
				description:
					'Comma-separated list of previously uploaded file IDs to attach to the message',
			},
		],
	},

	// ── Request Approval ───────────────────────────────────────────────

	{
		...inputModeField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'approvalOptions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {
			values: [
				{ id: 'approve', label: 'Approve', style: 'primary' },
				{ id: 'reject', label: 'Reject', style: 'danger' },
			],
		},
		description: 'The approval buttons to show',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
				inputMode: ['simple'],
			},
		},
		options: [
			{
				name: 'values',
				displayName: 'Option',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						description: 'Unique identifier for this option',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Button label text',
					},
					{
						displayName: 'Style',
						name: 'style',
						type: 'options',
						options: [
							{ name: 'Primary', value: 'primary' },
							{ name: 'Danger', value: 'danger' },
							{ name: 'Secondary', value: 'secondary' },
							{ name: 'Ghost', value: 'ghost' },
						],
						default: 'primary',
						description: 'Button visual style',
					},
				],
			},
		],
	},
	{
		displayName: 'Allow Comment',
		name: 'allowComment',
		type: 'boolean',
		default: false,
		description: 'Whether to allow the user to add an optional comment with their response',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...customReviewJsonField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
				inputMode: ['customJson'],
			},
		},
	},
	{
		...expiresInSecondsField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...waitForResponseField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
			},
		},
	},
	{
		...maxWaitMinutesField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestApproval'],
				waitForResponse: [true],
			},
		},
	},

	// ── Request Selection ──────────────────────────────────────────────

	{
		...inputModeField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
			},
		},
	},
	{
		displayName: 'Selection Mode',
		name: 'selectionMode',
		type: 'options',
		options: [
			{ name: 'Single', value: 'single' },
			{ name: 'Multiple', value: 'multi' },
		],
		default: 'single',
		description: 'Whether the user can select one or multiple items',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
				inputMode: ['simple'],
			},
		},
	},
	{
		displayName: 'Items',
		name: 'selectionItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: { values: [] },
		description: 'The items to choose from',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
				inputMode: ['simple'],
			},
		},
		options: [
			{
				name: 'values',
				displayName: 'Item',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						description: 'Unique identifier for this item',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Display text for this item',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Optional description shown below the label',
					},
				],
			},
		],
	},
	{
		...customReviewJsonField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
				inputMode: ['customJson'],
			},
		},
	},
	{
		...expiresInSecondsField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...waitForResponseField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
			},
		},
	},
	{
		...maxWaitMinutesField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestSelection'],
				waitForResponse: [true],
			},
		},
	},

	// ── Request Form ───────────────────────────────────────────────────

	{
		...inputModeField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
			},
		},
	},
	{
		displayName: 'Fields',
		name: 'formFields',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: { values: [] },
		description: 'The form fields to show',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
				inputMode: ['simple'],
			},
		},
		options: [
			{
				name: 'values',
				displayName: 'Field',
				values: [
					{
						displayName: 'Default Value',
						name: 'defaultValue',
						type: 'string',
						default: '',
						description: 'Pre-filled default value',
						displayOptions: {
							show: {
								type: [
									'text',
									'textarea',
									'email',
									'url',
									'number',
									'password',
									'date',
									'datetime',
									'time',
								],
							},
						},
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Display label shown to the user',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Field name used as key in the response data',
					},
					{
						displayName: 'Options',
						name: 'selectOptions',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: { values: [] },
						description: 'The dropdown options to show',
						displayOptions: {
							show: {
								type: ['select'],
							},
						},
						options: [
							{
								name: 'values',
								displayName: 'Option',
								values: [
									{
										displayName: 'Label',
										name: 'label',
										type: 'string',
										default: '',
										description: 'The display text for this option',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'The value submitted when this option is selected',
									},
								],
							},
						],
					},
					{
						displayName: 'Placeholder',
						name: 'placeholder',
						type: 'string',
						default: '',
						description: 'Placeholder text shown in the input',
						displayOptions: {
							show: {
								type: [
									'text',
									'textarea',
									'email',
									'url',
									'number',
									'password',
								],
							},
						},
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: false,
						description: 'Whether this field must be filled out',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Checkbox', value: 'checkbox' },
							{ name: 'Date', value: 'date' },
							{ name: 'DateTime', value: 'datetime' },
							{ name: 'Email', value: 'email' },
							{ name: 'Number', value: 'number' },
							{ name: 'Password', value: 'password' },
							{ name: 'Range', value: 'range' },
							{ name: 'Select', value: 'select' },
							{ name: 'Text', value: 'text' },
							{ name: 'Textarea', value: 'textarea' },
							{ name: 'Time', value: 'time' },
							{ name: 'URL', value: 'url' },
						],
						default: 'text',
						description: 'The field input type',
					},
				],
			},
		],
	},
	{
		displayName: 'Submit Label',
		name: 'submitLabel',
		type: 'string',
		default: '',
		description: 'Custom submit button label',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...customReviewJsonField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
				inputMode: ['customJson'],
			},
		},
	},
	{
		...expiresInSecondsField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...waitForResponseField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
			},
		},
	},
	{
		...maxWaitMinutesField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestForm'],
				waitForResponse: [true],
			},
		},
	},

	// ── Request Text Input ─────────────────────────────────────────────

	{
		...inputModeField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
			},
		},
	},
	{
		displayName: 'Placeholder',
		name: 'textInputPlaceholder',
		type: 'string',
		default: '',
		description: 'Placeholder text for the input field',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				inputMode: ['simple'],
			},
		},
	},
	{
		displayName: 'Prefill',
		name: 'textInputPrefill',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Pre-filled text in the input',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				inputMode: ['simple'],
			},
		},
	},
	{
		displayName: 'Enable Markdown',
		name: 'textInputMarkdown',
		type: 'boolean',
		default: true,
		description: 'Whether to enable Markdown editing',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...customReviewJsonField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				inputMode: ['customJson'],
			},
		},
	},
	{
		...expiresInSecondsField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...waitForResponseField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
			},
		},
	},
	{
		...maxWaitMinutesField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestTextInput'],
				waitForResponse: [true],
			},
		},
	},

	// ── Request Plugin Review ───────────────────────────────────────────

	{
		...inputModeField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
			},
		},
	},
	{
		displayName: 'Plugin',
		name: 'pluginName',
		type: 'resourceLocator',
		description:
			'The plugin to use for the review. Choose from the list or specify a name using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		default: { mode: 'list', value: '' },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a Plugin...',
				typeOptions: {
					searchListMethod: 'searchPlugins',
					searchable: true,
				},
			},
			{
				displayName: 'By Name',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. form-submit',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
				inputMode: ['simple'],
			},
		},
	},
	{
		displayName: 'Plugin Fields',
		name: 'pluginFields',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		typeOptions: {
			loadOptionsDependsOn: ['pluginName.value'],
			resourceMapper: {
				resourceMapperMethod: 'getPluginFields',
				mode: 'add',
				valuesLabel: 'Fields',
				fieldWords: {
					singular: 'field',
					plural: 'fields',
				},
				supportAutoMap: false,
			},
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
				inputMode: ['simple'],
			},
			hide: { pluginName: [''] },
		},
	},
	{
		...customReviewJsonField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
				inputMode: ['customJson'],
			},
		},
	},
	{
		...expiresInSecondsField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
				inputMode: ['simple'],
			},
		},
	},
	{
		...waitForResponseField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
			},
		},
	},
	{
		...maxWaitMinutesField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['requestPlugin'],
				waitForResponse: [true],
			},
		},
	},

	// ── Get ────────────────────────────────────────────────────────────

	{
		...messageIdField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['get', 'delete'],
			},
		},
	},
	{
		...channelIdField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['get', 'delete'],
			},
		},
	},

	// ── Get Many ───────────────────────────────────────────────────────

	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getMany'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'getManyAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor for next page',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search text within messages',
			},
		],
	},

	// ── Send and Wait ──────────────────────────────────────────────────

	{
		...channelIdField,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendAndWait'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		description: 'The message to send with the review request',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendAndWait'],
			},
		},
	},
	{
		displayName: 'Approval Options',
		name: 'approvalOptions',
		type: 'fixedCollection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendAndWait'],
			},
		},
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Type of Approval',
						name: 'approvalType',
						type: 'options',
						default: 'double',
						options: [
							{
								name: 'Approve and Disapprove',
								value: 'double',
							},
							{
								name: 'Approve Only',
								value: 'single',
							},
						],
					},
					{
						displayName: 'Approve Button Label',
						name: 'approveLabel',
						type: 'string',
						default: 'Approve',
						displayOptions: {
							show: { approvalType: ['single', 'double'] },
						},
					},
					{
						displayName: 'Disapprove Button Label',
						name: 'disapproveLabel',
						type: 'string',
						default: 'Decline',
						displayOptions: {
							show: { approvalType: ['double'] },
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendAndWait'],
			},
		},
		options: [
			{
				displayName: 'Limit Wait Time',
				name: 'limitWaitTime',
				type: 'fixedCollection',
				description:
					'Whether to limit the time this node should wait for a user response before execution resumes',
				default: {
					values: {
						limitType: 'afterTimeInterval',
						resumeAmount: 1,
						resumeUnit: 'hours',
					},
				},
				options: [
					{
						displayName: 'Values',
						name: 'values',
						values: [
							{
								displayName: 'Limit Type',
								name: 'limitType',
								type: 'options',
								default: 'afterTimeInterval',
								description:
									'Sets the condition for the execution to resume. Can be a specified date or after some time.',
								options: [
									{
										name: 'After Time Interval',
										description: 'Waits for a certain amount of time',
										value: 'afterTimeInterval',
									},
									{
										name: 'At Specified Time',
										description: 'Waits until the set date and time to continue',
										value: 'atSpecifiedTime',
									},
								],
							},
							{
								displayName: 'Amount',
								name: 'resumeAmount',
								type: 'number',
								displayOptions: {
									show: {
										limitType: ['afterTimeInterval'],
									},
								},
								typeOptions: {
									minValue: 0,
									numberPrecision: 2,
								},
								default: 1,
								description: 'The time to wait',
							},
							{
								displayName: 'Unit',
								name: 'resumeUnit',
								type: 'options',
								displayOptions: {
									show: {
										limitType: ['afterTimeInterval'],
									},
								},
								options: [
									{ name: 'Minutes', value: 'minutes' },
									{ name: 'Hours', value: 'hours' },
									{ name: 'Days', value: 'days' },
								],
								default: 'hours',
								description: 'Unit of the interval value',
							},
							{
								displayName: 'Max Date and Time',
								name: 'maxDateAndTime',
								type: 'dateTime',
								displayOptions: {
									show: {
										limitType: ['atSpecifiedTime'],
									},
								},
								default: '',
								description: 'Continue execution after the specified date and time',
							},
						],
					},
				],
			},
			{
				displayName: 'Append N8n Attribution',
				name: 'appendAttribution',
				type: 'boolean',
				default: true,
				description:
					'Whether to include the phrase "This message was sent automatically with n8n" to the end of the message',
			},
		],
	},
];
