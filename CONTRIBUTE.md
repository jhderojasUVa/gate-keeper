# Contributing to Gate Keeper

Thank you for your interest in contributing to the Gate Keeper project! We appreciate all contributions, whether they are bug fixes, new features, documentation improvements, or other enhancements.

## How to Contribute

### Prerequisites

Before you start, make sure you have:
- Node.js (version 14 or higher)
- npm or yarn
- Git

### Step-by-Step Contribution Guide

#### 1. Fork the Repository

Click the "Fork" button on the [Gate Keeper GitHub repository](https://github.com/jhderojasUVa/gate-keeper) to create your own copy of the project.

#### 2. Clone Your Fork

Clone the forked repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/gate-keeper.git
cd gate-keeper
```

Replace `YOUR_USERNAME` with your GitHub username.

#### 3. Create a Feature Branch

Create a new branch for your changes. Use a descriptive branch name that clearly indicates what you're working on:

```bash
git checkout -b feature/your-feature-name
```

Or for bug fixes:

```bash
git checkout -b fix/bug-description
```

Examples:
- `feature/add-new-script-validation`
- `fix/websocket-connection-issue`
- `docs/update-readme`

#### 4. Make Your Changes

Make your code changes in your feature branch. Follow these guidelines:

- **Code Style**: Follow the project's existing code style. The project uses ESLint for linting.
- **Testing**: Add or update tests for your changes using Jest.
- **Documentation**: Update relevant documentation, including README.md and other docs if needed.
- **Commits**: Make clear, concise commits with descriptive messages following conventional commits format.

#### 5. Run Tests and Linting

Before committing your changes, ensure all tests pass and the code meets linting standards:

```bash
npm run lint          # Check code style
npm run lint:fix      # Fix linting issues automatically
npm run test          # Run unit tests
```

#### 6. Commit Your Changes

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format for all commit messages. This standardized format helps us maintain clear project history and enables automated changelog generation.

**Conventional Commits Format:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Code changes that improve performance
- `test`: Adding or updating test cases
- `chore`: Changes to build process, dependencies, or other non-code items

**Examples:**

```bash
# Simple commit
git commit -m "feat: add validation for script names"

# With scope
git commit -m "fix(websocket): resolve connection timeout issue"

# With detailed body
git commit -m "feat: add real-time status updates

- Implement WebSocket polling for status changes
- Add visual indicators for script execution progress
- Update UI to reflect execution state in real-time"
```

**Best Practices:**

- Use the imperative mood ("add" not "added" or "adds")
- Keep the first line under 50 characters
- Reference issues when applicable (e.g., "fix: resolve #123")
- Provide context in the body if the commit is complex

#### 7. Push to Your Fork

Push your changes to your forked repository:

```bash
git push origin feature/your-feature-name
```

#### 8. Create a Pull Request

1. Navigate to the [original Gate Keeper repository](https://github.com/jhderojasUVa/gate-keeper)
2. Click on "Pull requests" tab
3. Click "New Pull Request" button
4. Select your fork and branch as the source
5. Provide a clear title and description of your changes
6. Submit the pull request

### Pull Request Guidelines

When creating a pull request, please:

- Provide a clear, descriptive title
- Write a detailed description of the changes and why they were made
- Reference any related issues (e.g., "Closes #123")
- Include before/after screenshots if applicable
- Ensure all CI checks pass
- Keep your PR focused on a single feature or fix; avoid combining multiple unrelated changes

## Code of Conduct

Please be respectful and professional in all interactions. We aim to maintain a welcoming and inclusive community.

## Questions or Issues?

If you have questions about contributing or encounter any issues during the process, feel free to:

- Open an [issue](https://github.com/jhderojasUVa/gate-keeper/issues) on GitHub
- Contact the maintainers directly

## Additional Resources

- [HOW_TO.md](HOW_TO.md) - Installation and running instructions
- [AGENT_RULESET.md](AGENT_RULESET.md) - AI agent rules and guidelines
- [AGENTS.md](AGENTS.md) - AI agents documentation

Thank you for contributing to Gate Keeper!
