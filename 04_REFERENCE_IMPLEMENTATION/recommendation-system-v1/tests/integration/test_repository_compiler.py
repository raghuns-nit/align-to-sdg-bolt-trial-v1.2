from pathlib import Path
from recommendation_system.repository import RepositoryCompiler

def test_compile_repository(tmp_path):
    root=Path(__file__).resolve().parents[2]/"data"/"repository"
    manifest=RepositoryCompiler(root,tmp_path).compile()
    assert manifest["node_count"] > 0
    assert manifest["edge_count"] > 0
    assert (tmp_path/"compiled_graph.json").exists()
    assert (tmp_path/"semantic_corpus.json").exists()
