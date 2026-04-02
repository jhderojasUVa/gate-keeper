# @jhderojasUVa/gate-keeper

Working on trunk development with JS or TS? This tool is the first line of defence about pushing bad code. It consist in an application running in the background that will check your code before commit (or at any time if you enable it when detecting a change on your code) that will run the scripts you want and let you commit or not by adding a pre-commit hook.

For detailed instructions on how to install and run the application, see [HOW_TO.md](HOW_TO.md).

## Usage

Gate Keeper provides both server and client modes:

- **Server Mode**: Start the background service that monitors code quality
- **Web Client**: Open the graphical web interface in a browser
- **Terminal Client**: Open the terminal-based interface for command-line users

### Commands

```bash
# Start the Gate Keeper server
gate-keeper server

# Start server and automatically open web client
gate-keeper server --open

# Open the graphical web client
gate-keeper client

# Open the terminal client
gate-keeper client-terminal

# Show help
gate-keeper --help
```

# Libraries used

- Vitest: Unit testing
- Husky: Git hooks
- Commitizen: Conventional Commits wizard
- Commitlint: Lint commit messages
- Eslint: Lint code
- Standard-version: For releases

# Config file

For running this tool you will need to have a configuration file on the root of your project `gate-keeper.conf.json`.

# Plugin/Scripts

You can customize the behavior of the gate-keeper by adding your own scripts in the `gate-keeper.conf.json` configuration file. Each script entry should specify a name and the command to execute. These scripts will be run sequentially before allowing a commit.

# Websocket based, web and terminal client

This application is a background application that contains a web server and a websocket. The webserver is used as an application for checking the status of your code and if you can commit, meanwhile the websocket is the engine of the gate keeper.

The websocket protocol enables bidirectional communication between the server and client, allowing real-time updates on script execution status and immediate feedback on code quality checks. The web interface provides a user-friendly dashboard to monitor and manage the gate-keeper service.

Additionally, a terminal-based client is available for users who prefer command-line interfaces. The terminal client provides the same real-time monitoring capabilities as the web interface, displaying commit status and system logs directly in the terminal using a text-based UI.

# Env var configuration

You can configure the server by passing this environmental variables:

- `GATE_KEEPER_PORT`: By default 9000
- `GATE_KEEPER_WS_PORT`: By default 9001
- `GATE_KEEPER_HTTPS`: Boolean, by default true

# Websocket messages

The websocket communication follows a request-response pattern. Clients can send messages to trigger script executions, request status updates, and receive real-time notifications about the processing status. Common message types include script execution requests, status queries, and result notifications.

Both the web and terminal clients connect to the same websocket endpoint to receive live updates about code quality checks and commit permissions.

## AI Agents Integration

This project is fully integrated with a collaborative AI loop logic (Coder, Tester, Reviewer).
All agents are strictly controlled by the rules articulated in [AGENT_RULESET.md](AGENT_RULESET.md). 
To learn how to execute automated workflows via these agents, read the guide at [AGENTS.md](AGENTS.md) or invoke the agent framework using prompt commands.

# Contributing

We welcome contributions to the gate-keeper project! Please see [CONTRIBUTE.md](CONTRIBUTE.md) for detailed guidelines on how to contribute.

# License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.