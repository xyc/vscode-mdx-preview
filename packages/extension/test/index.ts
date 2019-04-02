// //
// // PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
// //
// // This file is providing the test runner to use when running extension tests.
// // The test runner in use is Jest based.

import * as testRunner from './jest-test-runner/jest-test-runner';
import path from 'path';

testRunner.configure({
    rootDir: path.join(__dirname, '../../../'),
    roots: [ '<rootDir>/packages/extension' ],
    tsConfig: '<rootDir>/tsconfig.json'
});

module.exports = testRunner;