# Running the site from GitHub

The site publishes itself. Change something, commit it, and the live site
updates a couple of minutes later — no cPanel, no File Manager, no uploading
files by hand.

This page covers the one-time setup and then the everyday loop.

---

## One-time setup

You need to do this once, in the browser. It takes about five minutes.

### 1. Get the FTP details from Hostinger

In hPanel: **Files → FTP Accounts**. You want three values:

| Value | Looks like | Notes |
| --- | --- | --- |
| FTP hostname | `ftp.yourdomain.com` or an IP | Shown under "FTP details" |
| FTP username | `u123456789.yourdomain` | Not your hPanel login |
| FTP password | — | Set or reset it here if you don't know it |

If you have never set an FTP password, use **Change account password** on that
screen. The password you set is the one GitHub will use.

### 2. Put them into GitHub as secrets

Go to the repository → **Settings → Secrets and variables → Actions →
Secrets tab → New repository secret**, and add three:

| Secret name | Value |
| --- | --- |
| `HOSTINGER_FTP_HOST` | the hostname from above |
| `HOSTINGER_FTP_USER` | the FTP username |
| `HOSTINGER_FTP_PASSWORD` | the FTP password |

**Do not put these in a file, a commit, or a chat message.** GitHub encrypts
secrets, hides them from logs, and does not show them again after you save
them. That is the whole point: the deploy can use the password without anyone
having to keep a copy of it lying around.

### 3. Set two variables

Same screen, **Variables tab** this time (variables are not secret — these are
just settings):

| Variable name | Value | Default if unset |
| --- | --- | --- |
| `SITE_URL` | `https://yourdomain.com` — no trailing slash | `https://adpro.com.bd` |
| `HOSTINGER_REMOTE_DIR` | usually `public_html` | `public_html` |

`SITE_URL` matters more than it looks. It is what goes into every canonical
tag, every Open Graph tag and every URL in the sitemap. Point it at the wrong
domain and search engines are told the wrong address for all 105 pages.

> **Which directory?** On Hostinger, a single-site account serves from
> `public_html`. If the domain is an *addon* domain the path is usually
> `public_html/yourdomain.com` — check **Files → File Manager** and use
> whichever folder currently holds the site.

### 4. Run the first deploy

Repository → **Actions → Deploy to Hostinger → Run workflow**.

The first run uploads everything **without deleting anything**, and leaves a
small marker file behind. From the second run onwards it also removes files
the build no longer produces, so old pages cannot linger.

That ordering is deliberate. If the remote directory turns out to be the wrong
one, the worst outcome of a first run is some extra files — not a wiped site.

---

## The everyday loop

After setup, publishing is: **commit → wait ~2 minutes → it's live.**

Every deploy is logged under **Actions**, so you can always see what went out
and when. If a run fails, nothing is uploaded and the live site is untouched.

### What to edit, and where

Everything on the site comes from a handful of files. You never edit HTML.

| To change… | Edit | Notes |
| --- | --- | --- |
| Phone, email, addresses, company name | `src/data/site.ts` | One place; it updates every page, the footer, and the structured data |
| A billboard — size, facing, hours, city | `src/data/boards.json` | The listing page, the city page, the sitemap and the schema all follow |
| Add or remove a billboard | `src/data/boards.json` | A new entry creates its own page and links automatically |
| A billboard photograph | `public/boards/<slug>.jpg` | Keep the filename; 3:2 crop with the screen centred |
| The FAQ answers | `src/data/faq.ts` | Each entry becomes its own page |
| A news article | `src/data/articles.ts` | Copy an existing entry as a template |
| Client list | `src/data/site.ts` → `clients` | |
| Colours and type | `src/styles/tokens.css` | |

Add a billboard to `boards.json` and you get, without touching anything else:
its own page, a card on the inventory grid, an entry on its city page, a slot
in the sitemap, `Place` structured data, four generated FAQ answers, and links
to and from the nearest other sites.

### Checking before it goes out

Every deploy runs the build first and refuses to upload if:

- fewer than 100 pages built
- the stylesheet is missing
- fewer than 58 site photographs are present
- `.htaccess` or `sitemap.xml` is missing
- the canonical URL does not match `SITE_URL`
- **any published rate appears in the HTML** — this one is a commercial
  guard, not a cosmetic one

A broken build fails the job and the live site stays exactly as it was.

---

## Two hosts, one source

The repository publishes to two places, from the same `main` branch:

| Workflow | Publishes to | Purpose |
| --- | --- | --- |
| `deploy.yml` | GitHub Pages, at `/ad-pro/` | Preview — safe to break |
| `deploy-hostinger.yml` | Your domain, at `/` | The live site |

They build the same source with a different base path and a different
`SITE_URL`, so canonical URLs are correct on each. Keeping the preview means
there is somewhere to look at a change that is not the live site.

---

## When something goes wrong

**The deploy failed.** Open the run under Actions; the failing step says what
it found. Nothing was uploaded.

**It succeeded but the site looks unchanged.** Hard-refresh. HTML is set to
revalidate on every request, but a browser that already has the page may need
one reload. If it persists, check `HOSTINGER_REMOTE_DIR` — the files may have
gone to a directory the domain does not serve from.

**Images or CSS 404 on the live site but work on the preview.** The build went
out with the wrong base path. The Hostinger workflow sets `BASE_PATH=/`; the
Pages one sets `/ad-pro/`. Confirm the right workflow ran.

**"No ownership marker" warning.** Expected on the first run. If you see it on
later runs, the marker is not surviving — usually a sign the upload directory
is not the one being served.

**A rate appeared and the deploy blocked.** Working as intended. Screen time is
quoted per site; find the number in the diff and take it out.

---

## What is not automated, and why

**Rates.** Deliberately absent from the site and enforced by the deploy check.

**Photographs.** Adding a new billboard photograph is a file drop into
`public/boards/`, but cropping it so the screen sits in the centre of the
frame is a judgement call, not a rule.

**DNS and SSL.** These live in Hostinger and change once. The deploy checks
that the domain answers after uploading, so if the certificate expires you
will see it in the run log rather than from a customer.
