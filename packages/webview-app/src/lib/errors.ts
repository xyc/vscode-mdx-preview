
const {
  startReportingRuntimeErrors,
  reportBuildError,
  dismissBuildError: dismissBuildErrorInOverlay,
  dismissRuntimeErrors: dismissRuntimeErrorsInOverlay,
} = require('react-error-overlay');

let currentBuildError: Error | null = null;
let hasRuntimeError = false;

let hasStartedReportingRuntimeErrors = false;
function startReportingRuntimeErrorsIfNotStarted() {
  if (!hasStartedReportingRuntimeErrors) {
    startReportingRuntimeErrors({ onError: () => {} });
    hasStartedReportingRuntimeErrors = true;
  }
}

const dismissBuildError = () => {
  currentBuildError = null;
  dismissBuildErrorInOverlay();
};

const dismissRuntimeErrors = () => {
  hasRuntimeError = false;
  dismissRuntimeErrorsInOverlay();
};

const handleBuildError = (error: Error) => {
  currentBuildError = error;
  if (error.message) {
    reportBuildError(error.message);
  }
};

/**
 * Consolidating all runtime errors here.
 * @param error error to handle
 */
const handleRuntimeError = (error: Error) => {
  hasRuntimeError = true;
  throw new Error(error.message);
};

export {
  startReportingRuntimeErrorsIfNotStarted,
  currentBuildError,
  hasRuntimeError,
  dismissBuildError,
  dismissRuntimeErrors,
  handleBuildError,
  handleRuntimeError,
};