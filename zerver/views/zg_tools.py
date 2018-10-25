from math import radians, cos, sin, asin, sqrt
from zerver.lib import avatar
from zerver.models import UserProfile, ZgDepartmentAttendance, ZgAttendance, ZgPurchase, JobsPlease, ProjectProgress, \
    ZgLeave, ZgReview, ZgReimburse, ZgWorkNotice, Attachment, ZgCorrectzAccessory
from django.http import JsonResponse
import json
import time
# from apscheduler.schedulers.background import BackgroundScheduler
# from django_apscheduler.jobstores import DjangoJobStore, register_events
from datetime import datetime, timezone, timedelta
# from django_apscheduler.jobstores import register_job
from zerver.tornado.event_queue import send_event

import re


def zg_send_tools(zg_dict):
    event = {'type': 'update_message_flags',
             'operation': 'add',
             'flag': 'starred',
             'messages': [1],
             'all': False}
    for k, v in zg_dict.items():
        event[k] = v
    return event


def nuw_time():
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    return stockpile_time


def send_approver_observer(user_profile, obj_id,
                           approval_type, approver_list,
                           observer_list, img_url, event,
                           third, cause):
    '''
    发送审批人和抄送人的函数，需要传入：用户，创建的报表id，报表类型，审批列表
    抄送人列表，event，二级标题，三级标题
    '''
    type_dict = {'evection': '出差申请', 'leave': '请假申请', 'purchase': '采购申请', 'jobs_please': '工作请示',
                 'project_progress': '工程进度汇报'}
    types = type_dict[approval_type]

    # try:
    if img_url:
        for img in img_url:
            path_id = img.split('user_uploads/')[1]
            if path_id[-1] == ')':
                path_id = img.split('user_uploads/')[1][: -1]
                print(path_id)
            print(path_id)
            attachment = Attachment.objects.filter(path_id=path_id)
            print(attachment)
            ZgCorrectzAccessory.objects.create(correctz_type='leave', table_id=obj_id, attachment=attachment[0])

    if approver_list:
        event['theme'] = user_profile.full_name + '的' + types + '需要您的审批'
        for approver in approver_list:
            ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=approver, table_id=obj_id,
                                    send_time=nuw_time())
            user = UserProfile.objects.get(id=approver)

            ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=cause,
                                        third=third,
                                        send_time=nuw_time(),
                                        table_type=approval_type,
                                        table_id=obj_id)
            # send_event(event, approver_list)
    if observer_list:
        event['theme'] = user_profile.full_name + '的' + types + '需要您知晓'
        for observer in observer_list:
            ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=observer, duties='inform',
                                    table_id=obj_id, send_time=nuw_time())

            user = UserProfile.objects.get(id=observer)
            ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=cause,
                                        third=third, send_time=nuw_time(),
                                        table_type=approval_type,
                                        table_id=obj_id)

        # send_event(event, observer_list)

    # except Exception as e:
    #     raise e


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


def zg_user_data(user_list):
    user_data_list = []
    for user_id in user_list:
        feedback_dict = {}
        user = UserProfile.objects.get(id=user_id)
        feedback_dict['user_avatar'] = avatar.absolute_avatar_url(user.user)
        feedback_dict['user_name'] = user.user.full_name
        user_data_list.append(feedback_dict)
    return user_data_list


def zg_user_info(ids):
    user_obj = UserProfile.objects.filter(id=ids)
    avatars = avatar.absolute_avatar_url(user_obj[0])
    name = user_obj.full_name
    ids = user_obj.id

    return {'avatar': avatars, 'name': name, 'id': ids}


def req_tools(request):
    req = request.body
    if not req:
        return JsonResponse({'errno': 1, 'message': '缺少参数'})
    req = req.decode()
    req = json.loads(req)
    return req


def judge_pc_or_mobile(ua):
    """
    判断访问来源是pc端还是手机端
    :param ua: 访问来源头信息中的User-Agent字段内容
    :return:
    """
    factor = ua
    is_mobile = False
    _long_matches = r'googlebot-mobile|android|avantgo|blackberry|blazer|elaine|hiptop|ip(hone|od)|kindle|midp|mmp' \
                    r'|mobile|o2|opera mini|palm( os)?|pda|plucker|pocket|psp|smartphone|symbian|treo|up\.(browser|link)' \
                    r'|vodafone|wap|windows ce; (iemobile|ppc)|xiino|maemo|fennec'
    _long_matches = re.compile(_long_matches, re.IGNORECASE)
    _short_matches = r'1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)' \
                     r'|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)' \
                     r'|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw' \
                     r'|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8' \
                     r'|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit' \
                     r'|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)' \
                     r'|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji' \
                     r'|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx' \
                     r'|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi' \
                     r'|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)' \
                     r'|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg' \
                     r'|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21' \
                     r'|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-' \
                     r'|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it' \
                     r'|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)' \
                     r'|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)' \
                     r'|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit' \
                     r'|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-'

    _short_matches = re.compile(_short_matches, re.IGNORECASE)

    if _long_matches.search(factor) != None:
        is_mobile = True
    user_agent = factor[0:4]
    if _short_matches.search(user_agent) != None:
        is_mobile = True

    return is_mobile

#
# try:
#     # 实例化调度器
#     schedulers = BackgroundScheduler()
#     # 调度器使用DjangoJobStore()
#     schedulers.add_jobstore(DjangoJobStore(), "default")
#
#
#     # 'cron'方式循环，周一到周五，每天9:30:10执行,id为工作ID作为标记
#     # ('scheduler',"interval", seconds=1)  #用interval方式循环，每一秒执行一次
#     @register_job(schedulers, 'cron', day_of_week='1-5', hour='11', minute='32', id='task_time1')
#     def timing_attendance():
#         users = UserProfile.objects.all()
#         user_list = list()
#         for user in users:
#             user_list.append(ZgAttendance(user_name=user, create_time=nuw_time()))
#         ZgAttendance.objects.bulk_create(user_list)
#         print('定时自动考勤正在运行', '---------' * 15)
#
#
#     @register_job(schedulers, 'cron', day_of_week='1-5', hour='11', minute='03', id='task_time2')
#     def examine_attendance():
#         print('定时自动考勤校正正在运行', '---------' * 15)
#         sign_in_attendances = ZgAttendance.objects.filter(
#             sign_in_explain=None,
#             create_time__year=nuw_time().year,
#             create_time__month=nuw_time().month,
#             create_time__day=nuw_time().day,
#         )
#         sign_in_attendances.update(sign_in_explain='缺卡')
#         sign_off_attendances = ZgAttendance.objects.filter(
#             sign_off_explain=None,
#             create_time__year=nuw_time().year,
#             create_time__month=nuw_time().month,
#             create_time__day=nuw_time().day,
#         )
#         sign_off_attendances.update(sign_off_explain='缺卡')
#
#
#     # 监控任务
#     register_events(schedulers)
#     # 调度器开始
#     schedulers.start()
#
# except Exception as e:
#     print(e)
