import json, urllib.request
BASE = "https://dichanerp.huaxianggroup.cn/k3cloud/"

def post(path, body, session=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode("utf-8"), headers={"Content-Type":"application/json; charset=utf-8"})
    if session: req.add_header("kdservice-sessionid", session)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

login = post("Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc", {"acctId":"61cbb7b2d5e132","userName":"\u5f20\u7bad\u9e23","password":"zjm6228659","lcid":"2052"})
sid = login["KDSVCSessionId"]

model = {
  "FVOUCHERID": 0,
  "FAccountBookID": {"FNumber": "106"},
  "FDate": "2026-06-26",
  "FYEAR": "2026",
  "FPERIOD": "6",
  "FVOUCHERGROUPID": {"FNumber": "PZZ2"},
  "FEntity": [
    {
      "FEntryID": 0,
      "FEXPLANATION": "\u652f\u4ed8\u6d4b\u8bd5\u5458 0.01\u5143",
      "FACCOUNTID": {"FNumber": "2241.03"},
      "FCURRENCYID": {"FNumber": "PRE001"},
      "FEXCHANGERATETYPE": {"FNumber": "HLTX01_SYS"},
      "FEXCHANGERATE": "1",
      "FDEBIT": "0.01",
      "FCREDIT": 0,
      "FDetailID": {
        "FDETAILID__FFLEX7": {"FNumber": "NO0034"}
      }
    },
    {
      "FEntryID": 0,
      "FEXPLANATION": "\u652f\u4ed8\u6d4b\u8bd5\u5458 0.01\u5143",
      "FACCOUNTID": {"FNumber": "1002.03"},
      "FCURRENCYID": {"FNumber": "PRE001"},
      "FEXCHANGERATETYPE": {"FNumber": "HLTX01_SYS"},
      "FEXCHANGERATE": "1",
      "FDEBIT": 0,
      "FCREDIT": "0.01",
      "FDetailID": {
        "FDETAILID__FFLEX14": {"FNumber": "YH01"}
      }
    }
  ]
}

save_body = {
  "formid": "GL_VOUCHER",
  "data": {
    "ValidateFlag": True,
    "NumberSearch": True,
    "IsVerifyBaseDataField": False,
    "IsEntryBatchFill": True,
    "IsDeleteEntry": True,
    "Model": model
  }
}
res = post("Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc", save_body, sid)
out = "D:/E/project/automotive_dismantling_platform/automotive_dismantling_platform/java-backend/scripts/kingdee_save_test.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
status = res.get("Result",{}).get("ResponseStatus",{})
print("SUCCESS", status.get("IsSuccess"), status.get("Errors", status.get("Msg")))