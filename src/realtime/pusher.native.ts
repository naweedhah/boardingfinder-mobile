// React Native build of pusher-js: uses NetInfo to reconnect when the phone comes back online.
import type PusherClass from 'pusher-js/react-native';
import * as pusherModule from 'pusher-js/react-native';

// The React Native bundle sets `module.exports.Pusher` and has no default export, although its
// typings declare one. Re-exporting `default` would hand Echo the module object, which then
// fails with "Object cannot be used as a constructor".
const Pusher = (pusherModule as unknown as { Pusher: typeof PusherClass }).Pusher;

export default Pusher;
