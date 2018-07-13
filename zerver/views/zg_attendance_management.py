from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgAttendance, ZgStaff, ZgOutsideWork, ZgDepartmentAttendance
from tools.zg_tools.zg_attendance_tools import haversine
from django.db.models import Q
import datetime, calendar
import json

# 当前时间'%Y-%m-%d %H:%M:%S'
year = datetime.datetime.utcnow().strftime('%Y')
month = datetime.datetime.utcnow().strftime('%m')
day = datetime.datetime.utcnow().strftime('%d')

nowTime = datetime.datetime.utcnow().strftime('%H:%M')
nowTime = datetime.datetime.strptime(nowTime, '%H:%M')
# 需要储存的时间
stockpile_time = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

number = calendar.monthrange(nowTime.year, nowTime.month)[1]


# 签到函数
@zulip_login_required
def sign_in(request):
    if request.method == 'POST':
        # 获取及用户名
        my_user_name = '小张'
        staff = ZgStaff.objects.get(user_name=my_user_name)
        # 获取规定的上下班时间呢
        morning_working_time = staff.ZgDepartmentZgDepartmentAttendance.forenoon_working
        afternoon_rest_time = staff.ZgDepartmentZgDepartmentAttendance.afternoon_rest
        name_obj = ZgStaff.objects.filter(user_name=my_user_name)
        name_obj = name_obj[0]

        attendance_time = ZgAttendance.objects.filter(user_name=my_user_name, attendance_working_time__year=year,
                                                      attendance_working_time__month=month,
                                                      attendance_working_time__day=day)


        if morning_working_time >= nowTime:
            if attendance_time:
                return JsonResponse({'errno': '9', 'message': '签到成功请勿重复打卡'})

            try:
                # 储存打卡时间
                ZgAttendance.objects.create(attendance_working_time=stockpile_time, user_name=name_obj)
            except Exception:
                return JsonResponse({'errno': '3', 'message': '打卡失败'})

            return JsonResponse({'errno': '0', 'message': '打卡成功'})

        elif afternoon_rest_time > nowTime > morning_working_time:

            if attendance_time:

                try:
                    # 储存打卡时间
                    attendance_time[0].working_explain = '早退'
                    attendance_time[0].closing_time = stockpile_time
                    attendance_time.save()

                except Exception:
                    return JsonResponse({'errno': '4', 'message': '打卡失败'})

                return JsonResponse({'errno': '0', 'message': '打卡成功,您已早退'})

            try:
                # 储存打卡时间
                ZgAttendance.objects.create(attendance_working_time=stockpile_time, user_name=name_obj,
                                            working_explain='迟到')

            except Exception:
                return JsonResponse({'errno': '5', 'message': '打卡失败'})

            return JsonResponse({'errno': '0', 'message': '打卡成功,您已迟到'})


        elif nowTime >= afternoon_rest_time:
            if attendance_time.closing_time != '1970-01-01':
                return JsonResponse({'errno': '10', 'message': '签退成功请勿重复签退'})

            attendance_time.closing_time = stockpile_time
            attendance_time.save()
            return JsonResponse({'errno': '0', 'message': '下班打卡成功'})


    elif request.method == 'GET':
        my_user_name = request.user
        # 获取经纬度和时间以及用户名
        my_longitude = float(request.GET.get('longitude'))
        my_latitude = float(request.GET.get('latitude'))

        staff = ZgStaff.objects.get(user_name=my_user_name)
        # 获取设置地点
        longitude = staff.ZgDepartmentAttendance.longitude
        latitude = staff.ZgDepartmentAttendance.latitude
        # 计算距离
        distance = haversine(longitude, latitude, my_latitude, my_longitude)
        # 默认距离
        default_distance = staff.ZgDepartmentAttendance.default_distance

        if not all([my_longitude, my_latitude]):
            return JsonResponse({'errno': '7', 'message': '地理位置错误'})

        if distance > default_distance:
            return JsonResponse({'errno': '0', 'message': '未进入考勤范围，是否选择外勤'})

        else:
            staff = ZgStaff.objects.get(user_name=my_user_name)
            # 获取规定的上下班时间呢
            morning_working_time = staff.ZgDepartmentAttendance.forenoon_working
            afternoon_rest_time = staff.ZgDepartmentAttendance.afternoon_rest

            if morning_working_time >= nowTime:
                return JsonResponse({'errno': '0', 'message': '打卡'})

            elif afternoon_rest_time > nowTime > morning_working_time:
                attendance_time = ZgAttendance.objects.filter(user_name=my_user_name,
                                                              attendance_working_time__year=year,
                                                              attendance_working_time__month=month,
                                                              attendance_working_time__day=day).count()

                if attendance_time == 1:
                    return JsonResponse({'errno': '0', 'message': '早退'})

                return JsonResponse({'errno': '0', 'message': '迟到'})

            elif nowTime >= afternoon_rest_time:
                return JsonResponse({'errno': '0', 'message': '下班'})


# 个人月考勤信息
@zulip_login_required
def solo_month_attendance(request):
    # 打卡时间'%Y-%m-%d %H:%M:%S'
    if request.method == 'GET':
        user_name = request.user
        try:
            attendance_time = ZgAttendance.objects.filter(user_name=user_name, attendance_working_time__year=year,
                                                          attendance_working_time__month=month,
                                                          closing_time__year=year,
                                                          closing_time__month=month
                                                          ).count()

            outsideWork_time = ZgOutsideWork.objects.filter(user_name=user_name, working_time__year=year,
                                                            working_time__month=month).count()
            # 迟到
            overdue_time = ZgAttendance.objects.filter(user_name=user_name, attendance_working_time__year=year,
                                                       attendance_working_time__month=month,
                                                       working_explain='迟到').count()
            # 缺卡天数
            absenteeism_time = ZgAttendance.objects.filter(
                Q(attendance_working_time='1970-01-01', user_name=user_name, ) | Q(closing_time='1970-01-01',
                                                                                   user_name=user_name)).count()

            # 出勤天数
            participat_time = attendance_time + outsideWork_time

        except Exception:
            return JsonResponse({'errno': '1', 'message': '获取考勤信息失败'})

        return JsonResponse(
            {'errno': '0', 'message': '获取成功', 'participat_time': participat_time, 'absenteeism_time': absenteeism_time,
             'overdue_time': overdue_time})


# 考勤组设置信息展示
@zulip_login_required
def show_department_setting(request):
    if request.method == 'GET':
        user_name = request.user
        try:

            user = ZgStaff.objects.get(user_name=user_name)
            dt = user.department
            name = dt.department  # 考勤组名
            time1 = dt.forenoon_working
            afternoon_rest = dt.afternoon_rest
            department_time = str(time1) + '-' + str(afternoon_rest)  # 上下班时间
            notes = dt.notes  # 地理位置
            attendance_working = ZgAttendance.objects.filter(user_name=user_name,
                                                             attendance_working_time__year=year,
                                                             attendance_working_time__month=month,
                                                             attendance_working_time__day=day
                                                             )
        except Exception:
            return JsonResponse({'errno': '2', 'message': '获取考勤组信息失败'})
        if not attendance_working:
            attendance_working = '缺卡'
        return JsonResponse(
            {'errno': '0', 'message': '获取考勤组信息成功', 'name': name, 'department_time': department_time, 'notes': notes,
             'attendance_working_time': attendance_working})


# 个人今日外勤信息
@zulip_login_required
def solo_today_outside(request):
    stockpile_time_1 = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    if request.method == 'GET':
        my_user_name = request.name
        field_list = ZgDepartmentAttendance.object.filter(attendance_working_time=stockpile_time_1,
                                                          user_name=my_user_name,
                                                          )

        field_dict_list = []
        for field in field_list:
            my_fieldl_dict = {'working_time': field.working_time, 'working_imgurl': field.working_imgurl,
                              'notes': field.notes, 'site': field.site}

            field_dict_list.append(my_fieldl_dict)

        return JsonResponse({'errno': '0', 'message': '获取成功', 'field_dict_list': field_dict_list})


# 外勤签到签退
def outside_attendance(request):
    if request.method == 'post':
        my_user_name = request.name
        # 地点
        site = request.POST.get('site')
        # 经纬度/
        longitude = request.POST.get('longitude')
        latitude = request.POST.get('latitude')
        # 图片
        working_imgurl = request.POST.get('working_imgurl')
        # 打卡说明/
        notes = request.POST.get('notes')
        # 状态
        outsideWork_notes = request.POST.get('outsideWork_notes')

        if not all([site, longitude, outsideWork_notes, latitude]):
            return JsonResponse({'errno': '8', 'message': '缺少必要参数'})

        # 图片/

        add = ZgOutsideWork(user_name=my_user_name, site=site, longitude=longitude, latitude=latitude,
                            outsideWork_notes=outsideWork_notes, notes=notes)

        add.save()
        ZgAttendance.object.create(working_explain='外勤')


# 团队，日考勤信息
def team_day_attendance(request):
    # 需要传入参数时间attendance_time
    if request.method == 'GET':
        my_user_name = request.user
        stockpile_time_1 = request.GET.get('attendance_time')

        if not stockpile_time_1:
            stockpile_time_1 = datetime.datetime.utcnow().strftime('%Y-%m-%d')

        user = ZgStaff.object.get(user_name=my_user_name)
        jurisdiction = user.jurisdiction
        # 部门名
        department = user.department
        # 获取相同部门内权限小于目标权限的对象/
        be_late_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                              ZgAttendance__working_explain='迟到',
                                              attendance_working_time=stockpile_time_1)

        not_attendance_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                                     attendance_working_time=stockpile_time_1,
                                                     ZgAttendance__working_explain='缺卡')

        # 外勤/
        outside_attendance_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                                         ZgOutsideWork__working_time=stockpile_time_1)

        # 应到人数
        due = ZgStaff.object.filter(department=department).count()
        # 实际到达
        practical = due - not_attendance_list1.count()

        be_late_list = []
        for be_late in be_late_list1:
            be_late_list.append(be_late.user_name)

        not_attendance_list = []
        for not_attendance in not_attendance_list1:
            not_attendance_list.append(not_attendance)

        outside_attendance_list = []
        for outside_attendance in outside_attendance_list1:
            outside_attendance_list.append(outside_attendance)

        return JsonResponse({'department': department, 'practical': practical, 'due': due, 'be_late_list': be_late_list,
                             'not_attendance_list': not_attendance_list,
                             'outside_attendance_list': outside_attendance_list})


# 团队，日缺卡信息
def team_day_not_attendance(request):
    if request.method == 'GET':
        my_user_name = request.user
        stockpile_time_1 = request.GET.get('attendance_time')

        if not stockpile_time_1:
            stockpile_time_1 = datetime.datetime.utcnow().strftime('%Y-%m-%d')

        user = ZgStaff.object.get(user_name=my_user_name)
        jurisdiction = user.jurisdiction
        # 部门名
        department = user.department

        not_attendance_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                                     attendance_working_time=stockpile_time_1,
                                                     ZgAttendance__working_explain='缺卡')
        not_attendance_list = []
        for not_attendance in not_attendance_list1:
            not_attendance_list.append(not_attendance)

        amount = len(not_attendance_list)
        return JsonResponse({'amount': amount, 'not_attendance_list': not_attendance_list})


# 团队，日外勤清单
def team_outside_day(request):
    if request.method == 'GET':
        my_user_name = request.user
        stockpile_time_1 = request.GET.get('attendance_time')

        if not stockpile_time_1:
            stockpile_time_1 = datetime.datetime.utcnow().strftime('%Y-%m-%d')

        user = ZgStaff.object.get(user_name=my_user_name)
        jurisdiction = user.jurisdiction
        # 部门名
        department = user.department

        # 外勤/
        outside_attendance_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                                         ZgOutsideWork__working_time=stockpile_time_1)

        outside_attendance_list = []
        for outside_attendance in outside_attendance_list1:
            outside_attendance_list.append(outside_attendance)

        amount = len(outside_attendance_list)

        return JsonResponse({'amount': amount, 'outside_attendance_list': outside_attendance_list})


# 团队，日迟到清单
def team_day_belat(request):
    if request.method == 'GET':
        my_user_name = request.user
        stockpile_time_1 = datetime.datetime.utcnow().strftime('%Y-%m-%d')

        user = ZgStaff.object.get(user_name=my_user_name)
        jurisdiction = user.jurisdiction
        department = user.department
        be_late_list1 = ZgStaff.object.filter(jurisdiction__lt=jurisdiction, department=department,
                                              ZgAttendance__working_explain='迟到',
                                              attendance_working_time=stockpile_time_1)

        be_late_list = []
        for be_late in be_late_list1:
            be_late_list.append(be_late.user_name)

        amount = len(be_late_list)

        return JsonResponse({'be_late_list': be_late_list, 'amount': amount
                             })


# # 考勤日历
def attendance_calendar(request):
    if request.method == 'GET':
        my_user_name = request.user

        query_name = request.GET.get('query_name')

        if not query_name:
            query_name = my_user_name

        normal_obj = ZgAttendance.object.filter(user_name=query_name, attendance_working_time__year=year,
                                                attendance_working_time__month=month, working_explain='正常')

        normal_list = []
        for normal in normal_obj:
            normal_list.append(datetime.datetime.strptime(normal.attendance_working_time, '%d'))

        absenteeism_obj = ZgAttendance.object.filter(user_name=query_name, attendance_working_time__year=year,
                                                     attendance_working_time__month=month, working_explain='缺卡')

        absenteeism_list = []
        for absenteeism in absenteeism_obj:
            absenteeism_list.append(datetime.datetime.strptime(absenteeism.attendance_working_time, '%d'))

        belat_obj = ZgAttendance.object.filter(user_name=query_name, attendance_working_time__year=year,
                                               attendance_working_time__month=month, working_explain='迟到')
        belat_list = []
        for belat in belat_obj:
            belat_list.append(datetime.datetime.strptime(belat.attendance_working_time, '%d'))

        leave_early_obj = ZgAttendance.object.filter(user_name=query_name, attendance_working_time__year=year,
                                                     attendance_working_time__month=month, working_explain='早退')
        leave_early_list = []
        for leave_early in leave_early_obj:
            leave_early_list.append(datetime.datetime.strptime(leave_early.attendance_working_time, '%d'))

        # ZgAttendance.object.filter(user_name=query_name, attendance_working_time__year=year,
        #                            attendance_working_time__month=month,
        #                            working_explain='请假')

        # 外勤
        outside_obj = ZgOutsideWork.object.filter(user_name=query_name, working_time__year=year,
                                                  working_time__month=month, )
        # 外勤列表
        outside_list = []
        for outside in outside_obj:
            outside_time = datetime.datetime.strptime(outside.working_time, '%d')
            if outside_time not in outside_list:
                outside_list.append(outside)

        return JsonResponse(
            {'errno': 0, 'messang': '获取成功', 'normal_list': normal_list, 'absenteeism_list': absenteeism_list,
             'belat_list': belat_list, 'leave_early_list': leave_early_list, 'outside_list': outside_list})

# def add_department_setting(request):
#
#     if request.method=='POST':
