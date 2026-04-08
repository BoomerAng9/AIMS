---
id: "github-mcp"
name: "GitHub MCP"
type: "tool"
category: "workflow"
provider: "GitHub"
description: "GitHub repository management via MCP — issues, PRs, commits, code search, releases. Primary source control and collaboration layer for AIMS development."
env_vars:
  - "GITHUB_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (GitHub)"
owner: "Patchsmith_Ang"
secondary_owners: ["Buildsmith", "Runner_Ang"]
---

# GitHub MCP — A.I.M.S. Source Control & Collaboration

## Overview

GitHub MCP gives ACHEEVY and the chain of command full access to repositories,
issues, pull requests, code search, and release management. This is the primary
source control and CI/CD trigger layer for A.I.M.S. development operations.

**Owner:** Patchsmith_Ang (Code Quality & Patches)
**Secondary Owners:** Buildsmith (Builds), Runner_Ang (Execution)
**MCP Transport:** Claude Code Connector (OAuth-authenticated)

## Capabilities

### Repository Operations
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List repos** | `github_list_repos` | List organization/user repositories |
| **Get repo** | `github_get_repo` | Repo metadata (stars, forks, language, last push) |
| **Search code** | `github_search_code` | Full-text code search across repos |
| **Get file** | `github_get_file_contents` | Read file content at a path/ref |
| **Create/update file** | `github_create_or_update_file` | Commit file changes directly |

### Issues & PRs
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List issues** | `github_list_issues` | List issues with filters (state, labels, assignee) |
| **Create issue** | `github_create_issue` | Open a new issue with labels and assignees |
| **Update issue** | `github_update_issue` | Edit title, body, state, labels |
| **List PRs** | `github_list_pull_requests` | List pull requests with filters |
| **Create PR** | `github_create_pull_request` | Open a PR from branch to base |
| **Get PR** | `github_get_pull_request` | PR details, diff, review status |
| **Merge PR** | `github_merge_pull_request` | Merge a reviewed PR |

### Branches & Commits
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List branches** | `github_list_branches` | All branches in a repo |
| **Create branch** | `github_create_branch` | Create branch from ref |
| **List commits** | `github_list_commits` | Commit history with filters |
| **Get commit** | `github_get_commit` | Commit details and diff |

### Releases & Actions
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List releases** | `github_list_releases` | Published releases |
| **Create release** | `github_create_release` | Tag and publish a release |
| **List workflow runs** | `github_list_workflow_runs` | CI/CD run status |

## How Each Actor Uses GitHub

### ACHEEVY (Orchestrator)
- Check build status before reporting deployment results to user
- Create issues from user feature requests
- Monitor PR review status for active projects
- **Can do:** Read repos, create issues, check CI status
- **Cannot do:** Merge PRs or push code without Boomer_Ang validation

### Boomer_Angs (Managers)
| Ang | GitHub Usage |
|-----|-------------|
| **Patchsmith_Ang** | Review PRs, manage branches, enforce code quality, merge approved PRs |
| **Buildsmith** | Trigger builds, create releases, monitor CI/CD pipelines |
| **Runner_Ang** | Execute deployment workflows, check action run status |
| **Gatekeeper_Ang** | Security scans on PRs, dependency audit, license checks |
| **Scout_Ang** | Search code across repos for research and analysis |

### Chicken Hawk (Coordinator)
- Create feature branches for assigned tasks
- Open PRs after Lil_Hawks complete code changes
- Attach PR links as evidence in job packets
- Cannot merge PRs (Boomer_Ang-only)

### Lil_Hawks (Workers)
- Read code files for assigned tasks
- Commit changes to feature branches
- Cannot create PRs, merge, or manage branches directly

## A.I.M.S. Repositories (Primary)

| Repo | Purpose | Owner |
|------|---------|-------|
| `BoomerAng9/AIMS` | Monorepo — frontend, backend, infra, skills | Buildsmith |
| `BoomerAng9/ii-agent` | II-Agent runtime | Buildsmith |
| `BoomerAng9/ii-researcher` | Research agent | Scout_Ang |

## FDH Pipeline Integration

GitHub MCP is critical to the Factory Controller loop:

```
1. WATCH  → Monitor repo events (pushes, PRs, issues)
2. DETECT → New push to main = potential FDH trigger
3. PLAN   → Generate manifest based on changed files
4. EXECUTE → Buildsmith creates branch, Lil_Hawks write code
5. VERIFY  → Patchsmith_Ang reviews PR, Gatekeeper_Ang scans
6. DELIVER → Merge PR, create release, trigger deploy
```

## Security Rules

- OAuth tokens managed by Claude Code Connector — never exposed to agents
- All GitHub operations flow through Port Authority
- PR merges require Patchsmith_Ang approval (HITL gate)
- Force pushes to main/master are FORBIDDEN
- Branch deletion requires Boomer_Ang authorization
- All operations are audit-logged
