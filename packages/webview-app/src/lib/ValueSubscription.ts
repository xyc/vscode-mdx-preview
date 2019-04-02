import { createSubscription } from 'create-subscription';
import ValueEventEmitter from './ValueEventEmitter';

const ValueSubscription = createSubscription({
  getCurrentValue(source: ValueEventEmitter) {
    return source.value;
  },
  subscribe(source: ValueEventEmitter, callback) {
    return source.addEventListener(callback);
  },
});

export default ValueSubscription;