#!/usr/bin/env bun

/**
 * Comprehensive test runner script for Forge MOI
 * Runs all test suites with proper coordination and reporting
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  output: string;
  coverage?: number;
}

interface TestSuite {
  name: string;
  command: string;
  args: string[];
  timeout: number;
  parallel: boolean;
  required: boolean;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'bun',
      args: ['test'],
      timeout: 300000, // 5 minutes
      parallel: false,
      required: true,
    },
    {
      name: 'Unit Tests with Coverage',
      command: 'bun',
      args: ['test:coverage'],
      timeout: 600000, // 10 minutes
      parallel: false,
      required: true,
    },
    {
      name: 'Performance Tests',
      command: 'bun',
      args: ['test:perf'],
      timeout: 1800000, // 30 minutes
      parallel: true,
      required: false,
    },
    {
      name: 'E2E Tests',
      command: 'bun',
      args: ['test:e2e'],
      timeout: 1200000, // 20 minutes
      parallel: true,
      required: true,
    },
    {
      name: 'Rust Backend Tests',
      command: 'cargo',
      args: ['test'],
      timeout: 600000, // 10 minutes
      parallel: true,
      required: true,
    },
    {
      name: 'Integration Tests',
      command: 'bun',
      args: ['test', 'src/test/integration/'],
      timeout: 900000, // 15 minutes
      parallel: true,
      required: true,
    },
    {
      name: 'TypeScript Check',
      command: 'bunx',
      args: ['tsc', '--noEmit'],
      timeout: 120000, // 2 minutes
      parallel: true,
      required: true,
    },
    {
      name: 'ESLint',
      command: 'bun',
      args: ['run', 'lint'],
      timeout: 180000, // 3 minutes
      parallel: true,
      required: false,
    },
  ];

  async run(): Promise<void> {
    console.log('🚀 Starting Forge MOI Test Suite');
    console.log('=====================================\n');

    this.startTime = Date.now();

    // Prepare test environment
    await this.setupTestEnvironment();

    // Run serial tests first
    const serialTests = this.testSuites.filter(suite => !suite.parallel);
    for (const suite of serialTests) {
      await this.runTestSuite(suite);
    }

    // Run parallel tests
    const parallelTests = this.testSuites.filter(suite => suite.parallel);
    await this.runParallelTests(parallelTests);

    // Generate reports
    await this.generateReports();

    // Summary
    this.printSummary();

    // Exit with appropriate code
    const hasFailures = this.results.some(result => !result.success);
    const hasRequiredFailures = this.results.some(
      result => !result.success && this.getTestSuite(result.name)?.required
    );

    if (hasRequiredFailures) {
      console.log('\n❌ Required tests failed. Exiting with error code 1.');
      process.exit(1);
    } else if (hasFailures) {
      console.log('\n⚠️  Some optional tests failed. Exiting with warning code 0.');
      process.exit(0);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    // Create results directories
    const dirs = [
      'e2e/results',
      'performance/results',
      'src/test/integration/results',
      'coverage',
      'test-reports',
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Check if Playwright browsers are installed
    try {
      await this.executeCommand('bunx', ['playwright', '--version'], 30000);
    } catch (error) {
      console.log('📦 Installing Playwright browsers...');
      await this.executeCommand('bunx', ['playwright', 'install'], 300000);
    }

    console.log('✅ Test environment ready\n');
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`);
    
    const startTime = Date.now();
    
    try {
      const output = await this.executeCommand(
        suite.command,
        suite.args,
        suite.timeout,
        suite.name === 'Rust Backend Tests' ? 'src-tauri' : undefined
      );

      const duration = Date.now() - startTime;
      
      this.results.push({
        name: suite.name,
        success: true,
        duration,
        output,
      });

      console.log(`✅ ${suite.name} completed in ${this.formatDuration(duration)}\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: suite.name,
        success: false,
        duration,
        output: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${suite.name} failed in ${this.formatDuration(duration)}`);
      console.log(`Error: ${error}\n`);
    }
  }

  private async runParallelTests(suites: TestSuite[]): Promise<void> {
    if (suites.length === 0) return;

    console.log(`🔄 Running ${suites.length} test suites in parallel...`);

    const promises = suites.map(suite => this.runTestSuite(suite));
    await Promise.all(promises);
  }

  private async executeCommand(
    command: string,
    args: string[],
    timeout: number,
    cwd?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: cwd || process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with exit code ${code}\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private async generateReports(): Promise<void> {
    console.log('📊 Generating test reports...');

    // Generate JSON report
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        requiredPassed: this.results.filter(r => r.success && this.getTestSuite(r.name)?.required).length,
        requiredFailed: this.results.filter(r => !r.success && this.getTestSuite(r.name)?.required).length,
      },
    };

    await fs.writeFile(
      'test-reports/test-results.json',
      JSON.stringify(reportData, null, 2)
    );

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportData);
    await fs.writeFile('test-reports/test-results.html', htmlReport);

    // Generate JUnit XML for CI
    const junitXml = this.generateJunitXml();
    await fs.writeFile('test-reports/junit.xml', junitXml);

    console.log('✅ Reports generated in test-reports/\n');
  }

  private generateHtmlReport(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Forge MOI Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
    .passed { border-left: 5px solid #4caf50; }
    .failed { border-left: 5px solid #f44336; }
    .result { margin: 10px 0; padding: 15px; border-radius: 5px; }
    .result.success { background: #e8f5e8; }
    .result.failure { background: #fce8e8; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Forge MOI Test Results</h1>
    <p>Generated on ${data.timestamp}</p>
    <p>Total Duration: ${this.formatDuration(data.totalDuration)}</p>
  </div>
  
  <div class="summary">
    <div class="metric passed">
      <h3>${data.summary.passed}</h3>
      <p>Passed</p>
    </div>
    <div class="metric failed">
      <h3>${data.summary.failed}</h3>
      <p>Failed</p>
    </div>
    <div class="metric">
      <h3>${data.summary.requiredPassed}/${data.summary.requiredPassed + data.summary.requiredFailed}</h3>
      <p>Required Tests</p>
    </div>
  </div>

  <h2>Test Results</h2>
  ${data.results.map((result: TestResult) => `
    <div class="result ${result.success ? 'success' : 'failure'}">
      <h3>${result.name} ${result.success ? '✅' : '❌'}</h3>
      <p>Duration: ${this.formatDuration(result.duration)}</p>
      ${result.success ? '' : `<pre>${result.output}</pre>`}
    </div>
  `).join('')}
</body>
</html>
    `;
  }

  private generateJunitXml(): string {
    const totalTests = this.results.length;
    const failures = this.results.filter(r => !r.success).length;
    const totalTime = (Date.now() - this.startTime) / 1000;

    const testCases = this.results.map(result => `
    <testcase name="${result.name}" time="${(result.duration / 1000).toFixed(3)}">
      ${result.success ? '' : `
        <failure message="Test failed">
          <![CDATA[${result.output}]]>
        </failure>
      `}
    </testcase>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Forge MOI Test Suite" tests="${totalTests}" failures="${failures}" time="${totalTime.toFixed(3)}">
  ${testCases}
</testsuite>`;
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);
    console.log('\nDetailed Results:');
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const required = this.getTestSuite(result.name)?.required ? '(Required)' : '(Optional)';
      console.log(`  ${status} ${result.name} ${required} - ${this.formatDuration(result.duration)}`);
    });
  }

  private getTestSuite(name: string): TestSuite | undefined {
    return this.testSuites.find(suite => suite.name === name);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Forge MOI Test Runner

Usage: bun run scripts/test-runner.ts [options]

Options:
  --help, -h        Show this help message
  --suite <name>    Run specific test suite only
  --parallel        Run all tests in parallel (faster but less stable)
  --skip-setup      Skip test environment setup
  --verbose         Enable verbose output

Examples:
  bun run scripts/test-runner.ts
  bun run scripts/test-runner.ts --suite "Unit Tests"
  bun run scripts/test-runner.ts --parallel
    `);
    process.exit(0);
  }

  const runner = new TestRunner();
  await runner.run();
}

// Check if running as main module
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };