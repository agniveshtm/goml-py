#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from './parser';
import { stringify } from './serializer';
import { GomlError } from './errors';

function printHelp(): void {
  console.log(`
GOML Parser v0.1.0

Usage:
  goml <command> [options]

Commands:
  parse <file>           Parse a GOML file and output JSON
  stringify <file>       Convert JSON file to GOML format
  convert <in> <out>     Convert between formats

Options:
  -i, --indent <n>       Indentation level (default: 2)
  -h, --help            Show this help message
  -v, --version         Show version
`);
}

function printVersion(): void {
  console.log('0.1.0');
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === '-h' || command === '--help') {
    printHelp();
    process.exit(0);
  }

  if (command === '-v' || command === '--version') {
    printVersion();
    process.exit(0);
  }

  if (command === 'parse') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: No input file specified');
      process.exit(1);
    }

    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const result = parse(content);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      if (e instanceof GomlError) {
        console.error(`Parse error at ${e.line}:${e.col}: ${e.message}`);
      } else {
        console.error('Error:', (e as Error).message);
      }
      process.exit(1);
    }
  } else if (command === 'stringify') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: No input file specified');
      process.exit(1);
    }

    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    let indent = 2;
    const indentIdx = args.indexOf('-i') !== -1 ? args.indexOf('-i') : args.indexOf('--indent');
    if (indentIdx !== -1 && args[indentIdx + 1]) {
      indent = parseInt(args[indentIdx + 1], 10);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      const goml = stringify(json, indent);
      console.log(goml);
    } catch (e) {
      if (e instanceof GomlError) {
        console.error(`Error at ${e.line}:${e.col}: ${e.message}`);
      } else {
        console.error('Error:', (e as Error).message);
      }
      process.exit(1);
    }
  } else if (command === 'convert') {
    const inputPath = args[1];
    const outputPath = args[2];

    if (!inputPath || !outputPath) {
      console.error('Error: Input and output files required');
      process.exit(1);
    }

    if (!existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    try {
      const content = readFileSync(inputPath, 'utf-8');
      let result: string;

      if (inputPath.endsWith('.json')) {
        const json = JSON.parse(content);
        result = stringify(json);
      } else {
        const parsed = parse(content);
        result = JSON.stringify(parsed, null, 2);
      }

      writeFileSync(outputPath, result, 'utf-8');
      console.log(`Converted ${inputPath} -> ${outputPath}`);
    } catch (e) {
      if (e instanceof GomlError) {
        console.error(`Error at ${e.line}:${e.col}: ${e.message}`);
      } else {
        console.error('Error:', (e as Error).message);
      }
      process.exit(1);
    }
  } else if (command.endsWith('.goml')) {
    const filePath = command;

    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const result = parse(content);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      if (e instanceof GomlError) {
        console.error(`Parse error at ${e.line}:${e.col}: ${e.message}`);
      } else {
        console.error('Error:', (e as Error).message);
      }
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
}

main();
