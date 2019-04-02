import { evaluate } from './evaluate';
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
}

export default RPCWebviewHandle;