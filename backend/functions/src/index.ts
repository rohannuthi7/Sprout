import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { corsOk } from './utils/auth';

import { intakeMessageHandler, sendReplyHandler } from './functions/intake';
import {
  getThreadsHandler,
  getMessagesHandler,
  parkThreadHandler,
  archiveThreadHandler,
  getCustomersHandler,
} from './functions/threads';
import {
  getOrdersHandler,
  getOrderHandler,
  savePricingConfigHandler,
  getPricingConfigHandler,
  getOwnerProfileHandler,
  updateOwnerProfileHandler,
  logQuoteCorrectionHandler,
} from './functions/orders';
import {
  confirmAndBookHandler,
  declineOrderHandler,
  googleAuthCallbackHandler,
  getCalendarAuthUrlHandler,
} from './functions/calendar';
import { webIntakeSubmitHandler } from './functions/webIntake';

// Preserve existing named exports so no existing references break.
export {
  intakeMessageHandler, sendReplyHandler,
  getThreadsHandler, getMessagesHandler, parkThreadHandler, archiveThreadHandler, getCustomersHandler,
  getOrdersHandler, getOrderHandler, savePricingConfigHandler, getPricingConfigHandler,
  getOwnerProfileHandler, updateOwnerProfileHandler, logQuoteCorrectionHandler,
  confirmAndBookHandler, declineOrderHandler, googleAuthCallbackHandler, getCalendarAuthUrlHandler,
  webIntakeSubmitHandler,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Single-Lambda router for the sprout-backend function.
// Matches on event.resource (template path with {param} placeholders) rather than
// event.path (which has real IDs substituted in), so parameterized routes resolve correctly.
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') return corsOk();

  const route = `${event.httpMethod} ${event.resource}`;

  switch (route) {
    // Intake
    case 'POST /intake/message':              return intakeMessageHandler(event);
    case 'POST /intake/reply':                return sendReplyHandler(event);

    // Threads
    case 'GET /threads':                      return getThreadsHandler(event);
    case 'GET /threads/{threadId}/messages':  return getMessagesHandler(event);
    case 'POST /threads/{threadId}/park':     return parkThreadHandler(event);
    case 'POST /threads/{threadId}/archive':  return archiveThreadHandler(event);

    // Customers
    case 'GET /customers':                    return getCustomersHandler(event);

    // Orders
    case 'GET /orders':                       return getOrdersHandler(event);
    case 'GET /orders/pricing':               return getPricingConfigHandler(event);
    case 'POST /orders/pricing':              return savePricingConfigHandler(event);
    case 'GET /orders/{orderId}':             return getOrderHandler(event);
    case 'POST /orders/{orderId}/quote':      return logQuoteCorrectionHandler(event);

    // Profile
    case 'GET /profile':                      return getOwnerProfileHandler(event);
    case 'PUT /profile':                      return updateOwnerProfileHandler(event);

    // Calendar & booking
    case 'POST /calendar/confirm':            return confirmAndBookHandler(event);
    case 'POST /calendar/decline':            return declineOrderHandler(event);
    case 'GET /calendar/auth-url':            return getCalendarAuthUrlHandler(event);
    case 'GET /calendar/callback':            return googleAuthCallbackHandler(event);

    // Public web intake
    case 'POST /web-intake':                  return webIntakeSubmitHandler(event);

    default:
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `Route not found: ${route}` }),
      };
  }
};
