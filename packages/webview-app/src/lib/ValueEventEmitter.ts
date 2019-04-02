export default class ValueEventEmitter {
  _value: any;
  private eventListeners: Array<(value: any) => any> = [];
  constructor(value?: any) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  set value(newValue: any) {
    this._value = newValue;
    this.eventListeners.forEach(eventListener => {
      eventListener.call(null, this.value);
    });
  }
  addEventListener = (eventListener: (value: any) => any) => {
    this.eventListeners.push(eventListener);
    return () => {
      this.removeEventListener(eventListener);
    };
  }
  removeEventListener = (eventListener: (value: any) => any) => {
    const index = this.eventListeners.findIndex(
      listener => listener === eventListener
    );
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }
}
