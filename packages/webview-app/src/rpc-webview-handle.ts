import { evaluate, invalidate } from './evaluate';
import {
  currentBuildError,
  startReportingRuntimeErrorsIfNotStarted,
  handleBuildError,
  dismissBuildError
} from './lib/errors';

class RPCWebviewHandle {
  constructor() {}

  updatePreview(code: string, entryFilePath: string, entryFileDependencies: Array<string>) {
    startReportingRuntimeErrorsIfNotStarted();
    if (currentBuildError) {
      dismissBuildError();
    }
    evaluate(code, entryFilePath, entryFileDependencies);
  }

  showPreviewError(error: Error) {
    startReportingRuntimeErrorsIfNotStarted();
    handleBuildError(error);
  }

  async invalidate(fsPath: string) {
    await invalidate(fsPath);
  }
}

export default RPCWebviewHandle;