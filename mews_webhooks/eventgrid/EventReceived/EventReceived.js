'use strict';

const validations = require('./validations');

module.exports = {

    /**
     * Handle incoming webhook requests from AEG
     */
    async receive(context) {
        await context.log({ message: '>> EVENT STARTED 101' });
        await context.log({ 
            message: '>> context.messages structure',
            contextMessages: context.messages
        });

        let errorResponse = await validations.validateWebhookMessage(context);
        if (errorResponse) {
            return errorResponse;
        }

        const { method, headers, data } = context.messages.webhook.content;
        
        await context.log({ 
            message: '>> Webhook request received',
            method: method,
            hasData: !!data
        });

        // Handle AEG CloudEvents validation handshake
        if (method === 'OPTIONS') {
            try {
                return await this.handleCloudEventsHandshake(context, headers);
            } catch (error) {
                await context.log({ 
                    message: '>> Error in CloudEvents handshake handling',
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        }

        errorResponse = await validations.validateHttpMethod(context, method);
        if (errorResponse) {
            return errorResponse;
        }

        errorResponse = await validations.validateRequestData(context, data);
        if (errorResponse) {
            return errorResponse;
        }

        for (const event of data) {
            await this.processCloudEvent(context, event);
        }

        await context.log({ message: '>> EVENT SUCCESSFULLY FINISHED' });

        // ToDo: this is a dangerous since the webhook might time out. The appmixer flow should be processed asynchronously.
        return context.response({
            statusCode: 200,
            data: {
                message: 'MY CUSTOM RESPONSE FROM APPMIXER'
            }
        });
    },

    /**
     * Handle CloudEvents validation handshake (HTTP OPTIONS)
     * Azure Event Grid uses HTTP OPTIONS for abuse protection
     * Must return HTTP 200 with WebHook-Allowed-Origin header
     * See: https://learn.microsoft.com/en-us/azure/event-grid/end-point-validation-cloud-events-schema
     */
    async handleCloudEventsHandshake(context, headers) {
        await context.log({ message: '>> CLOUDEVENTS HANDSHAKE STARTED' });
        const requestOrigin = headers['webhook-request-origin'];
        
        await context.log({ 
            message: '>> CloudEvents validation OPTIONS request detected',
            origin: requestOrigin
        });
        
        const responseObj = {
            statusCode: 200,
            headers: {
                'WebHook-Allowed-Origin': requestOrigin
            }
        };
        
        await context.log({
            message: '>> Sending CloudEvents handshake response',
            response: responseObj
        });
        
        return context.response(responseObj);
    },

    /**
     * Process a CloudEvent and send to output port
     * Applies filters if configured
     */
    async processCloudEvent(context, event) {
        await context.log({ message: '>> PROCESSING CLOUDEVENT' });
        await context.log({ 
            message: '>> Sending event to output port',
            type: event.type,
            id: event.id
        });
        
        // Send event to output port
        await context.sendJson({
            id: event.id,
            type: event.type,
            source: event.source,
            time: event.time,
            subject: event.subject,
            data: event.data
        }, 'out');
    },

    /**
     * Get webhook URL - called by AppMixer to populate the webhookUrl property
     * This method is referenced in component.json schema for computed property
     * Returns the webhook URL immediately, even before the flow starts
     */
    async getWebhookUrl(context) {
        try {
            // Get webhook URL directly from AppMixer - this works before flow starts
            // AppMixer generates the URL based on component configuration
            return context.getWebhookUrl();
        } catch (error) {
            // Fallback to state if available (after flow started)
            if (context.state?.webhookUrl) {
                return context.state.webhookUrl;
            }
            return 'Webhook URL not available';
        }
    },

    /**
     * Start method - called when the flow starts
     * Logs the webhook URL for manual Azure subscription creation
     */
    async start(context) {
        await context.log({ message: '>> CLOUDEVENTS WEBHOOK TRIGGER STARTED 101' });
        const webhookUrl = context.getWebhookUrl();
        
        await context.log({
            message: '>> WEBHOOK URL GENERATED',
            webhookUrl: webhookUrl
        });
        
        // Store the webhook URL in state
        await context.saveState({
            webhookUrl: webhookUrl,
            startTime: new Date().toISOString()
        });
    },

    /**
     * Stop method - called when the flow stops
     * Clean up resources
     */
    async stop(context) {
        await context.log({ message: '>> CLOUDEVENTS WEBHOOK TRIGGER STOPPED' });
        await context.log({
            message: '>> CloudEvents webhook trigger stopped',
            state: context.state,
        });
    }
};
