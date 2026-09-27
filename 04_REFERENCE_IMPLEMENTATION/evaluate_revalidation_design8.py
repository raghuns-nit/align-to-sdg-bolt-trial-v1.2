#!/usr/bin/env python3
"""Design-7 evaluator for the frozen 15-case regression suite.

Preserves every legacy v3 metric and adds promotion-aware diagnostics.
Gold is evaluation-only and is never imported by the runtime.
"""
import argparse,csv,json,os

def read(path):
    with open(path,encoding='utf-8',newline='') as f: return list(csv.DictReader(f))
def split(v): return {x.strip() for x in str(v or '').split(';') if x.strip()}
def write(path,rows,fields):
    with open(path,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)

def main():
    p=argparse.ArgumentParser(); p.add_argument('--predictions',required=True); p.add_argument('--gold',required=True); p.add_argument('--output',required=True)
    a=p.parse_args(); preds={r['Test_ID']:r for r in read(a.predictions)}; gold=read(a.gold); out=[]
    for g in gold:
        p_=preds[g['Test_ID']]
        required=split(g['Required_SCR_IDs']); acceptable=split(g['Acceptable_SCR_IDs']); forbidden=split(g['Forbidden_SCR_IDs'])
        top1=split(p_['Recommended_SCR_ID'])
        cand=json.loads(p_['Top_Candidates_JSON'] or '[]'); top3={x['SCR_ID'] for x in cand[:3]}
        promoted=split(p_.get('Promoted_SCR_IDs',''))
        if not promoted and top1: promoted=set(top1)
        if 'ANY_SCR' in forbidden:
            forbidden_top1_hit=bool(top1); forbidden_promoted_hit=bool(promoted)
        else:
            forbidden_top1_hit=bool(top1 & forbidden); forbidden_promoted_hit=bool(promoted & forbidden)
        req_top1=(required <= top1) if required else (not top1)
        req_top3=(required <= top3) if required else True
        acceptable_top1=bool(top1 & (required|acceptable)) if top1 else not required
        promoted_required=(required <= promoted) if required else (not promoted)
        exact_promoted=(promoted == required)
        exp_id=g['Expected_Resolution_ID']; evidence=split(p_['Evidence_Node_IDs'])|{p_['Resolution_ID']}
        if g['Expected_Resolution_Type']=='Scope_Mismatch': resolution_pass=p_['Scope_Status']=='SCOPE_MISMATCH_REANCHOR'
        else: resolution_pass=(not exp_id) or (exp_id in evidence)
        legacy_behavioral=(req_top3 and not forbidden_top1_hit and resolution_pass and (acceptable_top1 or (not required and not top1)))
        strict_end_to_end=(legacy_behavioral and promoted_required and not forbidden_promoted_hit)
        multi=(len(required)>1)
        tp=len(promoted & required); fp=len(promoted-required); fn=len(required-promoted)
        out.append({
            'Test_ID':g['Test_ID'],'Required_SCR_IDs':g['Required_SCR_IDs'],'Acceptable_SCR_IDs':g['Acceptable_SCR_IDs'],'Forbidden_SCR_IDs':g['Forbidden_SCR_IDs'],
            'Actual_Top1':p_['Recommended_SCR_ID'],'Actual_Top3':'; '.join(x['SCR_ID'] for x in cand[:3]),'Promoted_SCR_IDs':'; '.join(sorted(promoted)),'Promoted_Count':len(promoted),
            'Required_Top1_Pass':'PASS' if req_top1 else 'FAIL','Acceptable_Aware_Top1_Pass':'PASS' if acceptable_top1 else 'FAIL','Required_Top3_Recall_Pass':'PASS' if req_top3 else 'FAIL',
            'Promoted_Required_Set_Pass':'PASS' if promoted_required else 'FAIL','Exact_Promoted_Set_Match':'PASS' if exact_promoted else 'FAIL',
            'Multi_Label_Promotion_Pass':('PASS' if promoted_required and not forbidden_promoted_hit else 'FAIL') if multi else 'N/A',
            'Forbidden_Top1_Pass':'PASS' if not forbidden_top1_hit else 'FAIL','Forbidden_Promoted_Pass':'PASS' if not forbidden_promoted_hit else 'FAIL',
            'Resolution_Pass':'PASS' if resolution_pass else 'FAIL','Overall_Prototype_Pass':'PASS' if legacy_behavioral else 'FAIL','Strict_End_to_End_Pass':'PASS' if strict_end_to_end else 'FAIL',
            'Promoted_TP':tp,'Promoted_FP':fp,'Promoted_FN':fn,'Decision_Status':p_['Decision_Status'],'Scope_Status':p_['Scope_Status'],
            'Resolution_Type':p_['Resolution_Type'],'Resolution_ID':p_['Resolution_ID'],'Rationale':g['Rationale']
        })
    fields=list(out[0]); write(a.output,out,fields)
    tp=sum(int(r['Promoted_TP']) for r in out); fp=sum(int(r['Promoted_FP']) for r in out); fn=sum(int(r['Promoted_FN']) for r in out)
    precision=tp/(tp+fp) if tp+fp else 1.0; recall=tp/(tp+fn) if tp+fn else 1.0; f1=2*precision*recall/(precision+recall) if precision+recall else 0.0
    multi=[r for r,g in zip(out,gold) if len(split(g['Required_SCR_IDs']))>1]
    metrics={
        'cases':len(out),
        # Legacy v3 headline metrics retained unchanged.
        'overall_prototype_pass':sum(r['Overall_Prototype_Pass']=='PASS' for r in out),
        'required_top1_pass':sum(r['Required_Top1_Pass']=='PASS' for r in out),
        'required_top3_recall_pass':sum(r['Required_Top3_Recall_Pass']=='PASS' for r in out),
        'forbidden_top1_pass':sum(r['Forbidden_Top1_Pass']=='PASS' for r in out),
        'resolution_pass':sum(r['Resolution_Pass']=='PASS' for r in out),
        # Design-7 additions.
        'strict_end_to_end_pass':sum(r['Strict_End_to_End_Pass']=='PASS' for r in out),
        'multi_label_required_rows':len(multi),
        'multi_label_promotion_pass':sum(r['Multi_Label_Promotion_Pass']=='PASS' for r in multi),
        'promoted_set_tp':tp,'promoted_set_fp':fp,'promoted_set_fn':fn,
        'promoted_set_precision':precision,'promoted_set_recall':recall,'promoted_set_f1':f1,
        'max_promoted_count':max(int(r['Promoted_Count']) for r in out),
        'rows_with_multiple_promoted_scrs':sum(int(r['Promoted_Count'])>1 for r in out),
        'forbidden_promoted_pass':sum(r['Forbidden_Promoted_Pass']=='PASS' for r in out),
        'metric_note':'Overall_Prototype_Pass is the legacy ranking/scope metric; Strict_End_to_End_Pass additionally requires final promoted-set recovery.'
    }
    with open(a.output+'.metrics.json','w',encoding='utf-8') as f: json.dump(metrics,f,indent=2)
    print(json.dumps(metrics,indent=2))
if __name__=='__main__': main()