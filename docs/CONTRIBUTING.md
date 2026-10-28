# Contributing Guide

Welcome! This guide will help you contribute to the HMDA/CRA Compliance Tool.

## 🚀 Quick Start

### Making Changes (The Easy Way)

1. **Create a new branch** from `main`
   - Name it something descriptive like `fix-upload-button` or `add-export-feature`

2. **Make your changes**
   - Use AI assistance to help write code
   - Don't worry about formatting - it's automatic!

3. **Create a Pull Request**
   - Go to GitHub and click "Compare & pull request"
   - Fill out the simple template
   - Submit!

4. **Automated checks run**
   - If something fails, AI can help you fix it
   - Code formatting is applied automatically

5. **Merge when ready**
   - Once checks pass, merge to `main`
   - Your changes deploy automatically! 🎉

---

## 📝 Writing Good Commit Messages

We use simple commit messages. Here are some examples:

| Good ✅ | Why |
|---------|-----|
| `fix: upload button not working` | Clear what was fixed |
| `feat: add CSV export option` | Clear what was added |
| `docs: update README` | Clear what changed |

| Not Great ❌ | Better Version |
|--------------|----------------|
| `fixed stuff` | `fix: file parser error on empty rows` |
| `updates` | `feat: add progress indicator` |
| `changes` | `refactor: simplify ETL logic` |

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation change
- `style:` - Formatting only (no code change)
- `refactor:` - Code change that doesn't add features or fix bugs
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 🧪 Testing Your Changes

### Before Submitting

1. **Test locally** - Make sure your changes work
   ```bash
   npm run dev
   ```

2. **Run tests** (optional - CI will do this too)
   ```bash
   npm test
   ```

### The automated checks will:
- ✅ Check for TypeScript errors
- ✅ Check code style (and auto-fix!)
- ✅ Run all tests
- ✅ Verify the build works

---

## 🐛 Reporting Bugs

1. Go to [Issues](../../issues)
2. Click "New Issue"
3. Choose "🐛 Bug Report"
4. Fill out the form - it guides you!

---

## ✨ Suggesting Features

1. Go to [Issues](../../issues)
2. Click "New Issue"
3. Choose "✨ Feature Request"
4. Describe your idea!

---

## ❓ Questions?

- Check the [User Manual](../client/public/USER_MANUAL.md)
- Open a [Discussion](../../discussions)
- Ask your AI assistant for help!

---

## 📚 More Details (For Technical Users)

<details>
<summary>Click to expand technical details</summary>

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/gabbyignacio7/hmda-cra-compliance-etl.git
cd hmda-cra-compliance-etl

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |
| `npm run format` | Format code |
| `npm run build` | Build for production |

### Project Structure

```
client/src/
├── components/    # UI components
├── hooks/         # React hooks
├── lib/
│   └── etl/       # ETL processing (core logic)
├── pages/         # Page components
└── __tests__/     # Tests
```

### ETL Code Guidelines

When modifying ETL code (`client/src/lib/etl/`):

1. **Test with real files** if possible
2. **Don't break existing mappings** - add, don't remove
3. **Handle edge cases** - empty rows, missing fields, special characters
4. **Verify CRA Wiz format** - output must be 128-column compatible

</details>

---

Thank you for contributing! 🙏
