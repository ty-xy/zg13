from math import radians, cos, sin, asin, sqrt
from zerver.lib import avatar
from zerver.models import UserProfile
from django.http import JsonResponse
import json


def haversine(lon1, lat1, lon2, lat2):  # 经度1，纬度1，经度2，纬度2 （十进制度数）
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # 将十进制度数转化为弧度
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine公式
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # 地球平均半径，单位为公里
    return c * r * 1000

def zg_user_info(ids):
    user_obj=UserProfile.objects.filter(id=ids)
    avatars=avatar.absolute_avatar_url(user_obj[0])
    name = user_obj.full_name
    ids=user_obj.id

    return {'avatar':avatars,'name':name,'id':ids}

def req_tools(request):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    return req

# def zg_ok()
#     return JsonResponse({})
