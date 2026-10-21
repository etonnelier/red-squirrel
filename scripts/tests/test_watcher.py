import shutil
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from watcher import GuidanceEventHandler, _anti_dilution_score, _harness_for, _is_guidance_file

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "md"


def count_lines(path: Path) -> int:
    """Nombre total de lignes, lignes vides comprises."""
    return len(path.read_text(encoding="utf-8").splitlines())


def count_non_blank(path: Path) -> int:
    """Nombre de lignes non vides (les lignes ne contenant que des espaces sont ignorées)."""
    lines = path.read_text(encoding="utf-8").splitlines()
    return sum(1 for line in lines if line.strip())


@pytest.fixture
def project(tmp_path: Path) -> Path:
    """Project root with CLAUDE.md and rules/style.md built from fixtures."""
    (tmp_path / "rules").mkdir()
    shutil.copy(FIXTURES / "CLAUDE_fixture1.md", tmp_path / "CLAUDE.md")
    shutil.copy(FIXTURES / "CLAUDE_fixture1.md", tmp_path / "rules" / "style.md")
    return tmp_path


def test_fixture_files_exist():
    for name in ("CLAUDE_fixture1.md", "CLAUDE_fixture2.md", "CLAUDE_fixture3.md"):
        assert (FIXTURES / name).is_file(), f"missing fixture {name}"


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("CLAUDE_fixture1.md", 17),
        ("CLAUDE_fixture2.md", 0),
        ("CLAUDE_fixture3.md", 434),
        ("CLAUDE_fixture4.md", 3),
    ],
)
def test_line_count_with_blank_lines(name: str, expected: int):
    fixture = FIXTURES / name
    n = count_lines(fixture)
    print(f"\n{fixture.name}: {n} lignes (avec lignes vides)")
    assert n == expected


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("CLAUDE_fixture1.md", 9),
        ("CLAUDE_fixture2.md", 0),
        ("CLAUDE_fixture3.md", 217),
        ("CLAUDE_fixture4.md", 3),
    ],
)
def test_line_count_without_blank_lines(name: str, expected: int):
    fixture = FIXTURES / name
    n = count_non_blank(fixture)
    print(f"\n{fixture.name}: {n} lignes (sans lignes vides)")
    assert n == expected


@pytest.mark.parametrize(
    ("name", "expected_total", "expected_non_blank"),
    [
        ("AGENTS_fixture1.md", 13, 9),
        ("AGENTS_fixture2.md", 13, 9),
        ("AGENTS_fixture3.md", 13, 9),
    ],
)
def test_agents_fixture_line_counts(name: str, expected_total: int, expected_non_blank: int):
    fixture = FIXTURES / name
    total = count_lines(fixture)
    non_blank = count_non_blank(fixture)
    print(f"\n{fixture.name}: {total} lignes ({non_blank} sans lignes vides)")
    assert total == expected_total
    assert non_blank == expected_non_blank


def referenced_files(claude_md: Path) -> list[Path]:
    """Fichiers référencés par les lignes `@chemin` d'un CLAUDE.md, résolus depuis son dossier."""
    lines = claude_md.read_text(encoding="utf-8").splitlines()
    return [claude_md.parent / line[1:].strip() for line in lines if line.startswith("@")]


def test_fixture4_referenced_files_line_count():
    refs = referenced_files(FIXTURES / "CLAUDE_fixture4.md")
    assert [p.name for p in refs] == [
        "AGENTS_fixture1.md",
        "AGENTS_fixture2.md",
        "AGENTS_fixture3.md",
    ]
    total = sum(count_lines(p) for p in refs)
    print(f"\nCLAUDE_fixture4.md -> {len(refs)} fichiers, {total} lignes (avec lignes vides)")
    assert total == 39


def test_fixture4_referenced_files_non_blank_count():
    refs = referenced_files(FIXTURES / "CLAUDE_fixture4.md")
    total = sum(count_non_blank(p) for p in refs)
    print(f"\nCLAUDE_fixture4.md -> {total} lignes (sans lignes vides)")
    assert total == 27


def test_all_blank_lines_are_not_counted(tmp_path: Path):
    f = tmp_path / "all_blank.md"
    f.write_text("\n   \n\t\n\n", encoding="utf-8")
    assert count_non_blank(f) == 0


def test_some_blank_lines_are_not_counted():
    fixture = FIXTURES / "CLAUDE_fixture1.md"
    lines = fixture.read_text(encoding="utf-8").splitlines()
    assert any(not line.strip() for line in lines)
    assert count_non_blank(fixture) == len(lines) - sum(1 for line in lines if not line.strip())


def test_no_blank_lines_are_all_counted(tmp_path: Path):
    f = tmp_path / "no_blank.md"
    f.write_text("a\nb\nc\n", encoding="utf-8")
    assert count_non_blank(f) == 3


def test_claude_md_is_guidance(project: Path):
    assert _is_guidance_file(str(project / "CLAUDE.md"))


def test_rules_md_is_guidance(project: Path):
    assert _is_guidance_file(str(project / "rules" / "style.md"))


def test_fixture_names_are_not_guidance():
    # Fixtures are named CLAUDE_fixtureN.md, not CLAUDE.md: must be ignored.
    for name in ("CLAUDE_fixture1.md", "CLAUDE_fixture2.md", "CLAUDE_fixture3.md"):
        assert not _is_guidance_file(str(FIXTURES / name)), name


def test_non_matching_files_are_not_guidance(project: Path):
    assert not _is_guidance_file(str(project / "rules" / "style.txt"))
    assert not _is_guidance_file(str(project / "notes.md"))
    assert not _is_guidance_file(str(project / "CLAUDE.md.bak"))
    assert not _is_guidance_file(str(project / "README.md"))


def test_harness_for_claude_md(project: Path):
    assert _harness_for(str(project / "CLAUDE.md")) == "antidilution"


def test_harness_for_rules_md(project: Path):
    assert _harness_for(str(project / "rules" / "style.md")) == "rule-coverage"


def test_harness_for_other_file_is_general(project: Path):
    assert _harness_for(str(project / "notes.md")) == "general"


@pytest.mark.parametrize(
    ("x", "expected"),
    [
        (0, 100.0),
        (100, 100.0),
        (101, 299 / 3),
        (250, 50.0),
        (399, 1 / 3),
        (400, 0.0),
        (500, 0.0),
    ],
)
def test_anti_dilution_score(x: int, expected: float):
    score = _anti_dilution_score(x)
    print(f"\nx = {x} lignes -> V = {score:.2f}%")
    assert score == pytest.approx(expected)


def test_anti_dilution_refresh_payload_carries_score(project: Path, monkeypatch):
    import watcher

    posted: list[tuple[str, dict]] = []
    fake = SimpleNamespace(post=lambda url, json, timeout: posted.append((url, json)))
    monkeypatch.setattr(watcher, "requests", fake)
    handler = GuidanceEventHandler(api_base="http://api")

    claude = project / "CLAUDE.md"
    handler._notify("modified", str(claude))
    n = count_lines(claude)
    url, payload = posted[-1]
    assert url == "http://api/api/harnesses/antidilution/refresh"
    assert payload["lines"] == n
    assert payload["score"] == pytest.approx(_anti_dilution_score(n))

    rule = project / "rules" / "style.md"
    handler._notify("modified", str(rule))
    url, payload = posted[-1]
    assert url == "http://api/api/harnesses/rule-coverage/refresh"
    assert "score" not in payload and "lines" not in payload


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("CLAUDE_fixture1.md", 100.0),
        ("CLAUDE_fixture2.md", 100.0),
        ("CLAUDE_fixture3.md", 0.0),
        ("CLAUDE_fixture4.md", 100.0),
    ],
)
def test_anti_dilution_score_fixtures(name: str, expected: float):
    n = count_lines(FIXTURES / name)
    score = _anti_dilution_score(n)
    print(f"\n{name}: {n} lignes -> V = {score:.2f}%")
    assert score == pytest.approx(expected)
