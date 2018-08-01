from django.http import JsonResponse
from zerver.models import ZgAttendance, ZgOutsideWork, ZgDepartmentAttendance, UserProfile
from zerver.views.zg_tools import haversine
from django.db.models import Q
import calendar
from datetime import datetime, timezone, timedelta
from zerver.lib import avatar
import json


# # 当前时间'%Y-%m-%d %H:%M:%S'


# number = calendar.monthrange(nowTime.year, nowTime.month)[1]


# 个人单天月历考勤信息
def attendance_day_solo(request, user_profile):
    user_date = request.GET.get("user_date")
    user_id = request.GET.get("user_id")

    if user_id:
        try:
            user_profile = UserProfile.objects.get(id=user_id)
        except Exception:
            return JsonResponse({'errno': '1', 'message': '用户id错误'})
    if not user_profile.atendance:
        return JsonResponse({'errno': '223', 'message': '该用户不属于任何考勤组'})

    if user_date:

        stockpile_time = datetime.strptime(user_date, '%Y-%m-%d')
        year = stockpile_time.year
        month = stockpile_time.month
        day = stockpile_time.day

    else:
        stockpile_time = datetime.utcnow()
        stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
        year = stockpile_time.year
        month = stockpile_time.month
        day = stockpile_time.day

    try:
        attendance_obj = ZgAttendance.objects.get(sign_in_time__year=str(year), sign_in_time__month=str(month),
                                                  sign_in_time__day=str(day),
                                                  user_name=user_profile)

        sign_in_explain = attendance_obj.sign_in_explain
        sign_off_explain = attendance_obj.sign_off_explain
        sign_in_time = attendance_obj.sign_in_time
        sign_off_time = attendance_obj.sign_off_time

    except Exception:
        sign_in_explain = ''
        sign_off_explain = ''
        sign_in_time = ''
        sign_off_time = ''

    return JsonResponse({'errno': '0', 'message': '成功',
                         'sign_in_explain': sign_in_explain,
                         'sign_off_explain': sign_off_explain,
                         "sign_in_time": sign_in_time,
                         'sign_off_time': sign_off_time,
                         'attendance_name': user_profile.atendance.attendance_name,
                         'jobs_time': user_profile.atendance.jobs_time,
                         'rest_time': user_profile.atendance.rest_time,
                         'location': user_profile.atendance.site
                         })


# 考勤组全部成员
def attendances_member_view(user_profile, attendances_id):
    user_obj_list = UserProfile.objects.filter(atendance=attendances_id)
    user_list = []
    for user_obj in user_obj_list:
        user_dict = {}
        user_dict['user_avater'] = avatar.absolute_avatar_url(user_obj)
        user_dict['user_name'] = user_obj.full_name
        user_dict['user_id'] = user_obj.id
        user_list.append(user_dict)
    return user_list


# 月考勤信息工具
# 缺少外勤信息，请假信息
def month_attendance_tools(user_profile, year, months):
    try:
        # 本月打卡天数
        attendance_count = ZgAttendance.objects.filter(user_name=user_profile, sign_in_time__year=year,
                                                       sign_in_time__month=months,
                                                       sign_off_time__year=year,
                                                       sign_off_time__month=months
                                                       , sign_in_explain='正常',
                                                       sign_off_explain='正常'
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
            Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile, sign_off_time__month=months,
              sign_off_time__year=year) |

            Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile, sign_in_time__month=months,
              sign_in_time__year=year) |

            Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile,
              sign_off_time__contains='1970-01-01 00:00:00+00')).count()
        print()
    except Exception:
        return ({'errno': '6', 'message': '获取缺卡天数失败'})

    month = months
    monthRange = calendar.monthrange(int(year), months)
    month_count = monthRange[1]
    month_week = monthRange[0] + 1

    normal_list = []
    outside_work_list = []
    no_normal_list = []
    # 正常
    attendance_obj_list = ZgAttendance.objects.filter(user_name=user_profile, sign_in_explain='正常',
                                                      sign_off_explain='正常',
                                                      sign_in_time__month=months, sign_in_time__year=year)

    for attendance_obj in attendance_obj_list:
        normal = str(attendance_obj.sign_in_time)[8:10]
        normal_list.append(int(normal))
    # 外勤请假
    outside_work_obj_list = ZgOutsideWork.objects.filter(user_name=user_profile, sign_in_time__month=months,
                                                         sign_in_time__year=year)
    outside_work_dict = {}

    for qutside_work_obj in outside_work_obj_list:
        qutside_work = str(qutside_work_obj.sign_in_time)[8:10]
        outside_work_dict[qutside_work] = 1
    for k, y in outside_work_dict:
        outside_work_list.append(k)
    # 不正常
    no_attendance_obj_list = ZgAttendance.objects.filter(~Q(sign_in_explain='正常') | ~Q(sign_off_explain='正常'),
                                                         sign_in_time__month=months, sign_in_time__year=year,
                                                         user_name=user_profile)
    for no_attendance_obj in no_attendance_obj_list:
        normal = str(no_attendance_obj.sign_in_time)[8:10]
        no_normal_list.append(int(normal))

    return {'attendance_count': attendance_count, 'outsidework_count': outsidework_count,
            'overdue_count': overdue_count, 'leave_early_count': leave_early_count, 'leave_count': leave_count,
            'absenteeism_count': absenteeism_count, 'month': month, 'month_count': month_count,
            'month_week': month_week,
            'normal_list': normal_list, 'outside_work_list': outside_work_list, 'no_normal_list': no_normal_list,
            'user_name': user_profile.full_name,
            'year': year, 'user_avatar': avatar.absolute_avatar_url(user_profile),
            'user_atendance': user_profile.atendance.id}


# web个人月考勤统计（两月）
def solo_month_attendance_web(request, user_profile):
    page = request.GET.get('page', 1)
    user_id = request.GET.get('user_id')
    user_date = request.GET.get("select_year")
    if user_id:
        try:
            user_profile = UserProfile.objects.get(id=user_id)
        except Exception:
            return JsonResponse({'errno': '1', 'message': '用户id错误'})
    if not user_profile.atendance:
        return JsonResponse({'errno': '223', 'message': '该用户不属于任何考勤组'})

    if user_date != 'undefined':
        user_date = user_date + '-12-10'
        stockpile_time = datetime.strptime(user_date, '%Y-%m-%d')
        year = stockpile_time.year
        month = stockpile_time.month

    else:
        stockpile_time = datetime.utcnow()
        stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
        year = stockpile_time.year
        month = stockpile_time.month

    month1 = int(month) - (int(page) - 1) * 2
    month2 = month1 - 1
    month3 = month2 - 1
    month4 = month3 - 1
    month_list = list()
    month_list.append(month1)
    month_list.append(month2)
    month_list.append(month3)
    month_list.append(month4)
    month_attendance_list = []
    for months in month_list:
        month_attendance_list.append(month_attendance_tools(user_profile, year, months))

    return JsonResponse({'errno': '0', 'message': '成功', 'super_user': user_profile.is_realm_admin,
                         "month_attendance_list": month_attendance_list})


# 团队管理考勤单天
# 缺少外勤，请假
def attendances_day(request, user_profile):
    if not user_profile.is_realm_admin:
        return JsonResponse({'errno': '888'})
    attendances_id = request.GET.get('attendances_id')
    dates = request.GET.get('date')

    if dates:
        stockpile_time = datetime.strptime(dates, '%Y-%m-%d')
        year = stockpile_time.year
        month = stockpile_time.month
        day = stockpile_time.day

    else:
        stockpile_time = datetime.utcnow()
        stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
        year = stockpile_time.year
        month = stockpile_time.month
        day = stockpile_time.day
    attendances_obj_list = ZgDepartmentAttendance.objects.all()
    if not attendances_id:
        if not attendances_obj_list:
            if user_profile.is_realm_admin:
                return JsonResponse({'errno': '11', 'message': '请创建考勤组', 'super_user': user_profile.is_realm_admin})
            else:
                return JsonResponse({'errno': '22', 'message': '暂无考勤组，请联系管理员创建考勤组'})
        attendances_id = attendances_obj_list[0]
    # 用户组信息
    attendances_list = list()
    for attendances_obj in attendances_obj_list:
        attendances_dict = {}
        attendances_dict['attendances_name'] = attendances_obj.attendance_name
        attendances_dict['attendances_id'] = attendances_obj.id
        attendances_list.append(attendances_dict)
    user_obj_list = UserProfile.objects.filter(atendance=attendances_id)
    attendance_obj_list = []
    # 迟到
    late = []
    # 缺卡
    missing_card = []
    for user_obj in user_obj_list:
        try:
            attendance_obj = ZgAttendance.objects.get(sign_in_time__month=month, sign_in_time__year=year,
                                                      sign_in_time__day=day,
                                                      user_name=user_obj)
        except Exception:
            continue
        attendance_obj_list.append(attendance_obj)
        if attendance_obj.sign_in_explain == '迟到':
            late.append(attendance_obj.user_name.full_name)
        elif attendance_obj.sign_in_explain == '缺卡' or attendance_obj.sign_off_explain == '缺卡':
            if attendance_obj.user_name.full_name not in missing_card:
                missing_card.append(attendance_obj.user_name.full_name)
    # 实际到达
    actual_arrival_count = len(attendance_obj_list)
    # 应该到达
    should_arrival_count = len(user_obj_list)

    return JsonResponse({'errno': '0', 'message': '成功', 'super_user': user_profile.is_realm_admin,
                         'late': late, 'missing_card': missing_card,
                         'actual_arrival_count': actual_arrival_count,
                         'should_arrival_count': should_arrival_count,
                         'attendances_list': attendances_list,
                         'attendances_member_list': attendances_member_view(user_profile, attendances_id)
                         })


# 添加考勤组
def add_attendances(request, user_profile):
    req = request.body
    print(req)
    req = req.decode()
    print(req)
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
    # 范围=>int
    attendances_range = req.get('range')

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
            user_obj = UserProfile.objects.get(id=user_id)
            user_obj.atendance = attendances_obj
            user_obj.save()

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
    # 考勤日期=>
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
        attendances_obj.attendance_name = attendances_name
        attendances_obj.save()
    if attendances_member_dict:
        for key, value in attendances_member_dict.items():
            try:
                user_obj = UserProfile.objects.get(id=int(key))
                user_obj.atendance = attendances_obj
                user_obj.save()
            except Exception:
                return JsonResponse({'errno': '2', 'message': '用户id错误'})
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
        user_obj_list = UserProfile.objects.filter(atendance=attendances_id)
        for user_obj in user_obj_list:
            user_obj.atendance = None
            user_obj.save()
        ZgDepartmentAttendance.objects.get(id=attendances_id).delete()
    except Exception:
        return JsonResponse({'errno': '1', 'message': '删除失败'})
    return JsonResponse({'errno': '0', 'message': '删除成功'})


# 获取单个考勤组
def get_attendances(request, user_profile):
    attendances_id = request.GET.get('attendances_id')

    if not attendances_id:
        return JsonResponse({'errno': '1', 'message': '缺少id'})
    attendance_dates = {'1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '日'}

    attendances_obj = ZgDepartmentAttendance.objects.filter(id=attendances_id)
    attendances_obj = attendances_obj[0]
    name = attendances_obj.attendance_name
    # 成员=>list
    member_list = []
    user_obj_list = UserProfile.objects.filter(atendance=attendances_id)
    for user_obj in user_obj_list:
        user_dict = dict()
        user_dict['id'] = user_obj.id
        user_dict['name'] = user_obj.full_name
        member_list.append(user_dict)
    # 上下班时间
    jobs_time = attendances_obj.jobs_time
    rest_time = attendances_obj.rest_time
    # 考勤日期=>attendance_time
    attendance_time_list = []
    for attendance_time in attendances_obj.attendance_time:
        attendance_time_list.append('周' + attendance_dates[attendance_time])

    # 经纬度
    longitude = attendances_obj.longitude
    latitude = attendances_obj.latitude
    # 地点site
    site = attendances_obj.site
    # 范围default_distance
    range = attendances_obj.default_distance

    return JsonResponse(
        {'errno': '0', 'message': '获取成功', 'name': name, 'member_list': member_list, 'jobs_time': jobs_time,
         'rest_time': rest_time, 'attendance_time_list': attendance_time_list, 'longitude': longitude,
         'latitude': latitude, 'location': site,
         'range': range})


# 考勤组列表
def attendances_management(request, user_profile):
    attendances_obj_list = ZgDepartmentAttendance.objects.all()
    if attendances_obj_list:
        JsonResponse({'errno': '1', 'message': '暂无用户组哦'})

    # 用户组信息
    attendances_list = list()
    attendance_dates = {'1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '日'}
    for attendances_obj in attendances_obj_list:
        attendances_dict = {}
        attendances_dict['attendances_name'] = attendances_obj.attendance_name
        attendances_dict['attendances_id'] = attendances_obj.id
        # 成员
        attendances_dict['attendances_member_list'] = []
        for i in UserProfile.objects.filter(atendance=attendances_obj):
            attendances_dict['attendances_member_list'].append(i.full_name)

        # 上班时间
        attendances_dict['attendance_time_list'] = []
        for attendance_time in attendances_obj.attendance_time:
            attendances_dict['attendance_time_list'].append(attendance_dates[attendance_time])
        attendances_dict['attendance_time_list'][0] = "周" + attendances_dict['attendance_time_list'][0]
        attendances_dict['jobs_time'] = attendances_obj.jobs_time
        attendances_dict['rest_time'] = attendances_obj.rest_time
        attendances_dict['attendances_location'] = attendances_obj.site
        attendances_list.append(attendances_dict)
    return JsonResponse({'errno': '0', 'message': '成功', 'attendances_list': attendances_list})


# 考勤补卡
def attendance_repair(request, user_profile):
    pass


def testFuncton():
    print("Hello Scheduler")


# =======================================================

# 个人考勤
# 打卡球get：
def sign_in_view(request, user_profile):
    staff = user_profile.atendance
    if not staff:
        if user_profile.is_realm_admin:
            return JsonResponse({'errno': '05', 'message': '暂无考勤组，请设置考勤组'})
        return JsonResponse({'errno': '06', 'message': '暂无考勤组，请联系管理员设置考勤组'})
    # 获取经纬度
    my_longitude = request.GET.get('longitude')
    my_latitude = request.GET.get('latitude')
    if not all([my_longitude, my_latitude]):
        return JsonResponse({'errno': '1', 'message': '地理位置错误'})
    # 获取当前datetime
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    year = stockpile_time.year
    month = stockpile_time.month
    day = stockpile_time.day
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    # 获取当前time
    nowTime = stockpile_time.time()
    attendance_time = ZgAttendance.objects.filter(user_name=user_profile,
                                                  sign_in_time__year=year,
                                                  sign_in_time__month=month,
                                                  sign_in_time__day=day)
    attendance_site = user_profile.atendance.site

    if str(attendance_time[0].sign_in_time) != '1970-01-01 00:00:00+00:00' and str(
        attendance_time[0].sign_off_time) != '1970-01-01 00:00:00+00:00':
        work = dict()
        work['time'] = attendance_time[0].sign_in_time
        work['site'] = attendance_site
        work['status'] = attendance_time[0].sign_in_explain

        off_work = dict()
        off_work['time'] = attendance_time[0].sign_off_time
        off_work['site'] = attendance_site
        off_work['status'] = attendance_time[0].sign_off_explain
        return JsonResponse({'errno': '0', 'message': '1', 'work': work, 'off_work': off_work})

    # 获取设置地点
    longitude = staff.longitude
    latitude = staff.latitude
    my_longitude = float(my_longitude)
    my_latitude = float(my_latitude)
    longitude = float(longitude)
    latitude = float(latitude)
    # 计算距离
    distance = haversine(longitude, latitude, my_longitude, my_latitude)
    # 默认距离
    default_distance = staff.default_distance

    if distance > default_distance:
        return JsonResponse({'errno': '0', 'message': '2'})

    # 获取规定的上下班时间呢

    morning_working_time = staff.jobs_time
    afternoon_rest_time = staff.rest_time

    if morning_working_time >= nowTime:
        if len(attendance_time) == 1:
            work = dict()
            work['time'] = attendance_time[0].sign_in_time
            work['site'] = attendance_site
            work['status'] = attendance_time[0].sign_in_explain
            return JsonResponse({'errno': '0', 'message': '4', 'work': work})
        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile,
                                            sign_in_explain='正常')
            except Exception:
                return JsonResponse({'errno': '1', 'message': '打卡失败'})
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '正常'
            return JsonResponse({'errno': '0', 'message': '3', 'work': work})


    elif afternoon_rest_time > nowTime > morning_working_time:
        if len(attendance_time) == 1:
            work = dict()
            work['time'] = attendance_time[0].sign_in_time
            work['site'] = attendance_site
            work['status'] = attendance_time[0].sign_in_explain
            return JsonResponse({'errno': '0', 'message': '4', 'work': work})

        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile,
                                            sign_in_explain='迟到')
            except Exception:
                return JsonResponse({'errno': '2', 'message': '打卡失败'})
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '迟到'

            return JsonResponse({'errno': '0', 'message': '3', 'work': work})


    elif nowTime >= afternoon_rest_time:
        if len(attendance_time) == 1:
            work = dict()
            work['time'] = attendance_time[0].sign_in_time
            work['site'] = attendance_site
            work['status'] = attendance_time[0].sign_in_explain
            return JsonResponse({'errno': '0', 'message': '4', 'work': work})
        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile,
                                            sign_in_explain='迟到')
            except Exception:
                return JsonResponse({'errno': '3', 'message': '打卡失败'})
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '迟到'
            return JsonResponse({'errno': '0', 'message': '3', 'work': work})


# 打卡球post打卡
def sign_in_post(request, user_profile):
    # 获取规定的上下班时间呢
    req = request.body
    req = req.decode()
    req = json.loads(req)

    # aaa = req.get('aaa')
    # bbb = req.get('bbb')

    my_longitude = req.get('longitude')
    my_latitude = req.get('latitude')
    if not all([my_longitude, my_latitude]):
        return JsonResponse({'errno': '1', 'message': '地理位置错误'})

    try:
        jobs_time = user_profile.atendance.jobs_time
        rest_time = user_profile.atendance.rest_time
    except Exception:
        return JsonResponse({'errno': '05', 'message': '获取考勤组失败，请联系管理员设置考勤组'})
    longitude = user_profile.atendance.longitude
    latitude = user_profile.atendance.latitude
    my_longitude = float(my_longitude)
    my_latitude = float(my_latitude)
    longitude = float(longitude)
    latitude = float(latitude)
    # 计算距离
    distance = haversine(longitude, latitude, my_longitude, my_latitude)
    # 默认距离
    default_distance = user_profile.atendance.default_distance

    if distance > default_distance:
        return JsonResponse({'errno': '02', 'message': '未进入考勤范围，请选择外勤'})

    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    year = stockpile_time.year
    month = stockpile_time.month
    day = stockpile_time.day
    nowtime = stockpile_time.time()
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8) + timedelta(hours=8)

    # stockpile_time = datetime.strptime(aaa, '%Y-%m-%d %H:%M:%S')
    # year = stockpile_time.year
    # month = stockpile_time.month
    # day = stockpile_time.day
    # nowTime = datetime.strptime(bbb, '%H:%M:%S').time()

    attendance_time = ZgAttendance.objects.filter(sign_in_time__year=str(year),
                                                  sign_in_time__month=str(month),
                                                  sign_in_time__day=str(day))
    attendance_site = user_profile.atendance.site

    if str(attendance_time[0].sign_in_time) != '1970-01-01 00:00:00+00:00' and str(
        attendance_time[0].sign_off_time) != '1970-01-01 00:00:00+00:00':
        return JsonResponse({'errno': '01', 'message': '今日已打卡'})

    if jobs_time >= nowtime:
        if len(attendance_time) == 1:
            attendance_time[0].sign_off_time = stockpile_time
            attendance_time[0].sign_off_explain = '早退'
            attendance_time[0].save()
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '早退'

            return JsonResponse({'errno': '04', 'message': '下班打卡成功', 'work': work})

        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile, sign_in_explain='正常')
            except Exception:
                return JsonResponse({'errno': '3', 'message': '打卡失败'})
            return JsonResponse({'errno': '03', 'message': '上班打卡成功'})

    elif rest_time > nowtime > jobs_time:

        if len(attendance_time) == 1:
            attendance_time[0].sign_off_time = stockpile_time
            attendance_time[0].sign_off_explain = '早退'
            attendance_time[0].save()
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '早退'
            return JsonResponse({'errno': '04', 'message': '打卡成功,您已早退', 'work': work})
        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile, sign_in_explain='迟到')
            except Exception:
                return JsonResponse({'errno': '4', 'message': '打卡失败'})
            return JsonResponse({'errno': '03', 'message': '打卡成功,您已迟到,下次早点来哦'})

    elif nowtime >= rest_time:
        if len(attendance_time) == 1:
            attendance_time[0].sign_off_time = stockpile_time
            attendance_time[0].sign_off_explain = '正常'
            attendance_time[0].save()
            work = dict()
            work['time'] = stockpile_time
            work['site'] = attendance_site
            work['status'] = '正常'

            return JsonResponse({'errno': '04', 'message': '下班打卡成功', 'work': work})

        elif len(attendance_time) == 0:
            try:
                # 储存打卡时间
                ZgAttendance.objects.create(sign_in_time=stockpile_time, user_name=user_profile, sign_in_explain='迟到')
            except Exception:
                return JsonResponse({'errno': '5', 'message': '打卡失败'})
            return JsonResponse({'errno': '03', 'message': '打卡成功,您已迟到,下次早点来哦'})


# 打卡页考勤信息
def attendance_data(request, user_profile):
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    year = stockpile_time.year
    month = stockpile_time.month
    try:
        a = user_profile.atendance.jobs_time
    except Exception:
        return JsonResponse({'errno': '4', 'message': '暂无考勤组，请联系管理员设置考勤组'})

    try:
        attendance_count = ZgAttendance.objects.filter(user_name=user_profile, sign_in_time__year=year,
                                                       sign_in_time__month=month,
                                                       sign_off_time__year=year,
                                                       sign_off_time__month=month
                                                       , sign_in_explain='正常',
                                                       sign_off_explain='正常'
                                                       ).count()
    except Exception:
        return JsonResponse({'errno': '2', 'message': '获取本月外勤天数失败'})

    try:
        # 迟到
        overdue_count = ZgAttendance.objects.filter(user_name=user_profile,
                                                    sign_in_time__year=year,
                                                    sign_in_time__month=month,
                                                    sign_in_explain='迟到').count()
    except Exception:
        return JsonResponse({'errno': '3', 'message': '获取迟到天数失败'})

    # 缺卡天数
    absenteeism_count = ZgAttendance.objects.filter(
        Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile, sign_off_time__month=month,
          sign_off_time__year=year) |

        Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile, sign_in_time__month=month,
          sign_in_time__year=year) |

        Q(sign_in_time__contains='1970-01-01 00:00:00+00', user_name=user_profile,
          sign_off_time__contains='1970-01-01 00:00:00+00')).count()

    attendance_name = user_profile.atendance.attendance_name
    jobs_time = user_profile.atendance.jobs_time
    rest_time = user_profile.atendance.rest_time
    longitude = user_profile.atendance.longitude
    latitude = user_profile.atendance.latitude
    default_distance = user_profile.atendance.default_distance

    return JsonResponse(
        {'errno': '0', 'message': '成功', 'default_distance': default_distance, 'latitude': latitude,
         'longitude': longitude, 'rest_time': rest_time,
         'jobs_time': jobs_time, 'attendance_name': attendance_name,
         'attendance_count': attendance_count, 'overdue_count': overdue_count,
         'absenteeism_count': absenteeism_count})

# 重新定位
def attendance_location(request, user_profile):
    my_longitude = request.GET.get('longitude')
    my_latitude = request.GET.get('latitude')
    longitude = user_profile.atendance.longitude
    latitude = user_profile.atendance.latitude
    my_longitude = float(my_longitude)
    my_latitude = float(my_latitude)
    longitude = float(longitude)
    latitude = float(latitude)
    # 计算距离
    distance = haversine(longitude, latitude, my_longitude, my_latitude)
    # 默认距离
    default_distance = user_profile.atendance.default_distance

    if distance > default_distance:
        return JsonResponse({'errno': '0', 'message': '1'})
    else:
        return JsonResponse({'errno': '0', 'message': '2'})


# 外勤页面
def outside_sign_in_view(request, user_profile):
    my_longitude = request.GET.get('longitude')
    my_latitude = request.GET.get('latitude')
    longitude = user_profile.atendance.longitude
    latitude = user_profile.atendance.latitude
    my_longitude = float(my_longitude)
    my_latitude = float(my_latitude)
    longitude = float(longitude)
    latitude = float(latitude)
    # 计算距离
    distance = haversine(longitude, latitude, my_longitude, my_latitude)
    # 默认距离
    default_distance = user_profile.atendance.default_distance

    if distance < default_distance:
        return JsonResponse({'errno': '1', 'message': '您当前在考勤范围内'})

    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    year = stockpile_time.year
    month = stockpile_time.month
    day = stockpile_time.day
    outsides = ZgOutsideWork.objects.filter(user_name=user_profile,
                                            sign_in_time__year=year,
                                            sign_in_time__month=month,
                                            sign_in_time__day=day)
    outside_list = list()
    for outside in outsides:
        outside_dict = dict()
        outside_dict['sign_in_time'] = outside.sign_in_time
        outside_dict['longitude'] = outside.longitude
        outside_dict['latitude'] = outside.latitude
        outside_dict['site'] = outside.site
        outside_dict['img_url'] = outside.img_url
        outside_dict['notes'] = outside.notes
        outside_dict['type'] = outside.outsidework_notes
        outside_list.append(outside_dict)

    return JsonResponse({'errno': '0', 'message': '成功', 'outside_list': outside_list})

# 外勤打卡
def outside_sign_in(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    type = req.get('type')
    longitude = req.get('longitude')
    latitude = req.get('latitude')
    site = req.get('site')

    notes = req.get('notes')
    img_url = req.get('img_url')

    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)

    if not all([type, longitude, latitude, site]):
        return JsonResponse({'errno': '1', 'message': '缺少必要参数'})
    # try:
    ZgOutsideWork.objects.create(outsidework_notes=type, longitude=longitude, latitude=latitude, site=site,
                                     notes=notes,user_name=user_profile,
                                     img_url=img_url, sign_in_time=stockpile_time)
    # except Exception:
    #     return JsonResponse({'errno': '2', 'message': '外勤打卡失败'})

    return JsonResponse(
        {'errno': '0', 'message': '成功', 'type': type, 'longitude': longitude, 'latitude': latitude, 'site': site,
         'notes': notes, 'img_url': img_url, 'stockpile_time': stockpile_time})
