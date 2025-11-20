# Contributing to Foundry Live Agents

Thank you for your interest in contributing! This project aims to provide high-quality, educational content for building voice agents with Azure Speech Voice Live API.

## How to Contribute

### 1. Reporting Issues

- Check existing issues before creating a new one
- Provide clear reproduction steps
- Include environment details (OS, language version, Azure region)
- Attach relevant logs or error messages

### 2. Suggesting Enhancements

- Open an issue with the `enhancement` label
- Describe the use case and expected behavior
- Explain why this would benefit the community

### 3. Code Contributions

#### Before You Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Review the repository structure and coding standards

#### Coding Standards

**TypeScript/JavaScript:**
- Use TypeScript for type safety
- Follow ESLint configuration
- Use async/await for asynchronous operations
- Document complex functions with JSDoc

**Python:**
- Follow PEP 8 style guide
- Use type hints
- Include docstrings for functions and classes
- Use async/await with asyncio

**Go:**
- Follow Go formatting standards (`gofmt`)
- Use meaningful variable names
- Add comments for exported functions
- Handle errors explicitly

**C#:**
- Follow Microsoft C# coding conventions
- Use async/await for asynchronous operations
- Include XML documentation comments
- Use dependency injection patterns

**Swift:**
- Follow Swift API Design Guidelines
- Use SwiftUI best practices
- Document public APIs
- Handle errors with Result types

#### Code Requirements

- **Working Examples**: All code must compile and run
- **Documentation**: Add comments and README files
- **Environment Variables**: Use `.env.example` pattern
- **Error Handling**: Implement robust error handling
- **Configuration**: Make examples easily configurable

### 4. Documentation Contributions

We especially welcome improvements to:

- Tutorial clarity and completeness
- Code comments and explanations
- Additional language translations
- Voice/language configuration examples
- Agent scenario variations

#### Documentation Standards

- Write in clear, concise English
- Use code blocks with language specification
- Include practical examples
- Add diagrams where helpful (Mermaid, ASCII art)
- Follow the established learning path structure

### 5. New Agent Scenarios

When contributing new agent scenarios:

1. Create a directory in `agents/your-agent-name/`
2. Include:
   - `README.md` - Overview and use case description
   - `config.json` - Complete session configuration
   - `prompt.txt` - System prompt
   - `functions.json` - Function definitions (if applicable)
   - `example-conversation.md` - Sample interaction
3. Test with multiple voices and languages
4. Document any specific requirements or limitations

### 6. New Voice Configurations

When adding voice configurations:

1. Place in `config/voice-configs/`
2. Include voice metadata (locale, style, gender)
3. Add optimal temperature and parameter settings
4. Test audio quality
5. Update `docs/voice-catalog.md`

## Development Setup

### Prerequisites

```bash
# Install Node.js 18+
node --version

# Install Python 3.10+
python --version

# Install Go 1.21+
go version

# Install .NET 8.0+
dotnet --version

# Install Xcode 15+ (macOS only)
xcodebuild -version
```

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/foundry-live-agents.git
cd foundry-live-agents

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Azure credentials

# Run playground
npm run playground
```

## Pull Request Process

1. **Update Documentation**: Ensure README and relevant docs are updated
2. **Test Thoroughly**: Test your changes in multiple scenarios
3. **Follow Commit Conventions**: Use clear, descriptive commit messages
   ```
   feat: Add customer support agent scenario
   fix: Resolve WebSocket reconnection issue
   docs: Update voice catalog with new HD voices
   ```
4. **Create Pull Request**: 
   - Provide clear description of changes
   - Reference related issues
   - Include screenshots/recordings if applicable
5. **Code Review**: Address feedback promptly
6. **Sign-off**: Ensure you have rights to submit the code

## Testing Guidelines

### Manual Testing Checklist

- [ ] Code compiles/runs without errors
- [ ] WebSocket connection establishes successfully
- [ ] Audio streaming works bidirectionally
- [ ] VAD triggers appropriately
- [ ] Error handling works correctly
- [ ] Configuration can be modified
- [ ] Works in target environment (browser/Node.js/mobile)

### Azure Resource Testing

- Test with Speech Services resource
- Test with Microsoft Foundry resource (if applicable)
- Verify in at least one supported region
- Test with both API key and Entra ID authentication

## Community Guidelines

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Share knowledge generously
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes (for significant contributions)
- Acknowledged in documentation (for documentation improvements)

## Questions?

- Open a [Discussion](https://github.com/DrHazemAli/foundry-live-agents/discussions)
- Check existing [Issues](https://github.com/DrHazemAli/foundry-live-agents/issues)
- Review [Documentation](docs/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make voice agent development accessible to everyone! 🎙️
