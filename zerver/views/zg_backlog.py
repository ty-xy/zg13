from zerver.models import Backlog, BacklogAccessory, UpdateBacklog, Statement, StatementBacklog, StatementAccessory, \
    StatementState, UserProfile, Stream
from django.http import JsonResponse, HttpResponse, HttpRequest
import datetime, time, json, calendar

import re

# 获取频道内的所有用户
from zerver.lib.actions import get_user_ids_for_streams


# 已读未读
def state_view(request, user_profile):
    table_id = request.GET.get('table_id')
    states = request.GET.get('state')

    if not all([table_id, states]):
        return JsonResponse({{'errno': 2, 'message': "缺少必要参数", }})
    if states == 't':
        try:
            read_table = StatementState.objects.filter(statement_id=table_id, state='t').order_by('-id')
        except Exception:
            return JsonResponse({'errno': 1, 'message': "获取已读信息失败", })
        user_list = []
        for table in read_table:
            user_dict = {}
            user = UserProfile.objects.get(id=table.staff)
            user_dict['avatar'] = user.avatar_source
            user_dict['user_name'] = user.full_name
            user_dict['table_id'] = table_id
            user_list.append(user_dict)
        return JsonResponse({'errno': 0, 'message': "成功", 'user_list': user_list})
    elif states == 'f':
        try:
            read_table = StatementState.objects.filter(statement_id=table_id, state='t').order_by('-id')
        except Exception:
            return JsonResponse({'errno': 3, 'message': "获取已读信息失败", })
        user_list = []
        for table in read_table:
            user_dict = {}
            user = UserProfile.objects.get(id=table.staff)
            user_dict['avatar'] = user.avatar_source
            user_dict['user_name'] = user.full_name
            user_dict['table_id'] = table_id

        return JsonResponse({'errno': 0, 'message': "成功", 'user_list': user_list})


# 查看自己和他人的报表
def look_table(request, user_profile):
    table_id = request.GET.get('table_id')
    if not table_id:
        return JsonResponse({{'errno': 2, 'message': "缺少必要参数", }})
    try:

        statement = Statement.objects.get(id=table_id)
        if statement.user != user_profile.email:
            a = StatementState.objects.get(statement_id=statement)
            a.state = True
            a.save()

        statement_backlogs_list = StatementBacklog.objects.filter(statement_id=statement).order_by('-id')

        user = UserProfile.objects.get(email=statement.user)

        table_dict = {}
        table_dict['avatar'] = user.avatar_source
        table_dict['user_name'] = user.full_name
        table_dict['generate_time'] = statement.generate_time
        table_dict['accomplish'] = statement.accomplish
        table_dict['overdue'] = statement.overdue
        table_dict['underway'] = statement.underway
        backlog_list = []
        table_dict['backlog_list'] = backlog_list
        for statement_backlogs in statement_backlogs_list:
            backlogs_dict = {}
            backlogs = Backlog.objects.get(id=statement_backlogs.backlog_id)
            backlogs_dict['task'] = backlogs.task
            backlogs_dict['over_time'] = backlogs.over_time
            backlog_list.append(backlogs_dict)

        url_list = []
        table_dict['url_list'] = url_list
        accessory_list = StatementAccessory.objects.filter(statement_id=table_id, is_delete='f').order_by('-id')
        for accessory in accessory_list:
            accessory_dict = {}
            accessory_dict['url'] = accessory.statement_accessory_url
            accessory_dict['size'] = accessory.accessory_size
            accessory_dict['name'] = accessory.accessory_name
            url_list.append(accessory_dict)

    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取数据失败", })

    return JsonResponse({'errno': 0, 'message': "获取数据成功", 'table_dict': table_dict})


# web接收到日志
def web_my_receive(request, user_profile):
    try:
        statement_state_list = StatementState.objects.filter(staff=user_profile.id).order_by('-id')
    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        receive_table_list = []
        for statement_state in statement_state_list:
            web_my_receive_dict = {}
            s = Statement.objects.get(id=statement_state.statement_id.id)
            user = UserProfile.objects.get(email=s.user)
            web_my_receive_dict['avatarurl'] = user.avatar_source
            web_my_receive_dict['fullname'] = user.full_name
            web_my_receive_dict['generate_time'] = statement_state.receive_time
            web_my_receive_dict['table_id'] = s.id
            web_my_receive_dict['state'] = statement_state.state
            web_my_receive_dict['accomplish'] = s.accomplish
            web_my_receive_dict['overdue'] = s.overdue
            web_my_receive_dict['underway'] = s.underway
            backlog_list = []
            web_my_receive_dict['backlog_list'] = backlog_list

            statement_backlogs_list = StatementBacklog.objects.filter(statement_id=s).order_by('-id')
            for statement_backlogs in statement_backlogs_list:
                backlogs_dict = {}
                backlogs = Backlog.objects.get(id=statement_backlogs.backlog_id)
                backlogs_dict['task'] = backlogs.task
                backlogs_dict['over_time'] = backlogs.over_time
                backlog_list.append(backlogs_dict)

            url_list = []
            web_my_receive_dict['url_list'] = url_list
            accessory_list = StatementAccessory.objects.filter(statement_id=s, is_delete='f').order_by('-id')
            for accessory in accessory_list:
                accessory_dict = {}
                accessory_dict['url'] = accessory.statement_accessory_url
                accessory_dict['size'] = accessory.accessory_size
                accessory_dict['name'] = accessory.accessory_name
                url_list.append(accessory_dict)
            receive_table_list.append(web_my_receive_dict)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'receive_table_list': receive_table_list})


# web发送的日志
def web_my_send(request, user_profile):
    try:
        statement = Statement.objects.filter(user=user_profile.email).order_by('-id')
    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        send_table_list = []
        for statement_state in statement:
            web_my_receive_dict = {}

            user = UserProfile.objects.get(email=statement_state.user)
            web_my_receive_dict['avatarurl'] = user.avatar_source
            web_my_receive_dict['fullname'] = user.full_name
            web_my_receive_dict['generate_time'] = statement_state.receive_time
            web_my_receive_dict['table_id'] = statement_state.id
            web_my_receive_dict['state'] = statement_state.state
            web_my_receive_dict['accomplish'] = statement_state.accomplish
            web_my_receive_dict['overdue'] = statement_state.overdue
            web_my_receive_dict['underway'] = statement_state.underway
            backlog_list = []
            web_my_receive_dict['backlog_list'] = backlog_list

            statement_backlogs_list = StatementBacklog.objects.filter(statement_id=statement_state)
            for statement_backlogs in statement_backlogs_list:
                backlogs_dict = {}
                backlogs = Backlog.objects.get(id=statement_backlogs.backlog_id)
                backlogs_dict['task'] = backlogs.task
                backlogs_dict['over_time'] = backlogs.over_time
                backlog_list.append(backlogs_dict)

            url_list = []
            web_my_receive_dict['url_list'] = url_list
            accessory_list = StatementAccessory.objects.filter(statement_id=statement_state, is_delete='f')
            for accessory in accessory_list:
                accessory_dict = {}
                accessory_dict['url'] = accessory.statement_accessory_url
                accessory_dict['size'] = accessory.accessory_size
                accessory_dict['name'] = accessory.accessory_name
                url_list.append(accessory_dict)
            send_table_list.append(web_my_receive_dict)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'send_table_list': send_table_list})


# 我发出的
def my_send(request, user_profile):
    statement = Statement.objects.filter(user=user_profile.email).order_by('-id')
    try:
        send_table_list = []
        for st in statement:
            user_dict = {}
            user_dict['avatarurl'] = user_profile.avatar_source
            user_dict['fullname'] = user_profile.full_name
            user_dict['generate_time'] = st.generate_time
            user_dict['table_id'] = st.id
            send_table_list.append(user_dict)

    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取数据失败", })

    return JsonResponse({'errno': 0, 'message': "成功", 'send_table_list': send_table_list})


# 我收到的
def my_receive(request, user_profile):
    try:
        statement_state_list = StatementState.objects.filter(staff=user_profile.id).order_by('-id')
    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        receive_table_list = []
        for statement_state in statement_state_list:
            user_dict = {}
            s = Statement.objects.get(id=statement_state.statement_id.id)
            user = UserProfile.objects.get(email=s.user)
            user_dict['avatarurl'] = user.avatar_source
            user_dict['fullname'] = user.full_name
            user_dict['generate_time'] = statement_state.receive_time
            user_dict['table_id'] = s.id
            user_dict['state'] = statement_state.state

            receive_table_list.append(user_dict)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'receive_table_list': receive_table_list})


# 日志助手
def log_assistant(request, user_profile):
    try:
        a = StatementState.objects.filter(staff=user_profile.id, state='f').count()
    except Exception:
        return JsonResponse({'errno': 1, 'message': "查询失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'count': a})


# 获取频道人员信息
def stream_recipient_data(request, user_profile):
    streams_list = Stream.objects.all()
    streams_user_list = get_user_ids_for_streams(streams_list)
    streams_dict = {}
    for streams_user_id_list in streams_user_list:
        streams_user_data_list = []
        for user_id in streams_user_list[streams_user_id_list]:
            user_data_dict = {}
            user = UserProfile.objects.get(id=user_id)
            user_data_dict['avatarurl'] = user.avatar_source
            user_data_dict['id'] = user.id
            user_data_dict['fullname'] = user.full_name
            user_data_dict['email'] = user.email
            streams_user_data_list.append(user_data_dict)

        streams_dict[streams_user_id_list] = streams_user_data_list
        streams_dict['no_strems'] = []

    return JsonResponse({'errno': 0, 'message': "获取成功", 'streams_dict': streams_dict})


# 发送报表
def table_view(request, user_profile):
    user = str(user_profile)
    user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)
    req = request.body
    req = req.decode()
    req = json.loads(req)
    accomplish = req.get('accomplish')
    overdue = req.get("overdue")
    underway = req.get('underway')
    date_type = req.get('date_type')

    backlogs_list = req.get('backlog_list')
    statement_accessory_list = req.get('statement_accessory_list')
    send = req.get('send_list')
    # accomplish='123123123'
    # overdue='2222'
    # underway = '123123123'
    # date_type='day'
    # backlogs_list=[1,2,6,4,5]
    # statement_accessory_list = [{'url':'www.baidu.com','size':11,'name':'头像'},{'url':'www.baidu.com','size':222,'name':'头像'}]
    # send = [22,23,24]

    if not accomplish:
        return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
    try:
        generate_time = time.time()
        a = Statement(user=user, generate_time=generate_time, accomplish=accomplish, overdue=overdue,
                      underway=underway,
                      types=date_type)
        a.save()

        if backlogs_list:
            for backlog_id in backlogs_list:
                StatementBacklog.objects.create(statement_id=a, backlog_id=backlog_id)

        if statement_accessory_list:
            for statement_accessory_dict in statement_accessory_list:
                StatementAccessory.objects.create(statement_accessory_url=statement_accessory_dict['url'],
                                                  accessory_size=statement_accessory_dict['size'],
                                                  accessory_name=statement_accessory_dict['name'],
                                                  statement_id=a)

        if send:
            b = time.time()
            for staff in send:
                StatementState.objects.create(statement_id=a, staff=staff, receive_time=b)

    except Exception:
        return JsonResponse({'errno': 2, 'message': "储存周报失败"})

    return JsonResponse({'errno': 0, 'message': "成功"})


# 一键生成
def generate_table(request, user_profile):
    now = int(time.time())

    user = str(user_profile)
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

        month_backlog_list = Backlog.objects.filter(user=user, create_time__range=(day_begin, day_end),
                                                    is_delete='f').order_by(
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
        week_backlog_list = Backlog.objects.filter(user=user, create_time__range=(a, b), is_delete='f').order_by('-id')
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

        day_backlog_list = Backlog.objects.filter(user=user, create_time__range=(a, b), is_delete='f').order_by('-id')

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


# 待办事项增
def backlogs_view_po(request, user_profile):
    import re
    user = str(user_profile)
    user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)

    req = request.body
    req = req.decode()
    req = json.loads(req)
    task = req.get('task')
    over_time = req.get('over_time')
    task_details = req.get('task_details')
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
        time_array = time.localtime(create_time)
        other_styley_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
        update_create_time = "%s创建了事项" % other_styley_time
        UpdateBacklog.objects.create(backlog_id=backlog, update_backlog=update_create_time)

    except ImportError:
        return JsonResponse({'errno': 2, 'message': '创建事项失败'})

    return JsonResponse({'errno': 0, 'message': '事项创建成功，记得如期完成哦', 'backlog_id': backlog_id})


# 删
def backlogs_view_d(request, user_profile):
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


# 改
def backlogs_view_pu(request, user_profile):
    now = int(time.time())
    time_array = time.localtime(now)
    uodate_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
    req = request.body
    req = req.decode()
    req = json.loads(req)
    put_id = req.get('backlog_id')
    try:
        backlog = Backlog.objects.get(id=put_id)
        del req['backlog_id']
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

                elif req['state'] == 2:
                    backlog.state = req['state']

        backlog.save()
    except Exception:
        return JsonResponse({'errno': 3, 'message': '保存数据失败'})
    return JsonResponse({'errno': 0, 'message': '成功'})


# 更新待办事项附件
def accessory_up(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    now = int(time.time())
    time_array = time.localtime(now)
    uodate_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
    accessory_list = req['accessory_list']
    backlog_id = req['backlog_id']

    try:
        for i in accessory_list:
            backlog = Backlog.objects.get(id=backlog_id)

            if i['type'] == 'add':
                if not all([i['url'], i['size'], i['name']]):
                    return JsonResponse({'errno': 2, 'message': '缺少必要参数'})
                a = BacklogAccessory.objects.create(backlog_id=backlog, accessory_url=i['url'],
                                                    accessory_size=i['size'],
                                                    accessory_name=i['name'])
                return JsonResponse({'errno': 0, 'message': '修改完成', 'accessory_id': a.id})

            elif i['type'] == 'del':
                if not i['accessory_id']:
                    return JsonResponse({'errno': 3, 'message': '缺少必要参数'})
                accessory = BacklogAccessory.objects.get(id=backlog_id)
                accessory.is_delete = True
                accessory.save()
            UpdateBacklog.objects.create(update_backlog="%s修改了附件" % uodate_time, backlog_id=backlog)
    except Exception:
        return JsonResponse({'errno': 1, 'message': '事项id错误'})
    return JsonResponse({'errno': 0, 'message': '修改完成'})


# 待办事项列表
def backlogs_view_g(request: HttpRequest, user_profile: UserProfile):
    user = str(user_profile)
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
                    accessory_dict["size"] = accessory.accessory_size
                    accessory_dict['"name'] = accessory.accessory_name
                a["accessory_dict"] = accessory_dict
            past_due_list.append(a)

        else:
            b = {}
            b['backlog_id'] = bl.id
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
                    accessory_dict["size"] = accessory.accessory_size
                    accessory_dict['"name'] = accessory.accessory_name

                b["accessory_dict"] = accessory_dict

            backlog_list.append(b)

    return JsonResponse({'errno': 0, 'message': '成功', 'past_due_list': past_due_list, 'backlog_list': backlog_list})


# 事项详情
def backlogs_details(request: HttpRequest, user_profile: UserProfile):
    backlog_id = request.GET.get('backlog_id')
    try:

        backlogs = Backlog.objects.get(id=backlog_id)
        update_backlog = UpdateBacklog.objects.filter(backlog_id=backlog_id).order_by('-id')
        backlogs_accessory_list = BacklogAccessory.objects.filter(backlog_id=backlog_id, is_delete='f')
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
    accessory_list = []
    for accessory in backlogs_accessory_list:
        accessory_dict = {}
        accessory_dict['id'] = accessory.backlog_id
        accessory_dict['url'] = accessory.accessory_url
        accessory_dict["size"] = accessory.accessory_size
        accessory_dict['"name'] = accessory.accessory_name
    backlogs_dict['accessory_list'] = accessory_list

    return JsonResponse(
        {'errno': 0, 'message': '成功', 'backlog_dict': backlogs_dict, "update_backlog_list": update_backlog_list})


# 查看已完成事项
def accomplis_backlogs_view(request, user_profile):
    user = str(user_profile)
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
                accessory_dict["size"] = accessory.accessory_size
                accessory_dict['"name'] = accessory.accessory_name

            a["accessory_dict"] = accessory_dict

        a['state'] = accomplis_backlogs.state
        accomplis_backlogs_listss.append(a)

    return JsonResponse({'errno': 0, 'message': '成功', 'accomplis_backlog_list': accomplis_backlogs_listss})

