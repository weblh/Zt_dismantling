import json, urllib.request
BASE = "https://dichanerp.huaxianggroup.cn/k3cloud/"
DB = "61cbb7b2d5e132"
USER = "\u5f20\u7bad\u9e23"
PWD = "zjm6228659"

def post(path, body, session=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode("utf-8"), headers={"Content-Type":"application/json; charset=utf-8"})
    if session: req.add_header("kdservice-sessionid", session)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

login = post("Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc", {"acctId": DB, "userName": USER, "password": PWD, "lcid": "2052"})
print("LOGIN", login.get("LoginResultType"), login.get("Message",""))
sid = login["KDSVCSessionId"]
vg_name = "\u94f6"
flt = "FYear=2026 AND FPeriod=6 AND FVOUCHERGROUPID.FName='" + vg_name + "' AND FVOUCHERGROUPNO='46' AND FAccountBookID.FNumber='106'"
q = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc", {"data":{"FormId":"GL_VOUCHER","FieldKeys":"FVOUCHERID,FDate,FVOUCHERGROUPID.FName,FVOUCHERGROUPNO,FExplanation,FAccountID.FNumber,FDebit,FCredit","FilterString":flt,"Limit":10,"StartRow":0,"TopRowCount":0}}, sid)
print("QUERY", q)
vid = q[0][0] if isinstance(q,list) and q else None
if vid:
    v = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc", {"formid":"GL_VOUCHER","data":{"CreateOrgId":0,"Number":"","Id":str(vid)}}, sid)
    model = v.get("Result",{}).get("Result", v.get("Result",{}))
    for i,row in enumerate(model.get("FEntity",[])):
        print("ROW", i+1, "ACCT", row.get("FACCOUNTID"), "DETAIL", json.dumps(row.get("FDetailID"), ensure_ascii=False), "DEBIT", row.get("FDEBIT"), "CREDIT", row.get("FCREDIT"))
    print("GROUP", model.get("FVOUCHERGROUPID"))
for form in ["BD_Empinfo","BD_NEWSTAFF"]:
    eq = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc", {"data":{"FormId":form,"FieldKeys":"FNumber,FName,FStaffNumber","FilterString":"FName='\u90ed\u6587\u6770'","Limit":5,"StartRow":0,"TopRowCount":0}}, sid)
    print(form, eq)
vg = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc", {"data":{"FormId":"BD_VOUCHERGROUP","FieldKeys":"FNumber,FName","FilterString":"FName='" + vg_name + "'","Limit":5,"StartRow":0,"TopRowCount":0}}, sid)
print("VGROUP", vg)
bk = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc", {"data":{"FormId":"BD_BANK","FieldKeys":"FNumber,FName","FilterString":"FName like '%\u5de5\u5546%'","Limit":5,"StartRow":0,"TopRowCount":0}}, sid)
print("BANK", bk)