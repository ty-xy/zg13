from math import radians, cos, sin, asin, sqrt
from zerver.lib import avatar
from zerver.models import UserProfile, ZgDepartmentAttendance, ZgAttendance
from django.http import JsonResponse
import json
import time
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events, register_job
from datetime import datetime, timezone, timedelta



def nuw_time():
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    return stockpile_time


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


try:
    # 实例化调度器
    schedulers = BackgroundScheduler()
    # 调度器使用DjangoJobStore()
    schedulers.add_jobstore(DjangoJobStore(), "default")


    # 'cron'方式循环，周一到周五，每天9:30:10执行,id为工作ID作为标记
    # ('scheduler',"interval", seconds=1)  #用interval方式循环，每一秒执行一次
    @register_job(schedulers, 'cron', day_of_week='1-5', hour='10', minute='11', id='task_time1')
    def timing_attendance():
        users = UserProfile.objects.all()
        user_list = list()
        for user in users:
            user_list.append(ZgAttendance(user_name=user, create_time=nuw_time()))
        ZgAttendance.objects.bulk_create(user_list)


    @register_job(schedulers, 'cron', day_of_week='1-5', hour='10', minute='45', id='task_time1')
    def examine_attendance():
        sign_in_attendances = ZgAttendance.objects.filter(
            sign_in_explain=None,
            create_time__year=nuw_time().year,
            create_time__month=nuw_time().month,
            create_time__day=nuw_time().day,
        )
        sign_in_attendances.update(sign_in_explain='缺卡')

        sign_off_attendances = ZgAttendance.objects.filter(
            sign_off_explain=None,
            create_time__year=nuw_time().year,
            create_time__month=nuw_time().month,
            create_time__day=nuw_time().day,
        )
        sign_off_attendances.update(sign_off_explain='缺卡')

    # 监控任务
    register_events(schedulers)
    # 调度器开始
    schedulers.start()

except Exception as e:
    print(e)
