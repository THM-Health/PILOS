import mitt from 'mitt';

/**
 * Event bus that can be used to emit events between services and
 * other parts of the application.
 */
const EventBus = mitt();

// listen to all events in development mode
if (process.env.NODE_ENV === 'development') {
  EventBus.on('*', (type, e) => console.debug('[EventBus]', type, e));
}

export default EventBus;
