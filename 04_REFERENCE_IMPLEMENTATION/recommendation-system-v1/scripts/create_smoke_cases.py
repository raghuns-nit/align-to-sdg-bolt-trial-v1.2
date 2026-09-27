#!/usr/bin/env python3
import csv
from pathlib import Path

def rows(path):
    with open(path,encoding="utf-8-sig",newline="") as f: return list(csv.DictReader(f))
root=Path(__file__).resolve().parents[1]/"data"/"repository"
rels=rows(root/"relationships.csv")
subs={r["subtopic_id:ID"]:r for r in rows(root/"03_subtopic.csv")}
first=next(r for r in rels if r[":TYPE"]=="MAPS_TO_KCR" and r[":START_ID"] in subs)
sid=first[":START_ID"]; s=subs[sid]
fields=["Test_ID","Test_Dimension","Anchor_Type","Anchor_ID","Course_Hint","Technical_Query","Application_Context","Sustainability_Mechanism_Present","Technical_System","Operational_Action","Mechanism","Affected_Resource_or_Function","Stakeholder_or_Ecological_Context","Boundary_Conditions"]
cases=[
 {"Test_ID":"SMOKE_RECOMMEND","Test_Dimension":"parity-smoke","Anchor_Type":"Subtopic","Anchor_ID":sid,"Course_Hint":"","Technical_Query":s.get("name","") ,"Application_Context":"Improve resource efficiency while maintaining technical performance.","Sustainability_Mechanism_Present":"yes","Technical_System":s.get("name","") ,"Operational_Action":"compare alternatives and reduce avoidable resource use","Mechanism":"reduce resource demand while maintaining service performance","Affected_Resource_or_Function":"materials energy and service performance","Stakeholder_or_Ecological_Context":"users and local environment","Boundary_Conditions":"technical performance and safety remain satisfied"},
 {"Test_ID":"SMOKE_ABSTAIN","Test_Dimension":"parity-smoke","Anchor_Type":"Subtopic","Anchor_ID":sid,"Course_Hint":"","Technical_Query":s.get("name","") ,"Application_Context":"Purely technical calculation with no stated sustainability mechanism.","Sustainability_Mechanism_Present":"no","Technical_System":s.get("name","") ,"Operational_Action":"calculate technical value","Mechanism":"","Affected_Resource_or_Function":"","Stakeholder_or_Ecological_Context":"","Boundary_Conditions":""},
 {"Test_ID":"SMOKE_NEGATION","Test_Dimension":"parity-smoke","Anchor_Type":"Subtopic","Anchor_ID":sid,"Course_Hint":"","Technical_Query":s.get("name","") ,"Application_Context":"Compare alternatives while explicitly excluding a polluter-liability rule.","Sustainability_Mechanism_Present":"yes","Technical_System":s.get("name","") ,"Operational_Action":"compare alternatives","Mechanism":"compare lifecycle resource implications; no polluter-liability rule is invoked","Affected_Resource_or_Function":"resource use","Stakeholder_or_Ecological_Context":"project stakeholders","Boundary_Conditions":"no polluter-liability rule is invoked"},
]
out=Path(__file__).resolve().parents[1]/"data"/"benchmark"/"smoke_cases.csv"; out.parent.mkdir(parents=True,exist_ok=True)
with open(out,"w",encoding="utf-8",newline="") as f:
 w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(cases)
print(out)
