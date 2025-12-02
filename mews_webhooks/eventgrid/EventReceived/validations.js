'use strict';

/**
 * Webhook request validation functions
 * Each function returns an error response if validation fails, or null if valid
 */
module.exports = {
    /**
     * Validate that webhook message exists
     * @param {Object} context - AppMixer context object
     * @returns {Object|null} Error response if invalid, null if valid
     */
    async validateWebhookMessage(context) {
        if (!context.messages?.webhook) {
            await context.log({ message: '>> WEBHOOK MESSAGE NOT RECEIVED' });
            return context.response({
                statusCode: 400,
                data: { error: 'No webhook message received' }
            });
        }
        return null;
    },

    /**
     * Validate HTTP method is POST
     * @param {Object} context - AppMixer context object
     * @param {string} method - HTTP method
     * @returns {Object|null} Error response if invalid, null if valid
     */
    async validateHttpMethod(context, method) {
        if (method !== 'POST') {
            await context.log({ message: '>> HTTP METHOD NOT ALLOWED' });
            return context.response({
                statusCode: 405,
                headers: {
                    'Allow': 'OPTIONS, POST'
                },
                data: { error: `Method ${method} not allowed` }
            });
        }
        return null;
    },

    /**
     * Validate that request data exists
     * @param {Object} context - AppMixer context object
     * @param {*} data - Request data
     * @returns {Object|null} Error response if invalid, null if valid
     */
    async validateRequestData(context, data) {
        if (!data) {
            await context.log({ message: '>> NO DATA IN REQUEST BODY' });
            return context.response({
                statusCode: 400,
                data: { error: 'No data in request body' }
            });
        }
        return null;
    }
};

