#!/usr/bin/env bash
# ============================================================
#  Publica el build actual en la rama gh-pages (demo del celular)
# ============================================================
# El sitio de GitHub Pages NO se actualiza solo: es una rama aparte que hay
# que reescribir con el build nuevo cada vez que se cambia el código.
# Si se olvida, el celular sigue viendo la versión vieja (pasó 2026-09-23:
# la demo quedó 2 h atrás y el arreglo del carrito no llegaba al teléfono).
#
#   bash scripts/publicar-pages.sh
#
# Requisitos: git con credenciales para hacer push, npm instalado.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

echo "1/5  Build de producción"
npm run build

# Ruta estilo Windows (C:/Users/...): a git le llega una ruta MSYS (/c/Users/...)
# y crearía C:\c\Users\... — el mismo problema que con los scripts de captura.
HOGAR="$(cd "$HOME" && pwd | sed -E 's#^/([a-zA-Z])/#\1:/#')"
WT="$HOGAR/tmp-ghp-pages"

echo "2/5  Preparando la rama gh-pages en $WT"
rm -rf "$WT"
# Limpia worktrees viejos (incluidos los de una corrida interrumpida): si no,
# git se niega con "'gh-pages-pub' is already used by worktree at ...".
for ruta in $(git worktree list --porcelain | awk '/^worktree /{print $2}'); do
  case "$ruta" in
    *tmp-ghp*) git worktree remove --force "$ruta" >/dev/null 2>&1 || true ;;
  esac
done
git worktree prune
git fetch origin gh-pages --quiet
git worktree add -B gh-pages-pub "$WT" origin/gh-pages >/dev/null

echo "3/5  Copiando dist/ (se borra lo viejo, así no quedan bundles huérfanos)"
find "$WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r "$RAIZ/dist/." "$WT/"
touch "$WT/.nojekyll"

echo "4/5  Commit y push"
cd "$WT"
git add -A
if git diff --cached --quiet; then
  echo "     (sin cambios: gh-pages ya estaba al día)"
else
  git commit -q -m "demo" --author="valentinjurado <valentinjurado22@gmail.com>"
  git push origin gh-pages-pub:gh-pages
fi

cd "$RAIZ"
git worktree remove --force "$WT" >/dev/null 2>&1 || true

echo "5/5  Listo. Bundle que debe servir la demo en ~1 minuto:"
grep -o 'assets/index-[A-Za-z0-9_-]*\.js' dist/index.html
echo "     Comprobá:  curl -s https://valentinjurado.github.io/catalogo-whatsapp/?v=1 | grep -o 'assets/index-[A-Za-z0-9_-]*\\.js'"
