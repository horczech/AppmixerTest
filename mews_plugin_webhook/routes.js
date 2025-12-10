'use strict';

/**
 * Plugin routes for mews_plugin_webhook connector
 * These routes bypass Appmixer's standard webhook infrastructure to accept
 * any content type (including application/cloudevents+json)
 * 
 * Based on Appmixer Line connector example:
 * https://github.com/Appmixer-ai/appmixer-connectors/blob/7144c5ea801869ea8cdf7818458e153e89b89b36/src/appmixer/line/routes.js
 */

module.exports = async context => {
    // Register the plugin endpoint route with dynamic path parameters
    // Format: /plugins/mews_plugin_webhook/eventgrid/{flowId}/{componentId}
    context.http.router.register({
        method: 'POST',
        path: '/eventgrid/{flowId}/{componentId}',
        options: {
            auth: false,
            handler: async (req, h) => {
                const flowId = req.params.flowId;
                const componentId = req.params.componentId;
                
                await context.log('info', 'eventgrid-plugin-route-webhook-hit', { 
                    eventCount: req.payload?.length,
                    contentType: req.headers['content-type'],
                    flowId: flowId,
                    componentId: componentId
                });

                const events = req.payload;
                if (!events || !Array.isArray(events)) {
                    context.log('error', 'eventgrid-plugin-route-webhook-invalid-payload', { payload: req.payload });
                    return {};
                }

                // Process each CloudEvent and route to the specific listener
                for (const event of events) {
                    await context.triggerListeners({
                        eventName: 'mews-plugin-webhook-eventgrid',
                        payload: event,
                        filter: listener => {
                            // Route to the listener that matches this flowId and componentId
                            return listener.params?.flowId === flowId 
                                && listener.params?.componentId === componentId;
                        }
                    });
                }

                return {};
            }
        }
    });

    // Register OPTIONS handler for Azure Event Grid CloudEvents validation handshake
    // Note: Azure Event Grid sends OPTIONS with 'webhook-request-origin' header (not standard CORS)
    // We must disable Hapi's CORS handling so our custom handler can respond
    context.http.router.register({
        method: 'OPTIONS',
        path: '/eventgrid/{flowId}/{componentId}',
        options: {
            auth: false,
            handler: async (req, h) => {
                await context.log('info', 'eventgrid-plugin-route-options-handshake', {
                    message: ">>>>> OPTIONS HANDSHAKE HIT"
                });

                const requestOrigin = req.headers['webhook-request-origin'];
                const response = h.response();

                if (requestOrigin) {
                    response.header('WebHook-Allowed-Origin', requestOrigin);
                }

                await context.log('info', 'eventgrid-plugin-route-options-handshake', {
                    origin: requestOrigin,
                    flowId: req.params.flowId,
                    componentId: req.params.componentId
                });

                return response.code(200);
            }
        }
    });
};
