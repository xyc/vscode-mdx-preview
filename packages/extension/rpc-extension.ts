import * as comlink from '@dxflow/comlink/umd/comlink';
import { Endpoint } from '@dxflow/comlink/umd/comlink';
import * as vscode from 'vscode';

import ExtensionHandle from './rpc-extension-handle';

import { Preview } from './preview/preview-manager';

type allowedTypeForComlink = 'message';

class ExtensionEndpoint implements Endpoint {
  webview: vscode.Webview;
  disposables: vscode.Disposable[];
  disposeEventListener: vscode.Disposable;
  currentListener: EventListener;
  constructor(webview: vscode.Webview, disposables: vscode.Disposable[]) {
    this.webview = webview;
    this.disposables = disposables;
  }

  postMessage(message: any) {
    this.webview.postMessage(message);
  }

  addEventListener(type: allowedTypeForComlink, listener: EventListener) {
    this.currentListener = listener;
    this.disposeEventListener = this.webview.onDidReceiveMessage(message => {
      const messageEvent: MessageEvent = {
        data: message,
        lastEventId: null,
        origin: null,
        ports: null,
        source: null,
        bubbles: null,
        cancelBubble: null,
        cancelable: null,
        composed: null,
        currentTarget: null,
        defaultPrevented: null,
        eventPhase: null,
        isTrusted: null,
        returnValue: null,
        srcElement: null,
        target: null,
        timeStamp: null,
        type: null,
        composedPath: null,
        initEvent: null,
        preventDefault: null,
        stopImmediatePropagation: null,
        AT_TARGET: null,
        stopPropagation: null,
        BUBBLING_PHASE: null,
        CAPTURING_PHASE: null,
        NONE: null,
      };
      listener(messageEvent);
    }, null, this.disposables);
  }

  removeEventListener(type: allowedTypeForComlink, listener: EventListener) {
    if (this.currentListener === listener && this.disposeEventListener) {
      this.disposeEventListener.dispose();
    }
  }
}

// NOTE: we only support 1 webview at this time
export function initRPCExtensionSide(preview: Preview, webview: vscode.Webview, disposables: vscode.Disposable[]) {
  const extensionEndpoint = new ExtensionEndpoint(webview, disposables);

  // Webview to extension calls
  const handle = new ExtensionHandle(preview);
  comlink.expose(handle, extensionEndpoint);

  // Extension to webview calls
  const WebviewHandle = comlink.proxy(extensionEndpoint);
  return WebviewHandle;
}