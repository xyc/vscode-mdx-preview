import * as testRunner from './jest-test-runner/jest-test-runner';
import path from 'path';

testRunner.configure({
  rootDir: path.join(__dirname, '../../../'),
  roots: ['<rootDir>/packages/extension'],
  tsConfig: '<rootDir>/tsconfig.json',
  updateSnapshot: true,
});

module.exports = testRunner;
