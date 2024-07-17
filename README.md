# @jhderojas/gate-keeper

Working on trunk development with JS or TS? This tool is the first line of defence about pushing bad code. It consist in an application running in the background that will check your code before commit (or at any time if you enable it when detecting a change on your code) that will run the scripts you want and let you commit or not by adding a pre-commit hook.

# Libraries used

- Jest: Unit testing
- Husky: Git hooks
- Commitizen: Conventional Commits wizard
- Commitlint: Lint commit messages
- Eslint: Lint code
- Standard-version: For releases

# Config file

For running this tool you will need to have a configuration file on the root of your project `gate-keeper.conf.json`.

# Plugin/Scripts

You can customize by adding wh

# Websocket based, web and terminal client

This application is a background application that contains a web server and a websocket. The webserver is used as an application for checking the status of your code and if you can commit, meanwhile the websocket is the engine of the gate keeper.

The

# Env var configuration

You can configure the server by passing this environmental variables:

- `GATE_KEEPER_PORT`: By default 9000
- `GATE_KEEPER_WS_PORT`: By default 9001
- `GATE_KEEPER_HTTPS`: Boolean, by default true

# Websocket messages