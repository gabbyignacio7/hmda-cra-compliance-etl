# 🚀 Professional GitHub Setup Guide

This guide walks you through activating all the professional features that have been set up.

---

## 📋 What's Included

| Feature               | File(s)                          | Purpose                      |
| --------------------- | -------------------------------- | ---------------------------- |
| ✅ Enhanced CI        | `.github/workflows/ci.yml`       | Lint, test, build checks     |
| ✅ Auto-deploy        | `.github/workflows/deploy.yml`   | Automatic deployments        |
| ✅ Auto-format        | `.github/workflows/auto-fix.yml` | Auto-fixes code style on PRs |
| ✅ Easy releases      | `.github/workflows/release.yml`  | One-click releases           |
| ✅ Better templates   | `.github/ISSUE_TEMPLATE/*.yml`   | Easy bug/feature forms       |
| ✅ Code ownership     | `.github/CODEOWNERS`             | Auto-assigns reviewers       |
| ✅ Dependency updates | `.github/dependabot.yml`         | Auto-updates packages        |
| ✅ Editor config      | `.editorconfig`                  | Consistent formatting        |
| ✅ Security policy    | `SECURITY.md`                    | How to report issues         |
| ✅ Contributing guide | `docs/CONTRIBUTING.md`           | How to contribute            |

---

## 📁 Data Directory Setup

The `data/` directory is gitignored and must be created locally. It holds client exports, compliance templates, test fixtures, and media assets.

```bash
# Create the directory structure
mkdir -p data/{exports/{october-2025,december-2025,january-2026},templates,test-fixtures,media/{tutorial-video,video-clips,audio,screenshots},reference/{prompts,sec-filings,deployment,source-backups},archives}
```

| Subdirectory          | Contents                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `data/exports/`       | Client HMDA/CRA export files organized by month (contains PII)   |
| `data/templates/`     | HMDA/CRA compliance templates, checksheets, and scrub procedures |
| `data/test-fixtures/` | Numbered test data files (01–08) for ETL pipeline testing        |
| `data/media/`         | Tutorial video, video clips, audio narration, screenshots        |
| `data/reference/`     | Original prompts, SEC filings, deployment docs, source backups   |
| `data/archives/`      | ZIP archives of original asset bundles                           |

The Learning Center media files are served from `client/public/assets/learning-center/` at runtime. Copy from `data/media/` to populate:

```bash
cp data/media/tutorial-video/Compliance_Automation_Revolution.mp4 client/public/assets/learning-center/Video_Clips/
# Audio and other video clips should already exist in client/public/assets/learning-center/
```

---

## 🎯 Getting Started

### Step 1: Set up GitHub labels (one-time)

```bash
# Make the script executable and run it
chmod +x scripts/setup-github-labels.sh
./scripts/setup-github-labels.sh
```

### Step 2: Set up branch protection (GitHub UI)

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Click **Add branch protection rule**
4. For "Branch name pattern", enter: `main`
5. Enable these settings:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Search and add: `✅ Code Quality`, `🧪 Tests`, `🏗️ Build`
   - ✅ Require conversation resolution before merging
6. Click **Create**

### Step 3: Create your first milestone

1. Go to **Issues** → **Milestones** → **New milestone**
2. Title: `v1.1.0`
3. Due date: (next week)
4. Description: "First release with professional workflow"
5. Click **Create milestone**

---

## 📊 How It All Works

```
You write code
      │
      ▼
Push to branch ─────► Auto-format fixes style
      │
      ▼
Create PR ──────────► Automated checks run
      │                 - TypeScript ✓
      │                 - Linting ✓
      │                 - Tests ✓
      │                 - Build ✓
      ▼
Merge to main ──────► Auto-deploy to GitHub Pages
      │
      ▼
Create Release ─────► Auto-generate changelog
                      Create GitHub release
```

---

## 🧪 Testing the Workflow

### Try creating a feature branch

1. Create a branch:

   ```bash
   git checkout -b add-something-cool
   ```

2. Make a small change and commit:

   ```bash
   git add .
   git commit -m "feat: add something cool"
   git push -u origin add-something-cool
   ```

3. Go to GitHub and create a Pull Request
4. Watch the automated checks run!
5. See the auto-formatter fix any style issues

### Try creating a release

1. Go to **Actions** → **📦 Create Release**
2. Click **Run workflow**
3. Select `patch` (for small changes)
4. Click **Run workflow**
5. Watch it automatically:
   - Bump the version number
   - Create release notes
   - Deploy to production!

---

## 🔧 Optional: Add Service Tokens

### Codecov (for coverage reports)

1. Go to [codecov.io](https://codecov.io) and sign in with GitHub
2. Add your repository
3. Copy the token
4. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
5. Click **New repository secret**
6. Name: `CODECOV_TOKEN`
7. Value: (paste the token)

---

## ❓ Troubleshooting

### "Checks are failing"

- Look at the failed check for details
- Ask AI to help fix the issue
- The auto-formatter often fixes style issues automatically

### "Can't push to main"

- This is intentional! Create a branch and PR instead
- This protects production from accidental changes

### "Dependabot PRs keep appearing"

- This is normal - it's keeping your packages up to date
- Review and merge them weekly
- If tests pass, they're usually safe to merge

---

## 🎉 What You Get

- ✅ Automated testing and quality checks
- ✅ Automatic code formatting on PRs
- ✅ Protected main branch (optional)
- ✅ Easy issue and PR templates
- ✅ Automatic dependency updates
- ✅ One-click releases with changelog
- ✅ Professional documentation

Questions? Ask your AI assistant! 🤖
