from pathlib import Path
from recommendation_system.parity import ParityHarness

def test_design8a_reference_parity_lsa_smoke():
    root=Path(__file__).resolve().parents[2]
    cases=root/"data"/"benchmark"/"smoke_cases.csv"
    harness=ParityHarness(root/"reference"/"hybrid_runtime_v5.py", root/"data"/"repository", backend="lsa")
    report=harness.run(cases)
    assert report["passed"], report
