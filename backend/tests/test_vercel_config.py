"""Regression tests for /app/vercel.json bug fix.

User reported that Vercel build failed because vercel.json contained a
`rootDirectory` property (which Vercel's schema rejects). This test suite
verifies the fix is in place.
"""
import json
import os
import pytest

VERCEL_JSON_PATH = "/app/vercel.json"
FRONTEND_PACKAGE_JSON = "/app/frontend/package.json"


@pytest.fixture(scope="module")
def vercel_config():
    """Load and parse /app/vercel.json once for the module."""
    assert os.path.isfile(VERCEL_JSON_PATH), (
        f"vercel.json must live at repo root: {VERCEL_JSON_PATH}"
    )
    # Ensure it is NOT inside frontend/
    assert not os.path.isfile("/app/frontend/vercel.json"), (
        "vercel.json should NOT be inside /app/frontend/"
    )
    with open(VERCEL_JSON_PATH, "r", encoding="utf-8") as f:
        raw = f.read()
    # JSON validity check (no trailing commas, no comments allowed in strict JSON)
    return json.loads(raw), raw


class TestVercelConfigBugFix:
    """Bug-fix regression checks for vercel.json rootDirectory removal."""

    def test_vercel_json_is_valid_json(self, vercel_config):
        cfg, raw = vercel_config
        assert isinstance(cfg, dict), "vercel.json must parse to an object"
        # Reject JS-style line/block comments (ignoring `//` inside URL strings).
        # Strip out anything between double quotes, then look for // or /*.
        import re
        stripped = re.sub(r'"(?:[^"\\]|\\.)*"', '""', raw)
        assert "//" not in stripped, "No JS-style line comments allowed in vercel.json"
        assert "/*" not in stripped, "No JS-style block comments allowed in vercel.json"
        # Trailing-comma smell check
        assert not re.search(r",\s*[}\]]", stripped), "Trailing comma found in vercel.json"

    def test_root_directory_is_absent(self, vercel_config):
        """The bug fix: `rootDirectory` must NOT appear anywhere top-level."""
        cfg, raw = vercel_config
        assert "rootDirectory" not in cfg, (
            "rootDirectory is a Vercel dashboard-only property and breaks the schema"
        )
        # Also assert it does not appear textually anywhere in the file
        assert "rootDirectory" not in raw, (
            "rootDirectory string should not appear in vercel.json at all"
        )

    def test_framework_preserved(self, vercel_config):
        cfg, _ = vercel_config
        assert cfg.get("framework") == "create-react-app"

    def test_install_command_scopes_into_frontend(self, vercel_config):
        cfg, _ = vercel_config
        install_cmd = cfg.get("installCommand", "")
        assert install_cmd, "installCommand must be defined"
        assert "cd frontend" in install_cmd, (
            f"installCommand must cd into frontend/, got: {install_cmd!r}"
        )
        assert "yarn install" in install_cmd, (
            f"installCommand must run yarn install, got: {install_cmd!r}"
        )

    def test_build_command_scopes_into_frontend(self, vercel_config):
        cfg, _ = vercel_config
        build_cmd = cfg.get("buildCommand", "")
        assert build_cmd, "buildCommand must be defined"
        assert "cd frontend" in build_cmd, (
            f"buildCommand must cd into frontend/, got: {build_cmd!r}"
        )
        assert "yarn build" in build_cmd, (
            f"buildCommand must run yarn build, got: {build_cmd!r}"
        )

    def test_output_directory_points_to_frontend_build(self, vercel_config):
        cfg, _ = vercel_config
        assert cfg.get("outputDirectory") == "frontend/build", (
            f"outputDirectory must be 'frontend/build', got: {cfg.get('outputDirectory')!r}"
        )

    def test_github_silent_preserved(self, vercel_config):
        cfg, _ = vercel_config
        gh = cfg.get("github", {})
        assert isinstance(gh, dict) and gh.get("silent") is True, (
            "github.silent should be preserved as True"
        )

    def test_immutable_cache_header_preserved(self, vercel_config):
        cfg, _ = vercel_config
        headers = cfg.get("headers", [])
        assert isinstance(headers, list) and len(headers) >= 1, (
            "headers[] rule must be preserved"
        )
        # Find the /static/(.*) rule
        static_rule = next(
            (h for h in headers if h.get("source") == "/static/(.*)"), None
        )
        assert static_rule is not None, "Static asset header rule missing"
        keyvals = {h["key"]: h["value"] for h in static_rule.get("headers", [])}
        assert "Cache-Control" in keyvals, "Cache-Control header missing"
        cc = keyvals["Cache-Control"]
        assert "immutable" in cc and "max-age=31536000" in cc, (
            f"Cache-Control must remain immutable + 1yr max-age, got: {cc!r}"
        )

    def test_frontend_build_script_intact(self):
        """Sanity: the build chain referenced by buildCommand actually exists."""
        with open(FRONTEND_PACKAGE_JSON, "r", encoding="utf-8") as f:
            pkg = json.load(f)
        assert pkg.get("scripts", {}).get("build") == "craco build", (
            "frontend/package.json must still define a 'build' script (craco build)"
        )
