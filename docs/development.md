# Enterprise Development Guidelines

## 1. Prerequisites

Before setting up the project locally or on an enterprise laptop, verify that the following runtime environments are installed:

- **Node.js**: v20.10.0 LTS or later (v24 LTS supported)
- **Package Manager**: npm v10+
- **Version Control**: Git 2.40+ with SSH key configured for GitHub
- **Supabase CLI**: Required for local PostgreSQL and pgvector database migrations
- **Docker Desktop / Podman**: Required if running local Supabase emulator

---

## 2. Initial Setup and Configuration

### Step 1: Clone the Repository
```bash
git clone git@github.com:mohammadali-2000/twinops-enterprise.git
cd twinops-enterprise
```

### Step 2: Install Dependencies
Install exact pinned dependencies using `npm ci`:
```bash
npm ci
```
*(If developing with updated dependency locks, run `npm install`)*

### Step 3: Configure Environment Variables
Copy the sanitized environment template to create your local environment:
```bash
cp .env.example .env.local
```

Open `.env.local` and populate the required credentials:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Refer to `.env.example` and `docs/security.md` for secret management rules. Never commit `.env.local` or any file containing active tokens.

---

## 3. Database Migration and Schema Setup

The project uses Supabase PostgreSQL with `pgvector` extensions for embeddings and vector similarity search.

### Local Development via Supabase CLI
```bash
# Initialize local Supabase instance
npx supabase start

# Apply database migrations
npx supabase db push

# (Optional) Seed initial metadata for system agents
npx supabase db reset
```

The database schema and migrations are located in:
- `supabase/migrations/20260925000000_init_schema.sql`
- `supabase/seed.sql`

---

## 4. Running the Development Environment

Start the Next.js development server:
```bash
npm run dev
```

The application will be accessible at:
- Web Application: `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied)
- API Health Check: `http://localhost:3000/api/health`

---

## 5. Quality Assurance and Verification

All code submitted to the repository must pass four gates before being merged:

### Gate 1: Unit & Integration Tests
The project uses the Node.js native test runner via `tsx`:
```bash
npm test
```
All unit tests in `tests/*.test.mjs` must execute and pass.

### Gate 2: Type Checking
Run strict TypeScript static analysis:
```bash
npx tsc --noEmit
```
There must be 0 compilation errors. Do not suppress errors with `@ts-ignore` without documented justification.

### Gate 3: Linting
Run ESLint to check for stylistic and safety violations:
```bash
npm run lint
```
Code must pass with 0 errors.

### Gate 4: Production Build
Verify that Next.js produces an optimized production bundle:
```bash
npm run build
```

---

## 6. Git Branching and Commit Standards

### Branching Strategy
- `main`: Protected production branch. Direct pushes are disabled.
- `staging`: Pre-production validation and integration branch.
- Feature branches: `feat/ticket-id-short-description` (e.g., `feat/TO-102-teams-oauth`)
- Bugfix branches: `fix/ticket-id-short-description` (e.g., `fix/TO-205-memory-leak`)
- Refactoring branches: `refactor/short-description`

### Commit Message Conventions
Follow the Conventional Commits specification:
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

#### Types:
- `feat`: New customer-facing or system functionality
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `security`: Security patches, secret hygiene, authorization controls
- `ci`: Changes to CI/CD workflows and scripts
- `docs`: Documentation changes only
- `chore`: Routine maintenance, dependency updates

#### Examples:
- `feat(integrations): add microsoft teams adaptive card dispatcher`
- `fix(memory): resolve null pointer when unconfigured database returns empty set`
- `security(agent): enforce immutable delimiters on retrieved external content`

---

## 7. Pull Request Protocol

1. **Title**: Must follow Conventional Commits format.
2. **Description**:
   - Problem statement
   - Summary of changes
   - Testing verification performed (command output)
   - Impact on external integrations or security boundaries
3. **Automated Checks**: PR cannot be merged until all GitHub Actions workflows pass.
4. **Code Review**: Requires at least one review approval from an authorized code owner.
