#!/usr/bin/env python3
import argparse, json
from recommendation_system.parity import ParityHarness

p=argparse.ArgumentParser(); p.add_argument("--reference", required=True); p.add_argument("--repo", required=True); p.add_argument("--cases", required=True); p.add_argument("--output", required=True); p.add_argument("--backend", default="lsa", choices=["lsa","sentence-transformer","auto"]); p.add_argument("--tolerance", type=float, default=1e-6); args=p.parse_args()
h=ParityHarness(args.reference,args.repo,backend=args.backend,float_tolerance=args.tolerance)
r=h.run_and_write(args.cases,args.output); print(json.dumps(r,indent=2)); raise SystemExit(0 if r["passed"] else 1)
