#!/usr/bin/env node

/**
 * Simple test runner for authentication service tests
 * Usage: 
 *   npm run test:auth
 *   node tests/run-tests.ts
 *   node tests/run-tests.ts --suite=utils
 */

import { runAllUtilTests } from './utils.test';
import { runAllAuthTests } from './auth.test';
import { runAllPasswordTests } from './password.test';
import { runAllIntegrationTests, testRunner } from './integration.test';

// Parse command line arguments
const args = process.argv.slice(2);
const suiteArg = args.find(arg => arg.startsWith('--suite='));
const suite = suiteArg ? suiteArg.split('=')[1] : 'all';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const colorLog = (color: keyof typeof colors, message: string) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test execution wrapper with timing
const runTestSuite = async (name: string, testFn: () => Promise<void>) => {
  const startTime = Date.now();
  
  colorLog('cyan', `\n${'='.repeat(50)}`);
  colorLog('cyan', `🧪 Starting ${name} Test Suite`);
  colorLog('cyan', `${'='.repeat(50)}`);
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    colorLog('green', `✅ ${name} tests completed successfully in ${duration}ms`);
    return { success: true, duration, name };
  } catch (error) {
    const duration = Date.now() - startTime;
    colorLog('red', `❌ ${name} tests failed after ${duration}ms`);
    console.error(error);
    return { success: false, duration, name, error };
  }
};

// Main test runner
const main = async () => {
  colorLog('blue', '🚀 Authentication Service Test Runner');
  colorLog('white', `Running test suite: ${suite}`);
  
  const results: Array<{
    success: boolean;
    duration: number;
    name: string;
    error?: any;
  }> = [];

  const startTime = Date.now();

  try {
    switch (suite.toLowerCase()) {
      case 'utils':
        results.push(await runTestSuite('Utils', runAllUtilTests));
        break;
        
      case 'auth':
        results.push(await runTestSuite('Authentication', runAllAuthTests));
        break;
        
      case 'password':
        results.push(await runTestSuite('Password Management', runAllPasswordTests));
        break;
        
      case 'integration':
        results.push(await runTestSuite('Integration', runAllIntegrationTests));
        break;
        
      case 'all':
      default:
        results.push(await runTestSuite('Utils', runAllUtilTests));
        results.push(await runTestSuite('Authentication', runAllAuthTests));
        results.push(await runTestSuite('Password Management', runAllPasswordTests));
        results.push(await runTestSuite('Integration', runAllIntegrationTests));
        break;
    }

    // Summary report
    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    colorLog('cyan', `\n${'='.repeat(60)}`);
    colorLog('white', '📊 TEST SUMMARY REPORT');
    colorLog('cyan', `${'='.repeat(60)}`);
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      colorLog(color, `${status} ${result.name}: ${result.duration}ms`);
    });

    colorLog('white', `\nTotal Runtime: ${totalDuration}ms`);
    colorLog('green', `Passed: ${passed}`);
    
    if (failed > 0) {
      colorLog('red', `Failed: ${failed}`);
    }

    const overallSuccess = failed === 0;
    
    if (overallSuccess) {
      colorLog('green', '\n🎉 All tests passed successfully!');
      colorLog('white', '   Your authentication service is working correctly.');
    } else {
      colorLog('red', '\n💥 Some tests failed!');
      colorLog('white', '   Please check the error messages above.');
    }

    colorLog('cyan', `${'='.repeat(60)}\n`);
    
    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    colorLog('red', '\n💥 Test runner encountered an error:');
    console.error(error);
    process.exit(1);
  }
};

// Usage information
const showUsage = () => {
  colorLog('yellow', '\n📖 Usage:');
  colorLog('white', '  node tests/run-tests.ts [--suite=SUITE_NAME]');
  colorLog('white', '\nAvailable test suites:');
  colorLog('white', '  --suite=utils       Run utility function tests');
  colorLog('white', '  --suite=auth        Run authentication endpoint tests');
  colorLog('white', '  --suite=password    Run password management tests');
  colorLog('white', '  --suite=integration Run integration tests');
  colorLog('white', '  --suite=all         Run all tests (default)');
  colorLog('white', '\nExamples:');
  colorLog('white', '  node tests/run-tests.ts');
  colorLog('white', '  node tests/run-tests.ts --suite=utils');
  colorLog('white', '  npm run test:auth\n');
};

// Handle help flags
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the tests
main().catch(error => {
  colorLog('red', '\n💥 Unexpected error in test runner:');
  console.error(error);
  process.exit(1);
}); 