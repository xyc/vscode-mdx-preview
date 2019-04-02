import { SecurityPolicy } from './security';

const NO_CSP = '';

const DEFAULT_CSP =
  "default-src 'none'; connect-src vscode-resource: https:; img-src vscode-resource: https:; script-src vscode-resource: 'unsafe-inline';style-src vscode-resource: 'unsafe-inline' http: https: data:;";

export function getCSP(securityConfiguration: {
  securityPolicy: SecurityPolicy;
}) {
  const { securityPolicy } = securityConfiguration;
  if (securityPolicy === SecurityPolicy.Strict) {
    return DEFAULT_CSP;
  }
  if (securityPolicy === SecurityPolicy.Disabled) {
    return NO_CSP;
  }
  return DEFAULT_CSP;
}
