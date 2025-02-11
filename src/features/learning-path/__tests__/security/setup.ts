import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

beforeAll(async () => {
  // Set timeout for all tests
  jest.setTimeout(10000);
}); 