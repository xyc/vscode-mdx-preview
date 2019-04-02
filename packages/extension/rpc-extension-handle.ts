const { performance } = require('perf_hooks');
import { Preview } from './preview/preview-manager';

import { fetchLocal } from './module-fetcher';

class ExtensionHandle {
  preview: Preview;
  constructor(preview: Preview) {
    this.preview = preview;
  }

  handshake() {
    this.preview.resolveWebviewHandshakePromise();
  }

  reportPerformance(evaluationDuration: DOMHighResTimeStamp) {
    this.preview.evaluationDuration = evaluationDuration;
    performance.mark('preview/end');
    performance.measure('preview duration', 'preview/start', 'preview/end');
  }

  async fetch(pathname, isBare) {
    return fetchLocal(pathname, isBare, this.preview);
  }
}

export default ExtensionHandle;