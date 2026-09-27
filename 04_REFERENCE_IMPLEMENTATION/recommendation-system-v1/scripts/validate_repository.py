#!/usr/bin/env python3
import argparse, json
from dataclasses import asdict
from recommendation_system.repository import RepositoryValidator

p=argparse.ArgumentParser(); p.add_argument("repository_dir"); args=p.parse_args()
r=RepositoryValidator(args.repository_dir).validate()
print(json.dumps({"passed":r.passed,"files_checked":r.files_checked,"node_count":r.node_count,"relationship_count":r.relationship_count,"errors":[asdict(x) for x in r.errors],"warnings":[asdict(x) for x in r.warnings]}, indent=2))
raise SystemExit(0 if r.passed else 1)
