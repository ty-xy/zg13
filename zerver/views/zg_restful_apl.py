from zerver.models import Message
from django.http import JsonResponse
import json



# 删除主题
def del_subject(request,user_profile):
    req=request.body
    if not req:
        return JsonResponse({'errno':1,'message':'缺少必要参数'})
    req=req.decode()
    req=json.loads(req)
    subject=req.get('subject')
    if not subject:
        return JsonResponse({'errno':2,'message':'缺少必要参数'})
    Message.objects.filter(subject=subject).delete()
    return JsonResponse({'errno': 4, 'message': '删除成功'})
