# How to Run the Gate Keeper Application

The Gate Keeper is a tool that runs in the background to check your code quality before commits. It provides a web interface and WebSocket for monitoring and controlling the checks.

## Prerequisites

- Node.js (version 20 or higher recommended)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jhderojasUVa/gate-keeper.git
   cd gate-keeper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Initialize the configuration file:
   ```bash
   npx gate-keeper-init
   ```
   This creates a `gate-keeper.conf.json` file in your project root with default settings.

2. Customize the configuration file (`gate-keeper.conf.json`) to define the scripts you want to run for code quality checks. Example:
   ```json
   {
       "port": 9000,
       "host": "localhost",
       "scripts": [
           {
               "name": "Lint code",
               "command": "npm run lint"
           },
           {
               "name": "Run tests",
               "command": "npm test"
           }
       ]
   }
   ```

## Running the Application

Start the Gate Keeper server:
```bash
npx gate-keeper server
```

The server will start and display the URL where you can access the web interface (default: https://localhost:9000).

### Command Line Options

- `server`: Start the Gate Keeper server
- `client`: Open the graphical client in your browser
- `client-terminal`: Open the terminal client
- `--help`, `-h`: Show help information
- `--version`, `-v`: Show version information
- `--open`: Open browser to the web interface after starting (server mode)

Examples:
```bash
npx gate-keeper server            # Start the server
npx gate-keeper server --open     # Start and open browser
npx gate-keeper client            # Open graphical client
npx gate-keeper client-terminal   # Open terminal client
npx gate-keeper --help            # Show help
npx gate-keeper --version         # Show version
```

Initialize configuration:
```bash
npx gate-keeper-init
```

## Environment Variables

You can configure the server using environment variables:

- `GATE_KEEPER_PORT`: HTTP/HTTPS port (default: 9000)
- `GATE_KEEPER_WS_PORT`: WebSocket port (default: 9001)
- `GATE_KEEPER_MCP_PORT`: MCP port (default: 9002)
- `GATE_KEEPER_MCP_HOST`: MCP host (default: 127.0.0.1)
- `GATE_KEEPER_HTTPS`: Enable HTTPS (default: true)

Example:
```bash
GATE_KEEPER_PORT=8080 GATE_KEEPER_HTTPS=false npx gate-keeper
```

## Web Interface

Once running, open your browser to the displayed URL to:
- View the status of your code quality checks
- See results of script executions
- Monitor if you're ready to commit

## Integration with Git Hooks

The Gate Keeper is designed to integrate with Git hooks (via Husky) to automatically run checks before commits. Configure your Git hooks as needed for pre-commit validation.

## Development

This project uses TypeScript 7 beta through `@typescript/native-preview` and `tsgo`.

Build:
```bash
npm run build
```

Type-check:
```bash
npm run typecheck
```

For development purposes, you can run tests:
```bash
npm test
```

Lint the code:
```bash
npm run lint
```

## Troubleshooting

- Ensure the configuration file `gate-keeper.conf.json` exists in your project root
- Check that all scripts in the configuration are executable
- Verify that the specified ports are not in use by other applications
- If HTTPS is enabled, ensure you have proper certificates or use `GATE_KEEPER_HTTPS=false` for HTTP