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
            instanceId:{ type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'Jane' },
            lastName:  { type: 'string', example: 'Doe' },
            email:     { type: 'string', format: 'email', example: 'jane@example.com' },
            phone:     { type: 'string', nullable: true, example: '+1-555-0100' },
            notes:     { type: 'string', nullable: true },
            bookingCount: { type: 'integer', nullable: true, example: 3 },
            inquiryCount: { type: 'integer', nullable: true, example: 2 },
            lastInquiryAt: { type: 'string', format: 'date-time', nullable: true },
            lastInquirySourcePageSlug: { type: 'string', nullable: true, example: '/contact' },
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

    // --- Product ---
    Product: {
        type: 'object',
        properties: {
            id:          { type: 'string', format: 'uuid' },
            tenantId:    { type: 'string', format: 'uuid' },
            instanceId:  { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'Premium Bundle' },
            description: { type: 'string', nullable: true },
            imageUrl:    { type: 'string', nullable: true, example: 'https://cdn.example.com/uploads/item.jpg' },
            price:       { type: 'number', example: 49.99 },
            currency:    { type: 'string', example: 'USD' },
            isActive:    { type: 'boolean', example: true },
            sortOrder:   { type: 'integer', example: 0 },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
        },
    },
    CreateProductBody: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
            name:        { type: 'string', minLength: 1, maxLength: 255, example: 'Premium Bundle' },
            description: { type: 'string', example: 'High-value curated product package.' },
            imageUrl:    { type: 'string', format: 'uri', nullable: true, example: 'https://cdn.example.com/uploads/item.jpg' },
            price:       { type: 'number', exclusiveMinimum: 0, example: 49.99 },
            currency:    { type: 'string', minLength: 3, maxLength: 3, default: 'USD', example: 'USD' },
            isActive:    { type: 'boolean', example: true },
        },
    },
    UpdateProductBody: {
        type: 'object',
        properties: {
            name:        { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', nullable: true },
            imageUrl:    { type: 'string', format: 'uri', nullable: true },
            price:       { type: 'number', exclusiveMinimum: 0 },
            currency:    { type: 'string', minLength: 3, maxLength: 3 },
            isActive:    { type: 'boolean' },
        },
    },
    ReorderProductsBody: {
        type: 'object',
        required: ['products'],
        properties: {
            products: {
                type: 'array',
                minItems: 1,
                items: {
                    type: 'object',
                    required: ['id', 'sortOrder'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        sortOrder: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    },

    // --- Blog ---
    BlogSEOData: {
        type: 'object',
        properties: {
            metaTitle: { type: 'string', nullable: true },
            metaDescription: { type: 'string', nullable: true },
            metaKeywords: { type: 'string', nullable: true },
            canonicalPath: { type: 'string', nullable: true, example: '/blog/my-post' },
            robotsIndex: { type: 'boolean', nullable: true },
            robotsFollow: { type: 'boolean', nullable: true },
            ogTitle: { type: 'string', nullable: true },
            ogDescription: { type: 'string', nullable: true },
            ogImageUrl: { type: 'string', format: 'uri', nullable: true },
            ogImageAlt: { type: 'string', nullable: true },
            twitterCard: { type: 'string', nullable: true, enum: ['summary', 'summary_large_image'] },
            twitterTitle: { type: 'string', nullable: true },
            twitterDescription: { type: 'string', nullable: true },
            twitterImageUrl: { type: 'string', format: 'uri', nullable: true },
            twitterImageAlt: { type: 'string', nullable: true },
        },
    },
    Blog: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            instanceId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'How to Prepare for Your First Visit' },
            slug: { type: 'string', example: 'how-to-prepare-for-your-first-visit' },
            excerpt: { type: 'string', nullable: true },
            contentHtml: { type: 'string', example: '<p>Welcome to our guide...</p>' },
            featuredImageUrl: { type: 'string', nullable: true, example: 'https://cdn.example.com/uploads/blog-cover.jpg' },
            seoJsonb: { $ref: '#/components/schemas/BlogSEOData' },
            isPublished: { type: 'boolean', example: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    PublicBlogCard: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            featuredImageUrl: { type: 'string', nullable: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateBlogBody: {
        type: 'object',
        required: ['title', 'slug', 'contentHtml'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'How to Prepare for Your First Visit' },
            slug: { type: 'string', minLength: 1, maxLength: 200, example: 'how-to-prepare-for-your-first-visit' },
            excerpt: { type: 'string', nullable: true, maxLength: 1000 },
            contentHtml: { type: 'string', minLength: 1 },
            featuredImageUrl: { type: 'string', format: 'uri', nullable: true, example: 'https://cdn.example.com/uploads/blog-cover.jpg' },
            seoJsonb: { $ref: '#/components/schemas/BlogSEOData' },
            isPublished: { type: 'boolean', example: false },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    UpdateBlogBody: {
        type: 'object',
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            slug: { type: 'string', minLength: 1, maxLength: 200 },
            excerpt: { type: 'string', nullable: true, maxLength: 1000 },
            contentHtml: { type: 'string', minLength: 1 },
            featuredImageUrl: { type: 'string', format: 'uri', nullable: true },
            seoJsonb: { $ref: '#/components/schemas/BlogSEOData' },
            isPublished: { type: 'boolean' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
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
        required: ['serviceId', 'startTime', 'endTime'],
        properties: {
            customerId: { type: 'string', format: 'uuid', nullable: true },
            customer: {
                type: 'object',
                nullable: true,
                required: ['firstName', 'lastName', 'email'],
                properties: {
                    firstName: { type: 'string', minLength: 1, maxLength: 100, example: 'John' },
                    lastName: { type: 'string', minLength: 1, maxLength: 100, example: 'Smith' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    phone: { type: 'string', maxLength: 50, example: '+1-555-0199' },
                },
            },
            serviceId:  { type: 'string', format: 'uuid' },
            startTime:  { type: 'string', format: 'date-time', example: '2026-03-15T10:00:00Z' },
            endTime:    { type: 'string', format: 'date-time', example: '2026-03-15T11:00:00Z' },
            notes:      { type: 'string', example: 'Customer prefers afternoon slots' },
        },
        anyOf: [
            { required: ['customerId'] },
            { required: ['customer'] },
        ],
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
    InquiryCustomerSummary: {
        type: 'object',
        nullable: true,
        properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Smith' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', nullable: true, example: '+1-555-0199' },
        },
    },
    Inquiry: {
        type: 'object',
        properties: {
            id:         { type: 'string', format: 'uuid' },
            tenantId:   { type: 'string', format: 'uuid' },
            instanceId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            name:       { type: 'string', example: 'John Smith' },
            email:      { type: 'string', format: 'email', example: 'john@example.com' },
            phone:      { type: 'string', nullable: true },
            message:    { type: 'string', example: 'I would like to book a session next week.' },
            sourceType: { type: 'string', nullable: true, enum: ['contact_form', 'booking_form'], example: 'contact_form' },
            sourcePageSlug: { type: 'string', nullable: true, example: '/contact' },
            status: {
                type: 'string',
                enum: ['new', 'in_progress', 'resolved', 'spam'],
                example: 'new',
            },
            customer: { $ref: '#/components/schemas/InquiryCustomerSummary' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateInquiryBody: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'message'],
        properties: {
            firstName: { type: 'string', minLength: 1, maxLength: 100, example: 'John' },
            lastName:  { type: 'string', minLength: 1, maxLength: 100, example: 'Smith' },
            email:   { type: 'string', format: 'email', example: 'john@example.com' },
            phone:   { type: 'string', maxLength: 50, example: '+1-555-0199' },
            message: { type: 'string', minLength: 1, maxLength: 5000, example: 'I would like more information about your services.' },
            sourceType: { type: 'string', enum: ['contact_form', 'booking_form'], example: 'contact_form' },
            sourcePageSlug: { type: 'string', minLength: 1, maxLength: 255, example: '/contact' },
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

    // --- Feedback ---
    Feedback: {
        type: 'object',
        properties: {
            id:                { type: 'string', format: 'uuid' },
            tenantId:          { type: 'string', format: 'uuid' },
            type:              { type: 'string', enum: ['rating', 'suggestion'] },
            score:             { type: 'integer', nullable: true, minimum: 1, maximum: 5 },
            note:              { type: 'string', nullable: true },
            title:             { type: 'string', nullable: true },
            message:           { type: 'string', nullable: true },
            submittedByUserId: { type: 'string', format: 'uuid' },
            submittedByEmail:  { type: 'string', format: 'email' },
            submittedByName:   { type: 'string' },
            createdAt:         { type: 'string', format: 'date-time' },
            updatedAt:         { type: 'string', format: 'date-time' },
        },
    },
    SuperAdminFeedback: {
        allOf: [
            { $ref: '#/components/schemas/Feedback' },
            {
                type: 'object',
                properties: {
                    tenant: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            businessName: { type: 'string' },
                        },
                    },
                },
            },
        ],
    },
    CreateFeedbackRatingBody: {
        type: 'object',
        required: ['score'],
        properties: {
            score: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            note:  { type: 'string', maxLength: 2000, example: 'The dashboard works well for our team.' },
        },
    },
    CreateFeedbackSuggestionBody: {
        type: 'object',
        required: ['title', 'message'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'Add booking reminders' },
            message: { type: 'string', minLength: 1, maxLength: 5000, example: 'Please add SMS reminders before appointments.' },
        },
    },

    // --- Instances / Domain Routing ---
    Instance: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            subdomain: { type: 'string', example: 'mysalon' },
            fullDomain: { type: 'string', nullable: true, example: 'mysalon.buildmyonlineweb.site' },
            customDomain: { type: 'string', nullable: true, example: 'www.clientsite.com' },
            cloudflareAccountId: { type: 'string', format: 'uuid', nullable: true },
            cloudflareAccountName: { type: 'string', nullable: true, example: 'Primary Cloudflare Account' },
            customDomainHostnameStatus: { type: 'string', nullable: true, example: 'pending' },
            customDomainSslStatus: { type: 'string', nullable: true, example: 'pending' },
            customDomainIsActive: { type: 'boolean', example: false },
            customDomainLastCheckedAt: { type: 'string', format: 'date-time', nullable: true },
            customDomainActivatedAt: { type: 'string', format: 'date-time', nullable: true },
            timezone: { type: 'string', example: 'Asia/Colombo' },
            name: { type: 'string', example: 'My Salon' },
            businessType: { type: 'string', nullable: true, example: 'Salon & Spa' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateInstanceBody: {
        type: 'object',
        required: ['name', 'subdomain'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 255, example: 'My Salon' },
            subdomain: { type: 'string', minLength: 3, maxLength: 63, example: 'mysalon' },
            businessType: { type: 'string', maxLength: 255, example: 'Salon & Spa' },
            timezone: { type: 'string', maxLength: 100, example: 'Asia/Colombo' },
        },
    },
    UpdateInstanceBody: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            businessType: { type: 'string', maxLength: 255 },
            timezone: { type: 'string', maxLength: 100 },
        },
    },
    UpsertDomainRouteBody: {
        type: 'object',
        required: ['host'],
        properties: {
            host: { type: 'string', example: 'www.clientsite.com' },
            active: { type: 'boolean', default: true },
            isPrimary: { type: 'boolean', default: true },
        },
    },
    DomainRouteMapping: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            instanceId: { type: 'string', format: 'uuid' },
            host: { type: 'string', example: 'www.clientsite.com' },
            active: { type: 'boolean' },
            isPrimary: { type: 'boolean' },
            updatedAt: { type: 'string', format: 'date-time' },
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
    502: errorResponse('PUBLISH_FAILED', 'Upstream storage operation failed'),
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

    // ── CMS — Instances ─────────────────────────────────────
    '/cms/instances': {
        get: {
            tags: ['CMS / Instances'],
            summary: 'List instances',
            description: 'Lists website instances for the resolved tenant.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Instance list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Instance' } },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Instances'],
            summary: 'Create instance',
            description: 'Creates a new website instance for the current tenant.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInstanceBody' } } },
            },
            responses: {
                201: singleResponse('Instance', 'Instance created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                409: errors[409],
                500: errors[500],
            },
        },
    },
    '/cms/instances/{id}': {
        get: {
            tags: ['CMS / Instances'],
            summary: 'Get instance',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Instance'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Instances'],
            summary: 'Update instance',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateInstanceBody' } } },
            },
            responses: {
                200: singleResponse('Instance'),
                400: errors[400],
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Instances'],
            summary: 'Delete instance',
            description: 'Hard-deletes the instance, cascades all instance-scoped DB rows, and removes instance artifacts from R2 before DB deletion.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Instance deleted',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string', example: 'Instance deleted successfully' },
                                            storageCleanup: {
                                                type: 'object',
                                                properties: {
                                                    deletedPublishedObjectCount: { type: 'number', example: 2 },
                                                    deletedMediaObjectCount: { type: 'number', example: 5 },
                                                    deletedTotalCount: { type: 'number', example: 7 },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                404: errors[404],
                502: errors[502],
                500: errors[500],
            },
        },
    },
    '/cms/instances/{id}/domain-route': {
        put: {
            tags: ['CMS / Instances'],
            summary: 'Create or update a domain route',
            description: 'Maps a customer host to an instance for CDN routing-index based resolution.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpsertDomainRouteBody' } } },
            },
            responses: {
                200: singleResponse('DomainRouteMapping', 'Domain route mapped successfully'),
                400: errors[400],
                401: errors[401],
                404: errors[404],
                409: errors[409],
                500: errors[500],
            },
        },
    },
    '/cms/instances/{id}/domain-route/{host}': {
        delete: {
            tags: ['CMS / Instances'],
            summary: 'Delete a domain route',
            description: 'Removes a mapped host from an instance and refreshes routing index artifacts.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                { name: 'host', in: 'path', required: true, schema: { type: 'string', example: 'www.clientsite.com' } },
            ],
            responses: {
                200: {
                    description: 'Domain route removed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            removed: { type: 'boolean', example: true },
                                            host: { type: 'string', example: 'www.clientsite.com' },
                                        },
                                    },
                                    message: { type: 'string', example: 'Domain route removed successfully' },
                                },
                            },
                        },
                    },
                },
                400: errors[400],
                401: errors[401],
                404: errors[404],
                500: errors[500],
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

    // ── CMS — Products ──────────────────────────────────────
    '/cms/products': {
        get: {
            tags: ['CMS / Products'],
            summary: 'List products',
            description: 'Returns products for the resolved tenant instance, ordered by sort order.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Product list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Products'],
            summary: 'Create a product',
            description: 'Requires `products.create` permission.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductBody' } } },
            },
            responses: {
                201: singleResponse('Product', 'Product created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/products/reorder': {
        put: {
            tags: ['CMS / Products'],
            summary: 'Reorder products',
            description: 'Requires `products.update` permission. Payload must include all instance products.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ReorderProductsBody' } } },
            },
            responses: {
                200: {
                    description: 'Products reordered',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string', example: 'Products reordered' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/products/{id}': {
        get: {
            tags: ['CMS / Products'],
            summary: 'Get a product',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Product'),
                401: errors[401],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Products'],
            summary: 'Update a product',
            description: 'Requires `products.update` permission.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProductBody' } } },
            },
            responses: {
                200: singleResponse('Product'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Products'],
            summary: 'Deactivate a product',
            description: 'Soft-deletes (sets isActive = false). Requires `products.delete` permission.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Product deactivated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: { message: { type: 'string', example: 'Product deactivated' } },
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

    // ── CMS — Blogs ─────────────────────────────────────────
    '/cms/blogs': {
        get: {
            tags: ['CMS / Blogs'],
            summary: 'List blogs',
            description: 'Returns blog posts for the resolved tenant instance.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Blog list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Blog' } },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Blogs'],
            summary: 'Create a blog post',
            description: 'Requires `blogs.create` permission.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBlogBody' } } },
            },
            responses: {
                201: singleResponse('Blog', 'Blog post created', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                409: errors[409],
                500: errors[500],
            },
        },
    },
    '/cms/blogs/{id}': {
        get: {
            tags: ['CMS / Blogs'],
            summary: 'Get a blog post',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Blog'),
                401: errors[401],
                403: errors[403],
                404: errors[404],
                500: errors[500],
            },
        },
        put: {
            tags: ['CMS / Blogs'],
            summary: 'Update a blog post',
            description: 'Requires `blogs.update` permission.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBlogBody' } } },
            },
            responses: {
                200: singleResponse('Blog'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                404: errors[404],
                409: errors[409],
                500: errors[500],
            },
        },
        delete: {
            tags: ['CMS / Blogs'],
            summary: 'Unpublish blog post',
            description: 'Sets `isPublished = false` and clears publish date. Requires `blogs.delete` permission.',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: {
                    description: 'Blog post unpublished',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: { message: { type: 'string', example: 'Blog post unpublished' } },
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

    // ── CMS — Feedback ──────────────────────────────────────
    '/cms/feedback/ratings': {
        get: {
            tags: ['CMS / Feedback'],
            summary: 'List tenant feedback ratings',
            description: 'Returns paginated 1-5 rating submissions for the resolved tenant.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            ],
            responses: {
                200: listResponse('Feedback', 'Paginated feedback ratings'),
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Feedback'],
            summary: 'Submit a feedback rating',
            description: 'Creates an immutable tenant-level rating entry.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateFeedbackRatingBody' } } },
            },
            responses: {
                201: singleResponse('Feedback', 'Feedback rating submitted', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/feedback/suggestions': {
        get: {
            tags: ['CMS / Feedback'],
            summary: 'List tenant improvement suggestions',
            description: 'Returns paginated suggestion submissions for the resolved tenant.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            ],
            responses: {
                200: listResponse('Feedback', 'Paginated feedback suggestions'),
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
        post: {
            tags: ['CMS / Feedback'],
            summary: 'Submit an improvement suggestion',
            description: 'Creates an immutable tenant-level suggestion entry.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateFeedbackSuggestionBody' } } },
            },
            responses: {
                201: singleResponse('Feedback', 'Feedback suggestion submitted', 201),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/superadmin/feedback': {
        get: {
            tags: ['CMS / Super Admin'],
            summary: 'List all tenant feedback (superadmin)',
            description: 'Returns paginated feedback entries across all tenants. Optional filters: tenantId and type.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
                { name: 'tenantId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                { name: 'type', in: 'query', schema: { type: 'string', enum: ['rating', 'suggestion'] } },
            ],
            responses: {
                200: listResponse('SuperAdminFeedback', 'Paginated superadmin feedback list'),
                400: errors[400],
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    '/cms/superadmin/routing-index/rebuild': {
        post: {
            tags: ['CMS / Super Admin'],
            summary: 'Rebuild routing index',
            description: 'Forces rebuild and publish of `routing-index/current.json` and related CDN artifacts.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Routing index rebuilt',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            version: { type: 'string', example: 'v-20260316T120000Z' },
                                            hostCount: { type: 'integer', example: 42 },
                                            generatedAt: { type: 'string', format: 'date-time' },
                                            indexKey: { type: 'string', example: 'routing-index/v-20260316T120000Z.json' },
                                            indexUrl: { type: 'string', nullable: true, example: 'https://cdn.example.com/routing-index/v-20260316T120000Z.json' },
                                            changedHosts: { type: 'array', items: { type: 'string' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: errors[401],
                403: errors[403],
                500: errors[500],
            },
        },
    },
    // ── Web — Services (public) ──────────────────────────────
    '/web/services': {
        get: {
            tags: ['Web / Services'],
            summary: 'List services (public)',
            description: 'Returns active services. No authentication required. Tenant/instance resolved from trusted `X-Routed-Host` (via CMS proxy) with `X-Tenant-ID` + `X-Instance-ID` fallback for legacy clients.',
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

    // ── Web — Products (public) ──────────────────────────────
    '/web/products': {
        get: {
            tags: ['Web / Products'],
            summary: 'List products (public)',
            description: 'Returns active products. No authentication required. Tenant/instance resolved from trusted `X-Routed-Host` (via CMS proxy) with `X-Tenant-ID` + `X-Instance-ID` fallback for legacy clients.',
            responses: {
                200: {
                    description: 'Product list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                                },
                            },
                        },
                    },
                },
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/web/products/{id}': {
        get: {
            tags: ['Web / Products'],
            summary: 'Get a product (public)',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: singleResponse('Product'),
                404: errors[404],
                500: errors[500],
            },
        },
    },

    // ── Web — Blogs (public) ─────────────────────────────────
    '/web/blogs': {
        get: {
            tags: ['Web / Blogs'],
            summary: 'List blogs (public)',
            description: 'Returns published blog cards. No authentication required. Tenant/instance resolved from trusted `X-Routed-Host` (via CMS proxy) with `X-Tenant-ID` + `X-Instance-ID` fallback for legacy clients.',
            responses: {
                200: {
                    description: 'Blog list',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { type: 'array', items: { $ref: '#/components/schemas/PublicBlogCard' } },
                                },
                            },
                        },
                    },
                },
                404: errors[404],
                500: errors[500],
            },
        },
    },
    '/web/blogs/{slug}': {
        get: {
            tags: ['Web / Blogs'],
            summary: 'Get a published blog post (public)',
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'how-to-prepare-for-your-first-visit' } }],
            responses: {
                200: singleResponse('Blog'),
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
            description: 'No authentication required. Tenant/instance resolved from trusted `X-Routed-Host` (via CMS proxy) with `X-Tenant-ID` + `X-Instance-ID` fallback for legacy clients.',
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
            description: 'No authentication required. Tenant/instance resolved from trusted `X-Routed-Host` (via CMS proxy) with `X-Tenant-ID` + `X-Instance-ID` fallback for legacy clients.',
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
            title: 'Project Aurora — Website Builder API',
            version: '1.0.0',
            description: `
## Multi-Tenant SaaS Project Aurora Website Builder Platform

This API serves two namespaces:

| Namespace | Auth | Purpose |
|-----------|------|---------|
| \`/cms/*\` | Clerk JWT (Bearer) | CMS panel — authenticated tenant staff/owners |
| \`/web/*\` | None (public) | Frontend themes — public + customer self-serve |

### Tenant Resolution

All requests must resolve to a tenant via **one** of:
1. Trusted \`X-Routed-Host\` header from CMS \`/web\` proxy (recommended in production)
2. \`X-Tenant-ID\` + \`X-Instance-ID\` headers (legacy/development fallback)

### Role Hierarchy (CMS only)

| Role | Permissions |
|------|-------------|
| \`owner\` | Full access |
| \`admin\` | CRUD on services, bookings, customers, inquiries |
| \`staff\` | Create/update bookings and customers, manage inquiries |
            `,
            contact: {
                name: 'Project Aurora Support',
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
            { name: 'CMS / Instances',  description: 'Tenant website instances and manual domain routing (authenticated)' },
            { name: 'CMS / Customers',  description: 'Customer management (authenticated)' },
            { name: 'CMS / Services',   description: 'Service catalogue management (authenticated)' },
            { name: 'CMS / Bookings',   description: 'Booking management (authenticated)' },
            { name: 'CMS / Inquiries',  description: 'Inquiry management (authenticated)' },
            { name: 'CMS / Feedback',   description: 'Tenant product feedback collection (authenticated)' },
            { name: 'CMS / Super Admin', description: 'Platform-wide superadmin operations' },
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
