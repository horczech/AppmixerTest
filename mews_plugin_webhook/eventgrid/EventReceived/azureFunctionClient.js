'use strict';

/**
 * Azure Function Client Module
 * Handles Azure Function calls for Event Grid subscription management
 */

module.exports = {

    /**
     * Get Azure Function configuration from Appmixer service configuration (context.auth)
     * @param {Object} context - Appmixer component context
     * @returns {Promise<Object>} Configuration object with functionAppUrl, createKey, deleteKey
     */
    async getAzureFunctionConfig(context) {
        // Get configuration from Appmixer service configuration (configured in Backoffice)
        // Service configuration values are available in context.auth object
        const config = {
            functionAppUrl: 'xxxxxxxx',
            createKey: 'xxxxxxxx',
            deleteKey: 'xxxxx'
        };
        
        if (config.functionAppUrl && config.createKey && config.deleteKey) {
            await context.log({ 
                message: '>> Azure Function config retrieved from service configuration (context.auth)',
                functionAppUrl: config.functionAppUrl,
                createKey: config.createKey,
                deleteKey: config.deleteKey
            });
            return config;
        }
        
        throw new Error('Azure Function configuration not found in service configuration. Please configure azureFunctionAppUrl, createSubscriptionFunctionKey, and deleteSubscriptionFunctionKey in Appmixer Backoffice Services.');
    },

    /**
     * Call Azure Function to create subscription
     * @param {Object} context - Appmixer component context
     * @param {Object} config - Azure Function configuration
     * @param {string} enterpriseId - Enterprise ID
     * @param {string} flowId - Flow ID
     * @param {string} webhookEndpoint - Webhook endpoint URL
     * @param {string} eventType - Event type to subscribe to
     * @returns {Promise<Object>} Response data from Azure Function
     */
    async createSubscription(context, config, enterpriseId, flowId, webhookEndpoint, eventType) {
        // Validate webhookEndpoint
        if (!webhookEndpoint || typeof webhookEndpoint !== 'string' || webhookEndpoint.trim() === '') {
            throw new Error(`Invalid webhookEndpoint: ${webhookEndpoint}. Webhook endpoint cannot be null, undefined, or empty.`);
        }
        
        if (!webhookEndpoint.startsWith('https://')) {
            throw new Error(`Invalid webhookEndpoint: ${webhookEndpoint}. Webhook endpoint must be a valid HTTPS URL.`);
        }
        
        const createUrl = `${config.functionAppUrl}/api/createsubscription?code=${config.createKey}`;
        
        const eventTypes = [eventType];
        
        const requestBody = {
            enterpriseId: enterpriseId,
            flowId: flowId,
            webhookEndpoint: webhookEndpoint.trim(),
            eventTypes: eventTypes
        };
        
        await context.log({
            message: '>> Calling CreateSubscription Azure Function',
            url: createUrl,
            enterpriseId: enterpriseId,
            flowId: flowId,
            webhookEndpoint: webhookEndpoint,
            webhookEndpointType: typeof webhookEndpoint,
            webhookEndpointLength: webhookEndpoint ? webhookEndpoint.length : 0,
            eventTypes: eventTypes,
            requestBody: requestBody
        });
        
        try {
            const response = await context.httpRequest({
                url: createUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: requestBody
            });
            
            await context.log({
                message: '>> CreateSubscription succeeded',
                status: response.status,
                data: response.data
            });
            
            return response.data;
        } catch (error) {
            await context.log({
                message: '>> CreateSubscription failed',
                error: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : undefined
            });
            throw error;
        }
    },

    /**
     * Call Azure Function to delete subscription
     * @param {Object} context - Appmixer component context
     * @param {Object} config - Azure Function configuration
     * @param {string} enterpriseId - Enterprise ID
     * @param {string} flowId - Flow ID
     * @returns {Promise<Object|null>} Response data from Azure Function or null if failed
     */
    async deleteSubscription(context, config, enterpriseId, flowId) {
        const deleteUrl = `${config.functionAppUrl}/api/deletesubscription?code=${config.deleteKey}`;
        
        const requestBody = {
            enterpriseId: enterpriseId,
            flowId: flowId
        };
        
        await context.log({
            message: '>> Calling DeleteSubscription Azure Function',
            url: deleteUrl,
            enterpriseId: enterpriseId,
            flowId: flowId
        });
        
        try {
            const response = await context.httpRequest({
                url: deleteUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: requestBody
            });
            
            await context.log({
                message: '>> DeleteSubscription succeeded',
                status: response.status,
                data: response.data
            });
            
            return response.data;
        } catch (error) {
            await context.log({
                message: '>> DeleteSubscription failed',
                error: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : undefined
            });
            // Don't throw - subscription might already be deleted
            return null;
        }
    }
};

