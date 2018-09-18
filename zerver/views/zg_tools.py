from math import radians, cos, sin, asin, sqrt
from zerver.lib import avatar
from zerver.models import UserProfile, ZgDepartmentAttendance
from django.http import JsonResponse
import json
import time
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events, register_job


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
    user_obj = UserProfile.objects.filter(id=ids)
    avatars = avatar.absolute_avatar_url(user_obj[0])
    name = user_obj.full_name
    ids = user_obj.id

    return {'avatar': avatars, 'name': name, 'id': ids}


def req_tools(request):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    return req


def zg_send_tools(zg_dict):
    event = {'type': 'update_message_flags',
             'operation': 'add',
             'flag': 'starred',
             'messages': [1],
             'all': False}
    for k, v in zg_dict.items():
        event[k] = v
    return event


#                定时日期，定时时辰，定时分钟， 定时任务id：名字，
def timing_task(day_of_week, hour, minute, ttid):
    try:
        # 实例化调度器
        schedulers = BackgroundScheduler()
        # 调度器使用DjangoJobStore()
        schedulers.add_jobstore(DjangoJobStore(), "default")

        # 'cron'方式循环，周一到周五，每天9:30:10执行,id为工作ID作为标记
        # ('scheduler',"interval", seconds=1)  #用interval方式循环，每一秒执行一次

        # zg------
        # id为考勤组名称，
        @register_job(schedulers, 'cron', day_of_week='mon,tue,wed', hour=hour,
                      minute=minute, id=ttid)
        def test_job():
            t_now = time.localtime()
            print(t_now)

        # 监控任务
        register_events(schedulers)
        # 调度器开始
        schedulers.start()

    except Exception as e:
        print(e)
