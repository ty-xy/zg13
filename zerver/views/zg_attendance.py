from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgAttendance, ZgOutsideWork, ZgDepartmentAttendance
from tools.zg_tools.zg_attendance_tools import haversine
from django.db.models import Q
import calendar
from datetime import datetime, timezone, timedelta
import time
import json

# # 当前时间'%Y-%m-%d %H:%M:%S'
stockpile_time = datetime.utcnow()
stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
tzutc_8 = timezone(timedelta(hours=8))
stockpile_time = stockpile_time.astimezone(tzutc_8) + timedelta(hours=8)

year = stockpile_time.year
month = stockpile_time.month
day = stockpile_time.day

nowTime = stockpile_time.time()


# number = calendar.monthrange(nowTime.year, nowTime.month)[1]

# 打卡
def sign_in_def(request, user_profile):
    # 获取规定的上下班时间呢
    req = request.body
    req = req.decode()
    req = json.loads(req)
    aaa = req.get('aaa')
    bbb = req.get('bbb')
    try:
        jobs_time = user_profile.atendance.jobs_time
        rest_time = user_profile.atendance.rest_time
    except Exception:
        jobs_time = datetime.strptime('08:30:00', "%H:%M:%S").time()
        rest_time = datetime.strptime('18:00:00', "%H:%M:%S").time()

    stockpile_time = datetime.strptime(aaa, '%Y-%m-%d %H:%M:%S')
    year = stockpile_time.year
    month = stockpile_time.month
    day = stockpile_time.day
    nowTime = datetime.strptime(bbb, '%H:%M:%S').time()

    #
    attendance_time = ZgAttendance.objects.filter(Q(sign_in_time__year=str(year),
                                                  sign_in_time__month=str(month),
                                                  sign_in_time__day=str(day))|
                                                  Q(sign_off_time__year=str(year),
                                                  sign_off_time__month=str(month),
                                                  sign_off_time__day=str(day)))
    attendance_sign_off_time = 0
    if attendance_time:
        attendance_sign_off_time = str(attendance_time[0].sign_off_time)[0:19]

    if jobs_time >= nowTime:
        if attendance_time:
            return JsonResponse({'errno': '1', 'message': '签到成功请勿重复打卡'})

        try:
            # 储存打卡时间
            ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile, sign_in_explain='正常')
        except Exception:
            return JsonResponse({'errno': '2', 'message': '打卡失败'})

        return JsonResponse({'errno': '0', 'message': '打卡成功'})

    elif rest_time > nowTime > jobs_time:

        if attendance_time:
            if attendance_sign_off_time != '1970-01-01 00:00:00':
                return JsonResponse({'errno': '3', 'message': '签退成功请勿重复签退'})

            try:
                # 储存打卡时间
                attendance_time[0].sign_off_explain = '早退'
                attendance_time[0].sign_off_time = stockpile_time
                attendance_time[0].save()

            except Exception:
                return JsonResponse({'errno': '4', 'message': '打卡失败'})

            return JsonResponse({'errno': '0', 'message': '打卡成功,您已早退'})

        try:

            ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile,
                                        sign_in_explain='迟到')
        except Exception:
            return JsonResponse({'errno': '5', 'message': '打卡失败'})

        return JsonResponse({'errno': '0', 'message': '打卡成功,您已迟到,下次早点来哦'})

    elif nowTime >= rest_time:
        if not attendance_time:
            ZgAttendance.objects.create(sign_off_time=stockpile_time, user_name=user_profile,
                                        sign_in_explain='正常')
            return JsonResponse({'errno': '0', 'message': '下班打卡成功'})

        if attendance_sign_off_time != '1970-01-01 00:00:00':
            return JsonResponse({'errno': '6', 'message': '签退成功请勿重复签退'})
        print(attendance_sign_off_time, type(attendance_sign_off_time))

        attendance_time[0].sign_off_time = stockpile_time
        attendance_time[0].sign_off_explain = '正常'
        attendance_time[0].save()
        return JsonResponse({'errno': '0', 'message': '下班打卡成功'})


# 月考勤信息工具
def month_attendance_tools(user_profile, months):
    try:
        # 本月打卡天数
        attendance_count = ZgAttendance.objects.filter(user_name=user_profile, sign_in_time__year=year,
                                                       sign_in_time__month=months,
                                                       sign_off_time__year=year,
                                                       sign_off_time__month=months
                                                       ).count()

    except Exception:
        return ({'errno': '1', 'message': '获取打卡天数失败'})

    try:
        outsidework_counts = ZgOutsideWork.objects.filter(user_name=user_profile, sign_in_time__year=year,
                                                          sign_in_time__month=months)
    except Exception:
        return ({'errno': '2', 'message': '获取本月外勤天数失败'})

    outsidework_dict = {}
    for i in outsidework_counts:
        outsidework_dict[i.sign_in_time__day] = 1
    outsidework_count = len(outsidework_dict)

    try:
        # 迟到
        overdue_count = ZgAttendance.objects.filter(user_name=user_profile,
                                                    sign_in_time__year=year,
                                                    sign_in_time__month=months,
                                                    sign_in_explain='迟到').count()
    except Exception:
        return ({'errno': '3', 'message': '获取迟到天数失败'})

    try:
        # 早退
        leave_early_count = ZgAttendance.objects.filter(user_name=user_profile,
                                                        sign_in_time__year=year,
                                                        sign_in_time__month=months,
                                                        sign_off_explain='早退').count()
    except Exception:
        return ({'errno': '4', 'message': '获取早退天数失败'})

    try:
        leave_count = ZgAttendance.objects.filter(user_name=user_profile, sign_in_time__year=year,
                                                  sign_in_time__month=months,
                                                  sign_in_explain='请假').count()
    except Exception:
        return ({'errno': '5', 'message': '获取请假天数失败'})

    try:
        # 缺卡天数
        absenteeism_time = ZgAttendance.objects.filter(
            Q(sign_in_time__contains='1970-01-01', user_name=user_profile, sign_off_time__month=months,
              sign_off_time__year=year) | Q(sign_in_time__contains='1970-01-01',
                                            user_name=user_profile,
                                            sign_in_time__month=months,
                                            sign_in_time__year=year) | Q(sign_in_time__contains='1970-01-01',
                                                                         sign_off_time__contains='1970-01-01')).count()
    except Exception:
        return ({'errno': '6', 'message': '获取缺卡天数失败'})

    month_data = dict()
    month_data['month'] = months
    monthRange = calendar.monthrange(int(year), months)
    month_data['month_count'] = monthRange[1]
    month_data['month_week'] = monthRange[0] + 1

    month_data['normal_list'] = []
    month_data['outside_work_list'] = []
    month_data['no_normal_list'] = []
    # 正常
    attendance_obj_list = ZgAttendance.objects.filter(user_name=user_profile, sign_in_explain='正常',
                                                      sign_off_explain='正常',
                                                      sign_in_time__month=months, sign_in_time__year=year)

    for attendance_obj in attendance_obj_list:
        normal = str(attendance_obj.sign_in_time)[8:10]
        month_data['normal_list'].append(int(normal))
    # 外勤请假
    outside_work_obj_list = ZgOutsideWork.objects.filter(user_name=user_profile, sign_in_time__month=months,
                                                         sign_in_time__year=year)
    outside_work_dict = {}

    for qutside_work_obj in outside_work_obj_list:
        qutside_work = str(qutside_work_obj.sign_in_time)[8:10]
        outside_work_dict[qutside_work] = 1
    for k, y in outside_work_dict:
        month_data['outside_work_list'].append(k)
    # 不正常
    no_attendance_obj_list = ZgAttendance.objects.filter(~Q(sign_in_explain='正常') | ~Q(sign_off_explain='正常'),
                                                         sign_in_time__month=months, sign_in_time__year=year,
                                                         user_name=user_profile)
    for no_attendance_obj in no_attendance_obj_list:
        normal = str(no_attendance_obj.sign_in_time)[8:10]
        month_data['no_normal_list'].append(int(normal))

    return {'attendance_count': attendance_count, 'outsidework_count': outsidework_count,
            'overdue_count': overdue_count, 'leave_early_count': leave_early_count, 'leave_count': leave_count,
            'absenteeism_time': absenteeism_time, 'month_data': month_data
            }



# web月考勤统计
def solo_month_attendance_web(request, user_profile):
    page = request.GET.get('page')
    month1 = int(month) - (int(page) - 1) * 2
    month2 = month1 - 1
    month_list = list()
    month_list.append(month1)
    month_list.append(month2)
    month_attendance_list = []

    for months in month_list:
        month_attendance_list.append(month_attendance_tools(user_profile, months))
    print(month_attendance_list)

    return JsonResponse({'errno': '0', 'message': '成功',"month_attendance_list":month_attendance_list})



