# Environment files and source exports

Local `.env` files are untracked. Copy `.env.example` for development and
configure production builds through the EAS production profile or EAS settings.
`EXPO_PUBLIC_*` variables are visible in the installed application; never use
them for server credentials.

The environment file previously tracked in this repository was removed from
all published branch and tag history on 18 November 2026. The audit found only
a public API endpoint in that file, with no private credentials to rotate.
Historical scans also checked for known credential formats and configured
backend secret values. No confirmed private credential exposure was found.

History was rewritten. Collaborators must use a fresh clone, or explicitly
rebase their work onto the rewritten history. Do not merge or push old history.
Commit hashes stored in older release records refer to the pre-cleanup history.

For Hashlist or other source datasets, use `git archive HEAD` rather than copying
the working directory or `.git` directory. The archive excludes all environment
files through `.gitattributes`. Do not submit local `.env` files, build artifacts,
credential stores, Git objects, local audit reports, or historical archives.
An already uploaded dataset must be replaced or removed through its owner.
