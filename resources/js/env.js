export default {
  WELCOME_MESSAGE_LIMIT: process.env.MIX_WELCOME_MESSAGE_LIMIT || 500,
  REFRESH_RATE: process.env.MIX_REFRESH_RATE || 30,
  BASE_URL: document.getElementsByName('base-url')[0] !== undefined ? document.getElementsByName('base-url')[0].getAttribute('content') : ''
};
