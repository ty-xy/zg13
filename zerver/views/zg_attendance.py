from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgAttendance, ZgOutsideWork, ZgDepartmentAttendance, UserProfile
from tools.zg_tools.zg_attendance_tools import haversine
from django.db.models import Q
import calendar
from datetime import datetime, timezone, timedelta
import time
from zerver.lib import avatar
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
# 缺少地理信息
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
                                                    sign_in_time__day=str(day)) |
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
# 缺少外勤信息，请假信息
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
        absenteeism_count = ZgAttendance.objects.filter(
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
            'absenteeism_count': absenteeism_count, 'month_data': month_data
            }


# web个人月考勤统计
def solo_month_attendance_web(request, user_profile):
    page = request.GET.get('page', 1)
    user_profile = request.GET.get('user_id', user_profile)
    month1 = int(month) - (int(page) - 1) * 2
    month2 = month1 - 1
    month_list = list()
    month_list.append(month1)
    month_list.append(month2)
    month_attendance_list = []
    for months in month_list:
        month_attendance_list.append(month_attendance_tools(user_profile, months))

    return JsonResponse({'errno': '0', 'message': '成功', 'super_user': user_profile.is_api_super_user,
                         "month_attendance_list": month_attendance_list})


# 管理单天
# 缺少外勤，请假
def attendances_day(request, user_profile):
    if user_profile.is_api_super_user:

        attendances_id = request.GET.get('attendances_id')
        dates = request.GET.get('date')
        if not attendances_id:
            return JsonResponse({'errno': '0', 'message': '缺少id'})
        if dates:
            stockpile_time = datetime.strptime(dates, '%Y-%m-%d')
            year = stockpile_time.year
            month = stockpile_time.month
            day = stockpile_time.day

        else:
            stockpile_time = datetime.utcnow()
            stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
            tzutc_8 = timezone(timedelta(hours=8))
            stockpile_time = stockpile_time.astimezone(tzutc_8) + timedelta(hours=8)

            year = stockpile_time.year
            month = stockpile_time.month
            day = stockpile_time.day


        user_obj_list = UserProfile.objects.filter(atendance=attendances_id)
        attendance_obj_list = []
        # 迟到
        late = []
        # 缺卡
        missing_card = []
        for user_obj in user_obj_list:
            attendance_obj_list = ZgAttendance.objects.filter(sign_in_time__month=month, sign_in_time__year=year,
                                                              sign_in_time__day=day,
                                                              user_name=user_obj)
            attendance_obj_list += attendance_obj_list
            if attendance_obj_list[0].sign_in_explain == '迟到':
                late.append(attendance_obj_list[0].user_name.full_name)
            elif attendance_obj_list[0].sign_in_explain == '缺卡' or attendance_obj_list[0].sign_off_explain == '缺卡':
                if attendance_obj_list[0].user_name.full_name not in missing_card:
                    missing_card.append(attendance_obj_list[0].user_name.full_name)
        # 实际到达
        actual_arrival_count = len(attendance_obj_list)
        # 应该到达
        should_arrival_count = len(user_obj_list)

        attendances_obj_list = ZgDepartmentAttendance.objects.all()
        # 用户组信息
        attendances_list = list()
        for attendances_obj in attendances_obj_list:
            attendances_dict = {}
            attendances_dict['attendances_name'] = attendances_obj.name
            attendances_dict['attendances_id'] = attendances_obj.id
            attendances_list.append(attendances_dict)

        return JsonResponse({'errno': '0', 'message': '成功', 'super_user': user_profile.is_api_super_user,
                             'late': late, 'missing_card': missing_card,
                             'actual_arrival_count': actual_arrival_count,
                             'should_arrival_count': should_arrival_count, 'attendances_list': attendances_list})


# 添加考勤组
def add_attendances(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    attendances_name = req.get('name')
    
    # 成员=>list
    attendances_member_list = req.get('member_list')
    # 上下班时间
    attendances_jobs_time = req.get('jobs_time')
    attendances_rest_time = req.get('rest_time')
    # 考勤日期
    attendances_date = req.get('date')
    # 经纬度
    attendances_longitude = req.get('longitude')
    attendances_latitude = req.get('latitude')
    # 地点
    attendances_location = req.get('location')
    # 范围
    attendances_range = req.get('range')
    print(attendances_date, attendances_latitude, attendances_name, attendances_range, attendances_location,
         attendances_longitude, attendances_member_list, attendances_rest_time, attendances_jobs_time)
    if not all(
        [attendances_date, attendances_latitude, attendances_name, attendances_range, attendances_location,
         attendances_longitude, attendances_member_list, attendances_rest_time, attendances_jobs_time]):
        return JsonResponse({'errno': '1', 'message': '缺少必要参数'})

    try:
        attendances_obj = ZgDepartmentAttendance.objects.create(attendance_name=attendances_name,
                                                                jobs_time=attendances_jobs_time,
                                                                rest_time=attendances_rest_time,
                                                                attendance_time=attendances_date,
                                                                longitude=attendances_longitude,
                                                                latitude=attendances_latitude,
                                                                site=attendances_location,
                                                                default_distance=attendances_range)
        for user_id in attendances_member_list:
            user_obj = UserProfile.objects.filter(id=user_id)
            user_obj[0].atendance = attendances_obj
            user_obj[0].save()

    except Exception:
        return JsonResponse({'errno': '2', 'message': '储存考勤组信息失败'})

    return JsonResponse({'errno': '0', 'message': '创建考勤组成功'})


# 更新考勤组
def update_attendances(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    attendances_id = req.get('attendances_id')
    attendances_name = req.get('name')
    # 成员=>list
    attendances_member_dict = req.get('member_dict')
    # 上下班时间
    attendances_jobs_time = req.get('jobs_time')
    attendances_rest_time = req.get('rest_time')
    # 考勤日期
    attendances_date = req.get('date')
    # 经纬度
    attendances_longitude = req.get('longitude')
    attendances_latitude = req.get('latitude')
    # 地点
    attendances_location = req.get('location')
    # 范围
    attendances_range = req.get('range')

    try:
        attendances_obj = ZgDepartmentAttendance.objects.get(id=attendances_id)
    except Exception:
        return JsonResponse({'errno': '1', 'message': '考勤组id错误'})
    if attendances_name:
        attendances_obj.attendances_name = attendances_name
    if attendances_member_dict:
        for k, v in attendances_member_dict:
            try:
                user_obj = UserProfile.objects.get(id=int(k))
            except Exception:
                return JsonResponse({'errno': '2', 'message': '用户id错误'})
            user_obj.atendance = v
            user_obj.save()
    if attendances_jobs_time:
        attendances_obj.jobs_time = attendances_jobs_time
    if attendances_rest_time:
        attendances_obj.rest_time = attendances_rest_time
    if attendances_date:
        attendances_obj.attendance_time = attendances_date
    if attendances_longitude:
        attendances_obj.longitude = attendances_longitude
    if attendances_latitude:
        attendances_obj.latitude = attendances_latitude
    if attendances_location:
        attendances_obj.site = attendances_location
    if attendances_range:
        attendances_obj.default_distance = attendances_range
    attendances_obj.save()
    return JsonResponse({'errno': '0', 'message': '修改成功'})


# 删除考勤组
def del_attendances(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    attendances_id = req.get('attendances_id')
    try:
        ZgDepartmentAttendance.objects.get(id=attendances_id).delete()
    except Exception:
        JsonResponse({'errno': '1', 'message': '删除失败'})
    return JsonResponse({'errno': '0', 'message': '删除成功'})


# 考勤组全部成员
def attendances_member_view(request, user_profile):
    sttendance_member = request.GET.get('sttendance_member')
    if not sttendance_member:
        return JsonResponse({'errno': '1', 'message': '缺少参数'})
    user_obj_list = UserProfile.objects.filter(atendance=sttendance_member)
    user_list = []
    user_list.append(user_profile.id)
    for user_obj in user_obj_list:
        user_dict = {}
        user_dict['user_avater'] = avatar.absolute_avatar_url(user_obj)
        user_dict['user_name'] = user_obj.full_name
        user_dict['user_id'] = user_obj.id
        user_list.append(user_dict)
    return JsonResponse({'errno': '0', 'message': '成功', 'user_list': user_list})


# 考勤组列表
def attendances_management(request, user_profile):
    attendances_obj_list = ZgDepartmentAttendance.objects.all()
    # 用户组信息
    attendances_list = list()
    attendance_dates = {'1': '周一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '日'}
    for attendances_obj in attendances_obj_list:
        attendances_dict = {}
        attendances_dict['attendances_name'] = attendances_obj.name
        attendances_dict['attendances_id'] = attendances_obj.id
        # 成员
        attendances_dict['attendances_member_list'] = []
        for i in UserProfile.objects.filter(atendance=attendances_obj):
            attendances_dict['attendances_member_list'].append(i.name)
        # 上班时间
        attendances_dict['attendance_time_list'] = []
        for attendance_time in attendances_obj.attendance_time:
            attendances_dict['attendance_time_list'].append(attendance_dates[attendance_time])

        attendances_dict['attendances_location'] = attendances_obj.site
        attendances_list.append(attendances_dict)
    a = user_profile.is_api_super_user

    return JsonResponse({'errno': '0', 'message': '成功', 'attendances_list': attendances_list,
                         'super_user': a})


def testFuncton():
    print("Hello Scheduler")
