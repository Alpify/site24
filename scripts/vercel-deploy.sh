#!/usr/bin/env bash
# Vercel: Production-Deploy aus Git nachziehen / Status prüfen.
#
# Optional (API):
#   export VERCEL_TOKEN=…           # https://vercel.com/account/tokens — niemals ins Repo committen
#   export VERCEL_PROJECT_ID=prj_…  # Project → Settings → General
#   export VERCEL_TEAM_ID=team_…    # nur bei Team (aus Vercel-URL / Team-Settings)
#   export VERCEL_GITHUB_REPO_ID=… # optional; für Alpify/site24 standardmäßig 1238950782 (ohne api.github.com)
#   ./scripts/vercel-deploy.sh trigger
#   ./scripts/vercel-deploy.sh trigger --sha <vollständiger-sha>
#   ./scripts/vercel-deploy.sh status
#
# Ohne Token: nur manuelle Checkliste.

set -euo pipefail

REPO_SLUG="${GITHUB_REPO:-Alpify/site24}"
GIT_REF="${GIT_REF:-main}"
# Numerische Repo-ID (api.github.com/repos/Alpify/site24 → id), damit trigger ohne GitHub-Request läuft.
if [[ "${REPO_SLUG}" == "Alpify/site24" ]]; then
  if [[ -z "${VERCEL_GITHUB_REPO_ID:-}" || ! "${VERCEL_GITHUB_REPO_ID}" =~ ^[0-9]+$ ]]; then
    if [[ -n "${VERCEL_GITHUB_REPO_ID:-}" ]]; then
      echo "Hinweis: VERCEL_GITHUB_REPO_ID ist keine reine Zahl («${VERCEL_GITHUB_REPO_ID}») — verwende 1238950782 für Alpify/site24." >&2
    fi
    VERCEL_GITHUB_REPO_ID=1238950782
  fi
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Platzhalter aus Doku-Kommentaren (z. B. team_…) führen zu leeren API-Ergebnissen — Team-ID dann weglassen.
sanitize_vercel_team_id() {
  if [[ -z "${VERCEL_TEAM_ID:-}" ]]; then
    return
  fi
  if [[ "${VERCEL_TEAM_ID}" == *"…"* ]] || [[ "${VERCEL_TEAM_ID}" == "team_…"* ]]; then
    echo "Hinweis: VERCEL_TEAM_ID sieht nach Platzhalter aus — wird ignoriert. Nur setzen, wenn die echte team_-ID aus der Vercel-URL gemeint ist." >&2
    VERCEL_TEAM_ID=""
  fi
}

print_manual() {
  cat <<'EOF'

── Manuell im Vercel-Dashboard ──

0) Root Directory (bei Fehler „apps/app does not exist“)
   • Project → Settings → General → Root Directory
   • Für dieses Repo (Next.js im Repo-Root): Feld leer lassen oder „.“ setzen — nicht „apps/app“.
   • Speichern, dann neu deployen.

1) Deploy auslösen
   • Deployments → „Create Deployment“
   • Branch/Commit: main  oder  vollständige Commit-SHA
   • Target: Production → Deploy
   • Bei Bedarf: „Clear cache and redeploy“

2) Abbruch prüfen
   • Deployment „Canceled“ öffnen → Logs / Events (z. B. „Canceled through API“)

3) Live-Version prüfen
   • Letztes „Ready“-Deployment: Commit mit GitHub main vergleichen
   • Production-URL im privaten Fenster / Hard-Reload testen

EOF
}

github_repo_id() {
  if [[ -n "${VERCEL_GITHUB_REPO_ID:-}" ]]; then
    echo "${VERCEL_GITHUB_REPO_ID}"
    return
  fi
  python3 -c "import json,urllib.request;u=urllib.request.urlopen('https://api.github.com/repos/${REPO_SLUG}');print(json.load(u)['id'])"
}

cmd_trigger() {
  local sha=""
  if [[ "${1:-}" == "--sha" && -n "${2:-}" ]]; then
    sha="$2"
  fi

  if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
    echo "Hinweis: VERCEL_TOKEN und VERCEL_PROJECT_ID nicht gesetzt."
    print_manual
    exit 0
  fi

  echo "→ GitHub repo id für ${REPO_SLUG} …"
  local rid
  rid="$(github_repo_id)"
  rid="${rid//$'\r'/}"
  rid="${rid//$'\n'/}"
  if ! [[ "$rid" =~ ^[0-9]+$ ]]; then
    echo "Fehler: GitHub-Repo-ID ist keine Zahl (erhalten: «${rid}»). VERCEL_GITHUB_REPO_ID setzen (nur Ziffern)." >&2
    exit 1
  fi

  sanitize_vercel_team_id

  local url
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    url="https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}"
  else
    url="https://api.vercel.com/v13/deployments"
  fi

  local body
  export RID="${rid}"
  export PID="${VERCEL_PROJECT_ID}"
  export REF="${GIT_REF}"
  if [[ -n "$sha" ]]; then
    export SHA="${sha}"
    body="$(python3 - <<'PY'
import json, os
rid = int(os.environ["RID"])
pid = os.environ["PID"]
ref = os.environ["REF"]
sha = os.environ["SHA"]
print(
    json.dumps(
        {
            "project": pid,
            "target": "production",
            "gitSource": {"type": "github", "repoId": rid, "ref": ref, "sha": sha},
        }
    )
)
PY
)"
    unset SHA
  else
    body="$(python3 - <<'PY'
import json, os
rid = int(os.environ["RID"])
pid = os.environ["PID"]
ref = os.environ["REF"]
print(
    json.dumps(
        {
            "project": pid,
            "target": "production",
            "gitSource": {"type": "github", "repoId": rid, "ref": ref},
        }
    )
)
PY
)"
  fi
  unset RID PID REF

  echo "→ POST ${url}"
  local resp
  resp="$(curl -sS -X POST -H "Authorization: Bearer ${VERCEL_TOKEN}" -H "Content-Type: application/json" -d "$body" "$url")"
  echo "$resp" | python3 -m json.tool 2>/dev/null || echo "$resp"
  echo ""
  echo "Fertig. Im Dashboard „Deployments“ prüfen, bis Status „Ready“ ist."
}

cmd_status() {
  if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
    echo "Hinweis: VERCEL_TOKEN und VERCEL_PROJECT_ID nicht gesetzt."
    print_manual
    exit 0
  fi

  sanitize_vercel_team_id

  local url
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    url="https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=8&teamId=${VERCEL_TEAM_ID}"
  else
    url="https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=8"
  fi

  echo "→ GET ${url}"
  local resp
  resp="$(curl -sS -H "Authorization: Bearer ${VERCEL_TOKEN}" "$url")"
  GIT_REF="${GIT_REF:-main}"
  export GIT_REF
  echo "$resp" | python3 -c "
import json, sys, os, subprocess

def dep_sha(x):
    s = (x.get('meta') or {}).get('githubCommitSha') or (x.get('gitSource') or {}).get('sha')
    return str(s) if s else '?'

def dep_state(x):
    return str(x.get('readyState') or x.get('state') or '?')

def dep_id(x):
    return str(x.get('uid') or x.get('id') or '?')

raw = sys.stdin.read()
try:
    d = json.loads(raw)
except json.JSONDecodeError:
    print('Keine gültige JSON-Antwort (Netzwerk/Token?). Erste 400 Zeichen:')
    print(raw[:400])
    sys.exit(1)
deps = d.get('deployments') or []
if not deps:
    err = d.get('error') or d.get('message')
    if err:
        print('API:', err)
    else:
        print('Keine Deployments in der Antwort (projectId/Team prüfen).')
    print('(Roh-Antwort, gekürzt):', raw[:500])
else:
    for x in deps:
        s = dep_sha(x)
        state = dep_state(x)
        uid = dep_id(x)
        created = x.get('createdAt') or ''
        print(f'{state:12}  {s[:12]}…  {created}  {uid}')

    newest = deps[0]
    first_ready = next(
        (x for x in deps if dep_state(x).upper() == 'READY'),
        None,
    )
    ref = os.environ.get('GIT_REF', 'main')
    print()
    print('── Kurzfassung ──')
    print(
        f'Neuester Listeneintrag: {dep_state(newest)}  ({dep_sha(newest)[:12]}…)  {dep_id(newest)}'
    )
    if first_ready:
        frs = dep_sha(first_ready)
        print(
            f'Neuester READY:         READY  ({frs[:12]}…)  {dep_id(first_ready)}'
        )
        if dep_state(newest).upper() != 'READY':
            print(
                'Hinweis: Oben steht ein neuerer, nicht-READY-Versuch; Production kann weiter '
                'vom neuesten READY bedient werden — SHA mit GitHub vergleichen.'
            )
    local_sha = None
    try:
        local_sha = subprocess.check_output(
            ['git', 'rev-parse', f'origin/{ref}'],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=8,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    if local_sha and first_ready:
        frs = dep_sha(first_ready)
        if frs != '?' and len(frs) >= 7:
            match = local_sha == frs or local_sha.startswith(frs[:7]) or frs.startswith(local_sha[:7])
            if match:
                print(f'origin/{ref} (lokal): {local_sha[:7]}… — entspricht dem neuesten READY-Deploy.')
            else:
                print(
                    f'origin/{ref} (lokal): {local_sha[:7]}… — weicht vom neuesten READY-Deploy '
                    f'({frs[:7]}…) ab; ggf. push/trigger oder warten.'
                )
    elif local_sha:
        print(f'origin/{ref} (lokal): {local_sha[:7]}… (kein READY in der Liste — selten).')
    print()
    print(
        'Erwartung: neuester READY-Eintrag zeigt den Commit, der typischerweise Production trägt; '
        'der allerneueste Eintrag soll nach erfolgreichem Deploy ebenfalls READY sein.'
    )
"
}

cmd_help() {
  echo "Usage: $0 trigger [--sha FULL_SHA] | status | help"
  print_manual
}

main() {
  case "${1:-help}" in
    trigger) shift || true; cmd_trigger "$@" ;;
    status) cmd_status ;;
    help|--help|-h) cmd_help ;;
    *)
      echo "Unbekanntes Kommando: $1"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
