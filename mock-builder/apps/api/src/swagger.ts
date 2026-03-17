import swaggerJsdoc from 'swagger-jsdoc';

// =============================================================
// Reusable schema components
// =============================================================

const schemas = {
    // --- Pagination ---
    PaginationMeta: {
        type: 'object',
        properties: {
            page:  { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            pages: { type: 'integer', example: 5 },
        },
    },

    // --- Error ---
    ErrorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: false },
            error: {
                type: 'object',
                properties: {
                    code:    { type: 'string', example: 'NOT_FOUND' },
                    message: { type: 'string', example: 'Resource not found' },
                    field:   { type: 'string', example: 'email' },
                },
                required: ['code', 'message'],
            },
        },
    },

    // --- Customer ---
    Customer: {
        type: 'object',
        properties: {
            id:        { type: 'string', format: 'uuid' },
            tenantId:  { type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'Jane' },
            lastName:  { type: 'string', example: 'Doe' },
            email:     { type: 'string', format: 'email', example: 'jane@example.com' },
            phone:     { type: 'string', nullable: true, example: '+1-555-0100' },
            notes:     { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateCustomerBody: {
        type: 'object',
        required: ['email', 'firstName', 'lastName'],
        properties: {
            email:     { type: 'string', format: 'email', example: 'jane@example.com' },
            firstName: { type: 'string', minLength: 1, maxLength: 100, example: 'Jane' },
            lastName:  { type: 'string', minLength: 1, maxLength: 100, example: 'Doe' },
            phone:     { type: 'string', maxLength: 50, example: '+1-555-0100' },
            notes:     { type: 'string', example: 'VIP customer' },
        },
    },
    UpdateCustomerBody: {
        type: 'object',
        properties: {
            email:     { type: 'string', format: 'email' },
            firstName: { type: 'string', minLength: 1, maxLength: 100 },
            lastName:  { type: 'string', minLength: 1, maxLength: 100 },
            phone:     { type: 'string', maxLength: 50 },
            notes:     { type: 'string' },
        },
    },
    SearchCustomerBody: {
        type: 'object',
        required: ['q'],
        properties: {
            q:     { type: 'string', minLength: 1, example: 'Jane' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
    },

    // --- Service ---
    Service: {
        type: 'object',
        properties: {
            id:          { type: 'string', format: 'uuid' },
            tenantId:    { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'Deep Tissue Massage' },
            description: { type: 'string', nullable: true },
            duration:    { type: 'integer', description: 'Duration in minutes', example: 60 },
            price:       { type: 'number', example: 95.00 },
            currency:    { type: 'string', example: 'USD' },
            isActive:    { type: 'boolean', example: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
        },
    },
    CreateServiceBody: {
        type: 'object',
        required: ['name', 'duration', 'price'],
        properties: {
            name:        { type: 'string', minLength: 1, maxLength: 255, example: 'Deep Tissue Massage' },
            description: { type: 'string', example: 'A firm pressure massage targeting deep muscle layers.' },
            duration:    { type: 'integer', minimum: 1, example: 60 },
            price:       { type: 'number', minimum: 0, example: 95.00 },
            currency:    { type: 'string', minLength: 3, maxLength: 3, default: 'USD', example: 'USD' },
        },
    },
    UpdateServiceBody: {
        type: 'object',
        properties: {
            name:        { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            duration:    { type: 'integer', minimum: 1 },
            price:       { type: 'number', minimum: 0 },
            currency:    { type: 'string', minLength: 3, maxLength: 3 },
        },
    },

    // --- Booking ---
    Booking: {
        type: 'object',
        properties: {
            id:         { type: 'string', format: 'uuid' },
            tenantId:   { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            serviceId:  { type: 'string', format: 'uuid' },
            startTime:  { type: 'string', format: 'date-time' },
            endTime:    { type: 'string', format: 'date-time' },
            status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
                example: 'pending',
            },
            notes:      { type: 'string', nullable: true },
            totalPrice: { type: 'number', example: 95.00 },
            currency:   { type: 'string', example: 'USD' },
            createdAt:  { type: 'string', format: 'date-time' },
            updatedAt:  { type: 'string', format: 'date-time' },
        },
    },
    CreateBookingBody: {
        type: 'object',
        required: ['customerId', 'serviceId', 'startTime', 'endTime'],
        properties: {
            customerId: { type: 'string', format: 'uuid' },
            serviceId:  { type: 'string', format: 'uuid' },
            startTime:  { type: 'string', format: 'date-time', example: '2026-03-15T10:00:00Z' },
            endTime:    { type: 'string', format: 'date-time', example: '2026-03-15T11:00:00Z' },
            notes:      { type: 'string', example: 'Customer prefers afternoon slots' },
        },
    },
    CancelBookingBody: {
        type: 'object',
        properties: {
            reason: { type: 'string', example: 'Customer requested cancellation' },
        },
    },
    BookingStats: {
        type: 'object',
        properties: {
            total:     { type: 'integer' },
            pending:   { type: 'integer' },
            confirmed: { type: 'integer' },
            completed: { type: 'integer' },
            cancelled: { type: 'integer' },
        },
    },

    // --- Inquiry ---
    Inquiry: {
        type: 'object',
        properties: {
            id:         { type: 'string', format: 'uuid' },
            tenantId:   { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            name:       { type: 'string', example: 'John Smith' },
            email:      { type: 'string', format: 'email', example: 'john@example.com' },
            phone:      { type: 'string', nullable: true },
            message:    { type: 'string', example: 'I would like to book a session next week.' },
            status: {
                type: 'string',
                enum: ['new', 'in_progress', 'resolved', 'spam'],
                example: 'new',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateInquiryBody: {
        type: 'object',
        required: ['name', 'email', 'message'],
        properties: {
            name:    { type: 'string', minLength: 1, maxLength: 255, example: 'John Smith' },
            email:   { type: 'string', format: 'email', example: 'john@example.com' },
            phone:   { type: 'string', maxLength: 50, example: '+1-555-0199' },
            message: { type: 'string', minLength: 1, maxLength: 5000, example: 'I would like more information about your services.' },
        },
    },
    UpdateInquiryStatusBody: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['new', 'in_progress', 'resolved', 'spam'],
            },
        },
    },
};

// =============================================================
// Reusable response builders
// =============================================================

function listResponse(schemaRef: string, description = 'Paginated list') {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'array', items: { $ref: `#/components/schemas/${schemaRef}` } },
                        meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                },
            },
        },
    };
}

function singleResponse(schemaRef: string, description = 'Success', _statusCode = 200) {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { $ref: `#/components/schemas/${schemaRef}` },
                    },
                },
            },
        },
    };
}

function errorResponse(code: string, message: string) {
    return {
        description: message,
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, error: { code, message } },
            },
        },
    };
}

// Common error responses
const errors = {
    400: errorResponse('VALIDATION_ERROR', 'Validation failed'),
    401: errorResponse('UNAUTHENTICATED', 'Authentication required'),
    403: errorResponse('FORBIDDEN', 'Insufficient permissions'),
    404: errorResponse('NOT_FOUND', 'Resource not found'),
    409: errorResponse('CONFLICT', 'Resource already exists'),
    500: errorResponse('INTERNAL_ERROR', 'Internal server error'),
};

// =============================================================
// OpenAPI paths
// =============================================================

const paths = {
    // ── Health ──────────────────────────────────────────────
    '/health': {
        get: {
            tags: ['Health'],
            summary: 'Health check',
            description: 'Returns API health status. No authentication required.',
            responses: {
                200: {
                    description: 'API is healthy',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            status:    { type: 'string', example: 'healthy' },
                                            timestamp: { type: 'string', format: 'date-time' },
                                            version:   { type: 'string', example: '1.0.0' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    // ── CMS — Customers ─────────────────────────────────────
    '/cms/customers': {
        get: {
            tags: ['CMS / Customers'],
            summary: 'List customers',
            description: 'Returns a paginated list of customers for the resolved tenant.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            ],
            responses: {
                200: listResponse('Customer', 'Paginated customer list'),
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Customers'],
            summary: 'Create a customer',
            description: 'Creates a new customer. Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomerBody' } } },
            },
            responses: {
                201: singleResponse('Customer', 'Customer created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                409: errors[409],
                500: errors[500],
            },
        },
    },
    '/cms/customers/search': {
        post: {
            tags: ['CMS / Customers'],
            summary: 'Search customers',
            description: 'Case-insensitive search across firstName, lastName, and email.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/SearchCustomerBody' } } },
            },
            responses: {
                200: {
                    description: 'Search results',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                500: errors[500],
            },
        },
    },
    '/cms/customers/{id}': {
        get: {
            tags: ['CMS / Customers'],
            summary: 'Get a customer',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Customer'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Customers'],
            summary: 'Update a customer',
            description: 'Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCustomerBody' } } },
            },
            responses: {
                200: singleResponse('Customer'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Customers'],
            summary: 'Delete a customer',
            description: 'Requires `admin` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Customer deleted',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: { message: { type: 'string', example: 'Customer deleted' } },
                                    },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── CMS — Services ──────────────────────────────────────
    '/cms/services': {
        get: {
            tags: ['CMS / Services'],
            summary: 'List services',
            description: 'Returns active services for the resolved tenant, ordered by name.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: listResponse('Service', 'Paginated service list'),
                401: errors[401],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Services'],
            summary: 'Create a service',
            description: 'Requires `admin` role or higher.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateServiceBody' } } },
            },
            responses: {
                201: singleResponse('Service', 'Service created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/services/{id}': {
        get: {
            tags: ['CMS / Services'],
            summary: 'Get a service',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Service'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Services'],
            summary: 'Update a service',
            description: 'Requires `admin` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateServiceBody' } } },
            },
            responses: {
                200: singleResponse('Service'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Services'],
            summary: 'Deactivate a service',
            description: 'Soft-deletes (sets isActive = false). Requires `admin` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Service deactivated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: { message: { type: 'string', example: 'Service deactivated' } },
                                    },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── CMS — Bookings ──────────────────────────────────────
    '/cms/bookings': {
        get: {
            tags: ['CMS / Bookings'],
            summary: 'List bookings',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
                {
                    name: 'status', in: 'query',
                    schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] },
                },
            ],
            responses: {
                200: listResponse('Booking', 'Paginated booking list'),
                401: errors[401],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Bookings'],
            summary: 'Create a booking',
            description: 'Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingBody' } } },
            },
            responses: {
                201: singleResponse('Booking', 'Booking created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/bookings/calendar': {
        post: {
            tags: ['CMS / Bookings'],
            summary: 'Get bookings for a date range (calendar view)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date', example: '2026-03-01' } },
                { name: 'endDate',   in: 'query', required: true, schema: { type: 'string', format: 'date', example: '2026-03-31' } },
            ],
            responses: {
                200: {
                    description: 'Bookings in date range',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                500: errors[500],
            },
        },
    },
    '/cms/bookings/stats': {
        get: {
            tags: ['CMS / Bookings'],
            summary: 'Get booking stats',
            description: 'Returns booking counts broken down by status.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: singleResponse('BookingStats', 'Booking statistics'),
                401: errors[401],
                500: errors[500],
            },
        },
    },
    '/cms/bookings/{id}': {
        get: {
            tags: ['CMS / Bookings'],
            summary: 'Get a booking',
            description: 'Returns booking with embedded customer and service.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Booking'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Bookings'],
            summary: 'Cancel a booking',
            description: 'Sets booking status to `cancelled`. Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CancelBookingBody' } } },
            },
            responses: {
                200: singleResponse('Booking', 'Booking cancelled'),
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/cms/bookings/{id}/confirm': {
        post: {
            tags: ['CMS / Bookings'],
            summary: 'Confirm a booking',
            description: 'Sets booking status to `confirmed`. Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Booking', 'Booking confirmed'),
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/cms/bookings/{id}/complete': {
        post: {
            tags: ['CMS / Bookings'],
            summary: 'Complete a booking',
            description: 'Sets booking status to `completed`. Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Booking', 'Booking completed'),
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── CMS — Inquiries ─────────────────────────────────────
    '/cms/inquiries': {
        get: {
            tags: ['CMS / Inquiries'],
            summary: 'List inquiries',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                {
                    name: 'status', in: 'query',
                    schema: { type: 'string', enum: ['new', 'in_progress', 'resolved', 'spam'] },
                },
            ],
            responses: {
                200: listResponse('Inquiry', 'Paginated inquiry list'),
                401: errors[401],
                500: errors[500],
            },
        },
    },
    '/cms/inquiries/{id}': {
        get: {
            tags: ['CMS / Inquiries'],
            summary: 'Get an inquiry',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Inquiry'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Inquiries'],
            summary: 'Update an inquiry',
            description: 'Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Inquiry' } } },
            },
            responses: {
                200: singleResponse('Inquiry'),
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Inquiries'],
            summary: 'Delete an inquiry',
            description: 'Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Inquiry deleted',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: { message: { type: 'string', example: 'Inquiry deleted' } },
                                    },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/cms/inquiries/{id}/status': {
        put: {
            tags: ['CMS / Inquiries'],
            summary: 'Update inquiry status',
            description: 'Requires `staff` role or higher.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateInquiryStatusBody' } } },
            },
            responses: {
                200: singleResponse('Inquiry', 'Status updated'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── Web — Services (public) ──────────────────────────────
    '/web/services': {
        get: {
            tags: ['Web / Services'],
            summary: 'List services (public)',
            description: 'Returns active services. No authentication required. Tenant resolved from subdomain or `X-Tenant-ID` header.',
            parameters: [
                { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: listResponse('Service'),
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/web/services/{id}': {
        get: {
            tags: ['Web / Services'],
            summary: 'Get a service (public)',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Service'),
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── Web — Bookings (public create) ───────────────────────
    '/web/bookings': {
        post: {
            tags: ['Web / Bookings'],
            summary: 'Create a booking (public / customer self-serve)',
            description: 'No authentication required. Tenant resolved from subdomain or `X-Tenant-ID` header.',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingBody' } } },
            },
            responses: {
                201: singleResponse('Booking', 'Booking created', 201),
                400: errors[400],
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── Web — Inquiries (public create) ─────────────────────
    '/web/inquiries': {
        post: {
            tags: ['Web / Inquiries'],
            summary: 'Submit an inquiry (public)',
            description: 'No authentication required. Tenant resolved from subdomain or `X-Tenant-ID` header.',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInquiryBody' } } },
            },
            responses: {
                201: singleResponse('Inquiry', 'Inquiry submitted', 201),
                400: errors[400],
                404: errors[404],
                500: errors[500],
            },
        },
    },
};

// =============================================================
// Build spec
// =============================================================

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'buildmyonlineweb API',
            version: '1.0.0',
            description: `
## Multi-Tenant SaaS buildmyonlineweb Platform

This API serves two namespaces:

| Namespace | Auth | Purpose |
|-----------|------|---------|
| \`/cms/*\` | Clerk JWT (Bearer) | CMS panel — authenticated tenant staff/owners |
| \`/web/*\` | None (public) | Frontend themes — public + customer self-serve |

### Tenant Resolution

All requests must resolve to a tenant via **one** of:
1. \`X-Tenant-ID\` header (UUID) — for development
2. Subdomain: \`{subdomain}.yourdomain.com\`
3. Custom domain: \`yourclientdomain.com\`

### Role Hierarchy (CMS only)

| Role | Permissions |
|------|-------------|
| \`owner\` | Full access |
| \`admin\` | CRUD on services, bookings, customers, inquiries |
| \`staff\` | Create/update bookings and customers, manage inquiries |
            `,
            contact: {
                name: 'buildmyonlineweb Support',
            },
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local development' },
        ],
        components: {
            schemas,
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Clerk-issued JWT token. Obtain from Clerk session.',
                },
            },
            parameters: {
                TenantId: {
                    name: 'X-Tenant-ID',
                    in: 'header',
                    description: 'Tenant UUID — development shortcut when subdomain routing is unavailable.',
                    schema: { type: 'string', format: 'uuid' },
                },
            },
        },
        tags: [
            { name: 'Health',           description: 'API health check' },
            { name: 'CMS / Customers',  description: 'Customer management (authenticated)' },
            { name: 'CMS / Services',   description: 'Service catalogue management (authenticated)' },
            { name: 'CMS / Bookings',   description: 'Booking management (authenticated)' },
            { name: 'CMS / Inquiries',  description: 'Inquiry management (authenticated)' },
            { name: 'Web / Services',   description: 'Public service catalogue' },
            { name: 'Web / Bookings',   description: 'Public booking creation' },
            { name: 'Web / Inquiries',  description: 'Public inquiry submission' },
        ],
        paths,
    },
    // No file scanning needed — spec is defined fully above
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
