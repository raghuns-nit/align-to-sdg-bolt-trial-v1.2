from pathlib import Path
from recommendation_system.repository import RepositoryValidator

def test_current_repository_bundle_validates():
    root=Path(__file__).resolve().parents[2]/"data"/"repository"
    report=RepositoryValidator(root).validate()
    assert report.passed, [x.message for x in report.errors]
    assert report.relationship_count > 0
