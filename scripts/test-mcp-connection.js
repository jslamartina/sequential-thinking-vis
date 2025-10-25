#!/usr/bin/env node

/**
 * Simple script to test MCP connection to the sequential-thinking server
 * Run with: node scripts/test-mcp-connection.js
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testConnection() {
  console.log('🔌 Testing MCP connection to sequential-thinking server...\n');

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log('📡 Connecting to server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!\n');

    console.log('📋 Listing available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tool(s):`);
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    console.log('🧠 Testing sequential-thinking tool...');
    const result = await client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: 'This is a test thought to verify the MCP connection is working.',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      },
    });

    console.log('✅ Tool call successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log();

    console.log('🔌 Closing connection...');
    await client.close();
    await transport.close();
    console.log('✅ Connection closed successfully!\n');

    console.log('🎉 All tests passed! MCP integration is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConnection();
