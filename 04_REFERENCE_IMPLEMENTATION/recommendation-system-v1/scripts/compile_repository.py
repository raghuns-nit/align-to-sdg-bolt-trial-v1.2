#!/usr/bin/env python3
import argparse, json
from recommendation_system.repository import RepositoryCompiler

p=argparse.ArgumentParser(); p.add_argument("repository_dir"); p.add_argument("output_dir"); p.add_argument("--embeddings", action="store_true"); p.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2"); args=p.parse_args()
c=RepositoryCompiler(args.repository_dir,args.output_dir); m=c.compile()
if args.embeddings: m["embedding"] = c.compile_embeddings(args.model)
print(json.dumps(m,indent=2))
