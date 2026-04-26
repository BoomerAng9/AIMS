# =============================================================================
# AIMS ii-agent extender — bakes II-Commons into the upstream image.
# =============================================================================
#
# Wave 1 Step H: ACHEEVY's ii-agent autonomous executor calls II-Commons for
# the shared knowledge / discovery surface (Intelligent-Internet's pip layer).
# The upstream image ships without it, so we layer a thin install on top.
#
# Why bake (not exec install): Wave 1 risk register flagged that
# `docker exec ii-agent pip install` is lost on container restart. Baking
# into a derived image guarantees the dep survives recreate / redeploy /
# host reboot.
#
# Build:
#   docker build \
#     --build-arg II_COMMONS_VERSION=latest \
#     -f infra/dockerfiles/ii-agent.Dockerfile \
#     -t aims-ii-agent:custom .
#
# Compose picks this up via the `build:` block in
# infra/docker-compose.ii-agent.yaml.
# =============================================================================

ARG II_AGENT_BASE=ghcr.io/intelligentinternet/ii-agent:latest
FROM ${II_AGENT_BASE}

# Pin the II-Commons version via build-arg so deploys are reproducible.
# Default `latest` keeps us on the moving target until the operator pins.
ARG II_COMMONS_VERSION=latest

USER root

RUN if [ "$II_COMMONS_VERSION" = "latest" ]; then \
      pip install --no-cache-dir ii-commons ; \
    else \
      pip install --no-cache-dir "ii-commons==${II_COMMONS_VERSION}" ; \
    fi \
 && python -c "import ii_commons; print('ii-commons:', getattr(ii_commons, '__version__', 'unknown'))"

# Reset to whatever USER the upstream image used (most ii-agent images run
# as root anyway; this is defensive in case the upstream tightens that).
