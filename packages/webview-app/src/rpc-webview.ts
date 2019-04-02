import * as comlink from 'comlink';
import { Endpoint } from 'comlink';
import RPCWebviewHandle from './rpc-webview-handle';

declare const acquireVsCodeApi: Function;
const vscodeApi = acquireVsCodeApi();

class WebviewProxy implements Endpoint{
  // post to extension
  postMessage(message: any) {
    vscodeApi.postMessage(message);
  }
  // bind window's event listeners so comlink can listen on message
  addEventListener = self.addEventListener.bind(self);
  removeEventListener = self.removeEventListener.bind(self);
}

// TODO: types
let ExtensionHandle: any;
export function initRPCWebviewSide() {
  // Webview to extension calls
  const webviewEndpont = new WebviewProxy();
  ExtensionHandle = comlink.proxy(webviewEndpont);

  // Extension to webview calls
  const webviewHandle = new RPCWebviewHandle();
  comlink.expose(webviewHandle, webviewEndpont);

  ExtensionHandle.handshake();
}

export { ExtensionHandle };
