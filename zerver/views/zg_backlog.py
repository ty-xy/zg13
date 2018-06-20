from zerver.models import Backlog, BacklogAccessory, UpdateBacklog, Statement, StatementBacklog, StatementAccessory, \
    StatementState, UserProfile
from django.http import JsonResponse, HttpResponse
import datetime, time, json, calendar

import re


#
#


#
#
# # 获取频道
# #     获取所有频道name返回给前端
#
#
# # 发送-频道
# #     获取该频道内所有人的id 添加到周报发送人的id内
#
#
#
# # 发送已读未读
# #     获取发送人是我的状态为t和f的信息
#
#
#
# # 日志助手-我发出的
# #     获取我所有的周报倒叙，返回给前端
#
#
#
# # 日志助手我收到的
# #     查询周报发送报表状态内所有的邮箱=我的
#
#
# # 查看我收到的
# #     传入日志id
# #     通过日志id获取
#
#
# # 日志助手消息数量
# #     寻发送状态栏为F的报表iduser=myuser的数量
#
#

# # 获取个人
# #     获取所有人原name和id
def person_list(request):
    if request.method == "GET":
        user_list = UserProfile.objects.all()
        person_list = list()
        for user in user_list:
            a = {}
            user_name = user.full_name
            user_avatar = user.avatar_source
            a['user_name'] = user_name
            a['user_avatar'] = user_avatar
            a["user_id"] = user.id
            person_list.append(a)
        return JsonResponse({'errno': 0, 'message': '获取数据成功', 'person_list': person_list})

# 报表
def table_view(request):
    if request.method == 'POST':
        user = str(request.user)
        user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)
        req = request.body
        req = req.decode()
        req = json.loads(req)
        accomplish = req.get('accomplish')
        overdue = req.get("overdue")
        underway = req.get('underway')
        date_type = req.get('date_type')
        backlogs_list = req.get('backlogs_list')
        statement_accessory_list = req.get('statement_accessory_list')
        send = req.get('send_list')
        if not accomplish:
            return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
        try:
            generate_time = time.time()
            a = Statement(user=user, generate_time=generate_time, accomplish=accomplish, overdue=overdue,
                          underway=underway,
                          types=date_type)
            a.save()

            if backlogs_list:
                backlogs_list = backlogs_list.strip(',').split(',')
                for backlog_id in backlogs_list:
                    StatementBacklog.objects.create(statement_id=a, backlog_id=backlog_id)

            if statement_accessory_list:
                statement_accessory_list = statement_accessory_list.strip(',').split(',')
                for statement_accessory_url in statement_accessory_list:
                    StatementAccessory.objects.creat(statement_accessory_url=statement_accessory_url, statement_id=a)

            if send:
                send = send.strip(',').split(',')
                for staff in send:
                    StatementState.objects.creat(statement_id=a, staff=staff)
        except Exception:
            return JsonResponse({'errno': 2, 'message': "储存周报失败"})
        return JsonResponse({'errno': 0, 'message': "成功"})



# 一键生成
def generate_table(request):
    now = int(time.time())
    if request.method == "GET":
        user = str(request.user)
        user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)
        date_type = request.GET.get('date_type')

        if not all([user, date_type]):
            return JsonResponse({'errno': 1, 'message': "缺少参数"})

        if date_type == 'month':

            day_now = time.localtime()
            day_begin = '%d-%02d-01' % (day_now.tm_year, day_now.tm_mon)
            wday, monthRange = calendar.monthrange(day_now.tm_year,
                                                   day_now.tm_mon)
            day_end = '%d-%02d-%02d' % (day_now.tm_year, day_now.tm_mon, monthRange)

            day_begin = day_begin + " " + '00:00:00'
            day_end = day_end + " " + "23:59:00"

            day_begin = time.mktime(time.strptime(day_begin, '%Y-%m-%d %H:%M:%S'))
            day_end = time.mktime(time.strptime(day_end, '%Y-%m-%d %H:%M:%S'))

            month_backlog_list = Backlog.objects.filter(user=user, create_time__range=(day_begin, day_end)).order_by(
                '-id')
            month_accomplish_list = []
            month_overdue_list = []
            month_underway_list = []

            for month_backlog in month_backlog_list:
                if month_backlog.state == 0:
                    month_accomplish_list.append(month_backlog.task)

                if month_backlog.over_time < now and month_backlog.state == 2:
                    month_overdue_list.append(month_backlog.task)

                if month_backlog.over_time > now and month_backlog.state == 2:
                    month_underway_list.append(month_backlog.task)

            return JsonResponse(
                {'errno': 0, 'message': "成功", 'accomplish_list': month_accomplish_list, 'overdue_list':
                    month_overdue_list, "underway_list": month_underway_list})

        elif date_type == 'week':

            today = datetime.date.today()
            monday = datetime.date.today() - datetime.timedelta(days=datetime.date.today().weekday())
            sunday = today + datetime.timedelta(6 - today.weekday())
            a = time.mktime(monday.timetuple())
            b = time.mktime(sunday.timetuple())
            week_backlog_list = Backlog.objects.filter(user=user, create_time__range=(a, b)).order_by('-id')
            week_accomplish_list = []
            week_overdue_list = []
            week_underway_list = []

            for month_backlog in week_backlog_list:
                if month_backlog.state == 0:
                    week_accomplish_list.append(month_backlog.task)

                if month_backlog.over_time < now and month_backlog.state == 2:
                    week_overdue_list.append(month_backlog.task)

                if month_backlog.over_time > now and month_backlog.state == 2:
                    week_underway_list.append(month_backlog.task)

            return JsonResponse(
                {'errno': 0, 'message': "成功", 'accomplish_list': week_accomplish_list, 'overdue_list':
                    week_overdue_list, "underway_list": week_underway_list})

        elif date_type == "day":
            a = int(time.mktime(time.strptime(str(datetime.date.today()), '%Y-%m-%d')))
            b = int(time.mktime(time.strptime(str(datetime.date.today()
                                                  + datetime.timedelta(days=1)), '%Y-%m-%d'))) - 1

            day_backlog_list = Backlog.objects.filter(user=user, create_time__range=(a, b)).order_by('-id')

            day_accomplish_list = []
            day_overdue_list = []
            day_underway_list = []

            for month_backlog in day_backlog_list:
                if month_backlog.state == 0:
                    day_accomplish_list.append(month_backlog.task)

                if month_backlog.over_time < now and month_backlog.state == 2:
                    day_overdue_list.append(month_backlog.task)

                if month_backlog.over_time > now and month_backlog.state == 2:
                    day_underway_list.append(month_backlog.task)

            return JsonResponse(
                {'errno': 0, 'message': "成功", 'accomplish_list': day_accomplish_list, 'overdue_list':
                    day_overdue_list, "underway_list": day_underway_list})




# 待办事项列表
def backlogs_view_g(request):

    user = str(request.user)
    import re
    user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)
    # 获取当前时间戳
    now = int(time.time())
    try:
        backlogs_list = Backlog.objects.filter(user=user, state=2, is_delete='f').order_by('-id')
    except Exception:
        return JsonResponse({'errno': 1, 'message': '获取数据失败'})
    # 过期
    past_due_list = []
    backlog_list = []

    for bl in backlogs_list:
        if bl.over_time < now:
            a = {}
            a['backlog_id'] = bl.id
            time_array = time.localtime(bl.create_time)
            create_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            a['create_time'] = create_time
            time_array = time.localtime(bl.over_time)
            over_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            a['over_time'] = over_time
            a['task'] = bl.task
            a['task_details'] = bl.task_details
            a['state'] = bl.state
            accessory_list = BacklogAccessory.objects.filter(backlog_id=bl.id, is_delete='f')
            if accessory_list:
                accessory_dict = {}
                for accessory in accessory_list:
                    accessory_dict[accessory.id] = accessory.accessory_url
                a["accessory_dict"] = accessory_dict
            past_due_list.append(a)

        else:
            b = {}
            b['id'] = bl.id

            time_array = time.localtime(bl.create_time)
            create_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            b['create_time'] = create_time

            time_array = time.localtime(bl.over_time)
            over_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            b['over_time'] = over_time

            b['task'] = bl.task
            b['task_details'] = bl.task_details
            b['state'] = bl.state
            accessory_list = BacklogAccessory.objects.filter(backlog_id=bl.id, is_delete='f')

            if accessory_list:
                accessory_dict = {}
                for accessory in accessory_list:
                    accessory_dict[accessory.id] = accessory.accessory_url
                b["accessory_dict"] = accessory_dict
            backlog_list.append(b)

    return JsonResponse({'errno': 0, 'message': '成功', 'past_due_list': past_due_list, 'backlog_list': backlog_list})


def backlogs_view_po(request):
    import re
    user = str(request.user)
    user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)
    print('aaaaaaaaaaaaaa')

    req = request.body
    req = req.decode()
    req = json.loads(req)
    task = req.get('task')
    over_time = req.get('over_time')
    task_details = req.get('task_details')
    # 列表传
    accessory_url = req.get('accessory_list')
    create_time = req.get('create_time')

    if not create_time:
        create_time = int(time.time())

    if not all([task, over_time]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    over_time = int(over_time)
    create_time = int(create_time)
    if create_time > over_time:
        return JsonResponse({'errno': 3, 'message': '开始时间大于结束时间'})
    try:
        backlog = Backlog.objects.create(user=user, create_time=create_time, task=task,
                                         over_time=over_time, task_details=task_details
                                         )
        backlog_id = backlog.id
        if accessory_url:
            accessory_list = accessory_url.strip(',').split(',')
            for i in accessory_list:
                BacklogAccessory.objects.create(backlog_id=backlog, accessory_url=i)

        time_array = time.localtime(create_time)
        other_styley_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
        update_create_time = "%s创建了事项" % other_styley_time
        UpdateBacklog.objects.create(backlog_id=backlog, update_backlog=update_create_time)

    except ImportError:
        return JsonResponse({'errno': 2, 'message': '创建事项失败'})

    return JsonResponse({'errno': 0, 'message': '事项创建成功，记得如期完成哦', 'backlog_id': backlog_id})


def backlogs_view_d(request):

    req = request.body
    req = req.decode()
    req = json.loads(req)

    backlog_id = req.get('backlog_id')
    if not backlog_id:
        return JsonResponse({'errno': 2, 'message': '缺少参数'})

    try:
        backlog = Backlog.objects.get(id=backlog_id)
        backlog.is_delete = True
        backlog.save()
        a = BacklogAccessory.objects.filter(backlog_id=backlog_id, is_delete='f')
        for i in a:
            i.is_delete = True
            i.save()
    except Exception:
        return JsonResponse({'errno': 1, 'message': '删除失败'})

    return JsonResponse({'errno': 0, 'message': '删除成功'})


def backlogs_view_pu(request):
    now = int(time.time())
    time_array = time.localtime(now)
    uodate_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
    req = request.body
    req = req.decode()
    req = json.loads(req)
    put_id = req.get('backlogs_id')
    try:
        backlog = Backlog.objects.get(id=put_id)
        del req['backlogs_id']
        for re in req:
            if re == "create_time":
                if not req['create_time']:
                    return JsonResponse({'errno': 1, 'message': '创建时间不能为空'})
                backlog.create_time = int(req['create_time'])
                time_array = time.localtime(req['create_time'])
                other_style_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)

                updatetime = '%s修改了事项的开始时间为:%s' % (uodate_time, other_style_time)
                UpdateBacklog.objects.create(update_backlog=updatetime, backlog_id=backlog)

            if re == "over_time":
                if not req['over_time']:
                    return JsonResponse({'errno': 2, 'message': '结束时间不能为空'})
                backlog.over_time = int(req['over_time'])
                time_array = time.localtime(req['over_time'])
                other_style_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)

                updatetime = '%s修改了事项的完成时间为%s' % (uodate_time, other_style_time)

                UpdateBacklog.objects.create(update_backlog=updatetime, backlog_id=backlog)

            if re == "task":
                backlog.task = req['task']
                update_task = '%s修改事项为%s' % (uodate_time, req['task'])
                UpdateBacklog.objects.create(update_backlog=update_task, backlog_id=backlog)

            if re == 'accessory_dict':
                UpdateBacklog.objects.create(update_backlog="%s修改了附件" % uodate_time, backlog_id=backlog)
                for accessory_id in req['accessory_dict']:
                    if accessory_id == "0":
                        BacklogAccessory.objects.create(backlog_id=backlog,
                                                        accessory_url=req['accessory_dict']['0'])

                    else:
                        accessory = BacklogAccessory.objects.get(id=int(accessory_id))
                        if not req['accessory_dict'][accessory_id]:
                            accessory.is_delete = True
                        else:
                            accessory.accessory_url = req['accessory_dict'][accessory_id]
                        accessory.save()

            if re == 'task_details':
                backlog.task_details = req['task_details']
                update_task_details = "%s 修改事项详情为: %s" % (uodate_time, req['task_details'])
                UpdateBacklog.objects.create(update_backlog=update_task_details, backlog_id=backlog)

            if re == 'state':
                if req['state'] == 0:
                    if backlog.over_time < now:
                        backlog.state = req['state']
                        update_state = '%s逾期完成了事项' % uodate_time
                        UpdateBacklog.objects.create(update_backlog=update_state, backlog_id=backlog)

                    else:
                        backlog.state = req['state']
                        update_state = '%s完成了事项' % uodate_time
                        UpdateBacklog.objects.create(update_backlog=update_state, backlog_id=backlog)

                elif not req['state']:
                    req['state'] = 2
                    backlog.state = req['state']
        backlog.save()
    except Exception:
        return JsonResponse({'errno': 3, 'message': '保存数据失败'})
    return JsonResponse({'errno': 0, 'message': '成功'})





# 事项详情详情
def backlogs_details(request):
    if request.method == "GET":
        backlogs_id = request.GET.get('backlogs_id')
        try:

            backlogs = Backlog.objects.get(id=backlogs_id)
            update_backlog = UpdateBacklog.objects.filter(backlog_id=backlogs_id).order_by('-id')
            backlogs_accessory_list = BacklogAccessory.objects.filter(backlog_id=backlogs_id, is_delete='f')
        except Exception:
            return JsonResponse({'errno': 1, 'message': '获取事项详情失败'})

        update_backlog_list = []
        for i in update_backlog:
            update_backlog_list.append(i.update_backlog)

        backlogs_dict = {}
        backlogs_dict['id'] = backlogs.id
        backlogs_dict['create_time'] = backlogs.create_time
        backlogs_dict['over_time'] = backlogs.over_time
        backlogs_dict['task'] = backlogs.task
        backlogs_dict['task_details'] = backlogs.task_details
        backlogs_dict['state'] = backlogs.state
        accessory_list = {}
        for accessory in backlogs_accessory_list:
            accessory_list[accessory.id] = accessory.accessory_url

        backlogs_dict['accessory_list'] = accessory_list

        return JsonResponse(
            {'errno': 0, 'message': '成功', 'backlogs_dict': backlogs_dict, "update_backlog_list": update_backlog_list})


# 查看已完成事项
def accomplis_backlogs_view(request):
    if request.method == "GET":
        user = str(request.user)
        user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)

        page = request.GET.get('page')

        try:
            page = int(page)
            accomplis_backlogs_list = Backlog.objects.filter(user=user, state=0, is_delete='f').order_by('-id')
        except Exception:
            return JsonResponse({'errno': 1, 'message': '获取数据失败'})

        if page != 1:
            sum = (page - 1) * 20
            sum1 = page * 20
            accomplis_backlogs_list = accomplis_backlogs_list[sum:sum1]

        accomplis_backlogs_listss = []
        for accomplis_backlogs in accomplis_backlogs_list:

            a = {}
            a['id'] = accomplis_backlogs.id

            time_array = time.localtime(accomplis_backlogs.create_time)
            create_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            a['create_time'] = create_time

            time_array = time.localtime(accomplis_backlogs.over_time)
            over_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            a['over_time'] = over_time

            a['task'] = accomplis_backlogs.task
            a['task_details'] = accomplis_backlogs.task_details
            accessory_list = BacklogAccessory.objects.filter(backlog_id=accomplis_backlogs.id)
            if accessory_list:
                accessory_dict = {}
                for accessory in accessory_list:
                    accessory_dict[accessory.id] = accessory.accessory_url
                    a["accessory_dict"] = accessory_dict

            a['state'] = accomplis_backlogs.state
            accomplis_backlogs_listss.append(a)

        return JsonResponse({'errno': 0, 'message': '成功', 'accomplis_backlogs_list': accomplis_backlogs_listss})
