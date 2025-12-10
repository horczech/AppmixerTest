'use strict';

const azureFunctionClient = require('./azureFunctionClient');

module.exports = {

    /**
     * Handle incoming CloudEvents from plugin endpoint
     * Events are routed via context.triggerListeners() from routes.js
     */
    async receive(context) {
        await context.log({ message: '>> 2 RECEIVE METHOD HIT' });
        // Event from plugin endpoint via triggerListeners
        const event = context.messages.in.content;
        
        await context.log({ 
            message: '>> CloudEvent received',
            eventId: event.id,
            eventType: event.type
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
     * Get plugin endpoint URL
     * Constructs a unique plugin endpoint URL for this component instance
     * Format: /plugins/mews_plugin_webhook/eventgrid/{flowId}/{componentId}
     */
    async getWebhookUrl(context) {
        // Fallback to state if available
        if (context.state?.webhookUrl) {
            return context.state.webhookUrl;
        }
        
        // Build unique plugin endpoint URL for this component instance
        // Format: https://api.YOUR_TENANT.appmixer.cloud/flows/{flowId}/components/{componentId}
        // Matches standard webhook URL format but handled by plugin endpoint
        // Get tenant URL from context properties or use default
        const tenantUrl = context.properties?.tenantUrl 
            || context.auth?.tenantUrl 
            || 'https://api.powerful-collie-1942.appmixer.cloud';
        
        // Create unique endpoint per component instance using standard webhook URL format
        const flowId = context.flowId;
        const componentId = context.componentId;
        return `${tenantUrl}/flows/${flowId}/components/${componentId}`;
    },

    /**
     * Start method - called when the flow starts
     * Registers listener and creates Azure Event Grid subscription pointing to the plugin endpoint
     */
    async start(context) {
        await context.log({ message: '>> 1 CloudEvents plugin webhook trigger started' });
        
        // Register listener for plugin endpoint events with unique identifier
        // Store flowId and componentId in listener params for routing
        const flowId = context.flowId;
        const componentId = context.componentId;
        await context.addListener('mews-plugin-webhook-eventgrid', {
            flowId: flowId,
            componentId: componentId
        });
        
        await context.log({
            message: '>> Listener registered for plugin endpoint events',
            flowId: flowId,
            componentId: componentId
        });
        
        // Get plugin endpoint URL (we need to construct it manually)
        const webhookUrl = await this.getWebhookUrl(context);
        
        await context.log({
            message: '>> Plugin endpoint URL generated',
            webhookUrl: webhookUrl
        });
        
        // // Create Azure Event Grid subscription
        // const config = await azureFunctionClient.getAzureFunctionConfig(context);
        // const enterpriseId = context.properties.enterpriseId;
        // const eventType = context.properties.eventType;
        
        // const subscriptionResult = await azureFunctionClient.createSubscription(
        //     context,
        //     config,
        //     enterpriseId,
        //     flowId,
        //     webhookUrl,
        //     eventType
        // );
        
        // // Store subscription info in state
        // await context.saveState({
        //     webhookUrl: webhookUrl,
        //     startTime: new Date().toISOString(),
        //     subscriptionCreated: true,
        //     subscriptionId: subscriptionResult?.subscriptionId,
        //     subscriptionCreatedAt: new Date().toISOString()
        // });
        
        // await context.log({
        //     message: '>> Azure subscription created successfully',
        //     subscriptionId: subscriptionResult?.subscriptionId
        // });
    },

    /**
     * Stop method - called when the flow stops
     */
    async stop(context) {
        await context.log({ message: '>> CloudEvents plugin webhook trigger stopped' });
        
        // Remove listener
        await context.removeListener('mews-plugin-webhook-eventgrid');
        
        // // Delete Azure Event Grid subscription
        // try {
        //     const config = await azureFunctionClient.getAzureFunctionConfig(context);
        //     const enterpriseId = context.properties.enterpriseId;
        //     const flowId = context.flowId;
            
        //     await azureFunctionClient.deleteSubscription(
        //         context,
        //         config,
        //         enterpriseId,
        //         flowId
        //     );
            
        //     await context.log({
        //         message: '>> Azure subscription deleted successfully'
        //     });
        // } catch (error) {
        //     await context.log({
        //         message: '>> Failed to delete Azure subscription',
        //         error: error.message,
        //         stack: error.stack
        //     });
        // }
    }
};
