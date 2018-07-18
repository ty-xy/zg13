from zerver.models import Backlog, BacklogAccessory, UpdateBacklog, Statement, StatementBacklog, StatementAccessory, \
    StatementState, UserProfile, Stream, ZgStatementComment, ZgReplyComment
from django.http import JsonResponse, HttpResponse, HttpRequest
import datetime, time, json, calendar
from zerver.lib import avatar

import re, math

from zerver.lib.actions import get_user_ids_for_streams


# 查看日志评论
def statement_review(request, user_profile):
    table_id = request.GET.get('table_id')
    if not table_id:
        return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
    table_id = int(table_id)
    comment_list = []
    try:
        comment_obj_list = ZgStatementComment.objects.filter(topic_id=table_id)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取评论失败"})

    for comment_obj in comment_obj_list:
        comment_dict = {}
        comment_dict['comment_id'] = comment_obj.id
        comment_dict['comment_content'] = comment_obj.content
        comment_dict['comment_time'] = comment_obj.comment_time
        user = UserProfile.objects.filter(id=comment_obj.from_uid)
        user = user[0]
        comment_dict['comment_user_name'] = user.full_name
        comment_dict['comment_user_avatar_url'] = avatar.absolute_avatar_url(user)
        reply_obj_list = ZgReplyComment.objects.filter(comment_id=comment_obj)
        comment_dict['comment_reply_list'] = []
        for reply_obj in reply_obj_list:
            reply_dict = {}

            # 用户回复id
            reply_dict['reply_user_id'] = reply_obj.reply_user_id
            if reply_obj.reply_user_id :
                user_obj = UserProfile.objects.get(id=reply_obj.reply_user_id)
                reply_dict['reply_user_name'] = user_obj.full_name

            # 回复内容
            reply_dict['reply_content'] = reply_obj.content
            # 回复用户id
            reply_dict['user_reply_id'] = reply_obj.from_uid
            user_obj = UserProfile.objects.get(id=reply_obj.from_uid)
            reply_dict['user_reply_avatar'] = avatar.absolute_avatar_url(user_obj)
            reply_dict['user_reply_name'] = user_obj.full_name

            # 回复时间
            reply_dict['reply_time'] = reply_obj.reply_time

            comment_dict['comment_reply_list'].append(reply_dict)

        comment_list.append(comment_dict)

    return JsonResponse({'errno': 0, 'message': "获取成功", 'comment_list': comment_list})


# 添加评论
def statement_review_post(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    table_id = req.get('table_id')
    comment = req.get('comment')
    if not all([table_id, comment]):
        return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
    print(table_id, comment)
    try:
        comment_obj = ZgStatementComment.objects.create(topic_id=table_id, content=comment, from_uid=user_profile.id,
                                                        comment_time=time.time(), topic_type='statement')

    except Exception:
        return JsonResponse({'errno': 1, 'message': "添加评论失败"})

    return JsonResponse({'errno': 0, 'message': "评论成功", 'comment_id': comment_obj.id})


# 添加评论回复
def reply_comment(request, user_profile):
    req = request.body
    req = req.decode()
    req = json.loads(req)
    comment_id = req.get('comment_id')
    content = req.get('content')
    reply_id = req.get('reply_id')
    if not all([comment_id, content]):
        return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
    try:
        a = ZgStatementComment.objects.get(id=comment_id)
        reply_obj = ZgReplyComment(comment_id=a, content=content, reply_type='reply_comment',
                                   from_uid=user_profile.id, reply_time=time.time())
        reply_obj.save()
        if reply_id:
            reply_obj.reply_user_id = reply_id
            reply_obj.save()
            reply_id = reply_obj.id

    except Exception:
        return JsonResponse({'errno': 1, 'message': "添加回复失败"})
    return JsonResponse({'errno': 0, 'message': "评论成功", 'reply_id': reply_id})


# 已读未读
def state_view(request, user_profile):
    table_id = request.GET.get('table_id')
    states = request.GET.get('state')

    if not all([table_id, states]):
        return JsonResponse({'errno': 2, 'message': "缺少必要参数", })
    if states == 't':
        try:
            read_table = StatementState.objects.filter(statement_id=table_id, state='t').order_by('-id')
        except Exception:
            return JsonResponse({'errno': 1, 'message': "获取已读信息失败", })
        user_list = []
        for table in read_table:
            user_dict = {}
            user = UserProfile.objects.get(id=table.staff)
            user_dict['avatar'] = avatar.absolute_avatar_url(user)
            user_dict['user_name'] = user.full_name
            user_dict['table_id'] = table_id
            user_list.append(user_dict)
        return JsonResponse({'errno': 0, 'message': "成功", 'user_list': user_list})

    elif states == 'f':
        try:
            read_table = StatementState.objects.filter(statement_id=table_id, state='f').order_by('-id')

        except Exception:
            return JsonResponse({'errno': 3, 'message': "获取已读信息失败", })
        user_list = []
        for table in read_table:
            user_dict = {}
            user = UserProfile.objects.get(id=table.staff)
            user_dict['avatar'] = avatar.absolute_avatar_url(user)
            user_dict['user_name'] = user.full_name
            user_dict['table_id'] = table_id
            user_list.append(user_dict)

        return JsonResponse({'errno': 0, 'message': "成功", 'user_list': user_list})


# 查看自己和他人的报表
def look_table(request, user_profile):
    table_id = request.GET.get('table_id')

    if not table_id:
        return JsonResponse({'errno': 2, 'message': "缺少必要参数", })

    try:

        statement = Statement.objects.get(id=table_id)
        a = StatementState.objects.get(statement_id=statement.id, staff=user_profile.id)
        a.state = True
        a.save()

        statement_backlogs_list = StatementBacklog.objects.filter(statement_id=statement).order_by('-id')
        user = UserProfile.objects.get(email=statement.user)

        table_dict = {}
        table_dict['avatar'] = avatar.absolute_avatar_url(user)
        table_dict['user_name'] = user.full_name
        table_dict['generate_time'] = statement.generate_time
        table_dict['accomplish'] = statement.accomplish
        table_dict['overdue'] = statement.overdue
        table_dict['underway'] = statement.underway
        table_dict['type'] = statement.types
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
    #
    return JsonResponse({'errno': 0, 'message': "获取数据成功", 'table_dict': table_dict})


# web接收到日志
def web_my_receive(request, user_profile):
    page = int(request.GET.get('page', 1))
    generate_time = request.GET.get('start_time')
    screen_over_time = request.GET.get('over_time')
    sender = request.GET.get('sender')
    date_type = request.GET.get('date_type')
    filter_dict = dict()
    if generate_time:
        filter_dict['receive_time__range'] = (generate_time, time.time())
    if screen_over_time:
        filter_dict['receive_time__range'] = ('0', screen_over_time)

    if all([generate_time, screen_over_time]):
        filter_dict['receive_time__range'] = (generate_time, screen_over_time)

    if sender:
        filter_dict['staff'] = sender
    else:
        filter_dict['staff'] = user_profile.id
    if date_type:
        filter_dict['types'] = date_type

    try:
        page1 = (page - 1) * 10
        page2 = page * 10
        statement_state_list = StatementState.objects.filter(**filter_dict).order_by('-id')[page1:page2]
        page_count = StatementState.objects.filter(**filter_dict).count()
        page_count = math.ceil(page_count / 10)

    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        receive_table_list = []
        for statement_state in statement_state_list:

            web_my_receive_dict = {}
            s = Statement.objects.get(id=statement_state.statement_id.id)
            statement_state.state = True
            statement_state.save()

            user = UserProfile.objects.get(email=s.user)
            web_my_receive_dict['avatarurl'] = avatar.absolute_avatar_url(user)
            web_my_receive_dict['fullname'] = user.full_name
            web_my_receive_dict['generate_time'] = statement_state.receive_time
            web_my_receive_dict['table_id'] = s.id
            web_my_receive_dict['accomplish'] = s.accomplish
            web_my_receive_dict['overdue'] = s.overdue
            web_my_receive_dict['underway'] = s.underway
            web_my_receive_dict['type'] = s.types
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
                accessory_name = accessory.accessory_name
                accessory_dict['name'] = accessory_name
                types = accessory_name.split('.')
                accessory_dict['type'] = types[-1]
                url_list.append(accessory_dict)
            receive_table_list.append(web_my_receive_dict)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'receive_table_list': receive_table_list, 'page': page_count})


# web发送的日志
def web_my_send(request, user_profile):
    page = int(request.GET.get('page', 1))
    generate_time = request.GET.get('start_time')
    screen_over_time = request.GET.get('over_time')
    date_type = request.GET.get('date_type')

    filter_dict = dict()
    if generate_time:
        filter_dict['generate_time__range'] = (generate_time, time.time())
    if screen_over_time:
        filter_dict['generate_time__range'] = ('0', screen_over_time)
    if all([generate_time, screen_over_time]):
        filter_dict['generate_time__range'] = (generate_time, screen_over_time)
    if date_type:
        filter_dict['types'] = date_type
    filter_dict['user'] = user_profile.email

    try:
        page1 = (page - 1) * 10
        page2 = page * 10
        statement = Statement.objects.filter(**filter_dict).order_by('-id')[page1:page2]
        page_count = Statement.objects.filter(**filter_dict).count()
        page_count = math.ceil(page_count / 10)
    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        send_table_list = []
        for statement_state in statement:
            web_my_receive_dict = {}

            user = UserProfile.objects.get(email=statement_state.user)
            web_my_receive_dict['avatarurl'] = avatar.absolute_avatar_url(user_profile)
            web_my_receive_dict['fullname'] = user.full_name
            web_my_receive_dict['generate_time'] = statement_state.generate_time
            web_my_receive_dict['table_id'] = statement_state.id
            web_my_receive_dict['accomplish'] = statement_state.accomplish
            web_my_receive_dict['overdue'] = statement_state.overdue
            web_my_receive_dict['underway'] = statement_state.underway
            web_my_receive_dict['type'] = statement_state.types
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
                accessory_name = accessory.accessory_name
                accessory_dict['name'] = accessory_name
                types = accessory_name.split('.')
                accessory_dict['type'] = types[-1]

                url_list.append(accessory_dict)

            try:
                read_table = StatementState.objects.filter(statement_id=statement_state.id, state='t').order_by('-id')
            except Exception:
                return JsonResponse({'errno': 1, 'message': "获取已读信息失败", })
            already_list = []
            for table in read_table:
                user_dict = {}
                user = UserProfile.objects.get(id=table.staff)
                user_dict['avatar'] = avatar.absolute_avatar_url(user)
                user_dict['user_name'] = user.full_name
                user_dict['table_id'] = statement_state.id
                already_list.append(user_dict)
            web_my_receive_dict['already_list'] = already_list

            try:
                read_table = StatementState.objects.filter(statement_id=statement_state.id, state='f').order_by('-id')
            except Exception:
                return JsonResponse({'errno': 3, 'message': "获取已读信息失败", })
            unread_list = []
            for table in read_table:
                user_dict = {}
                user = UserProfile.objects.get(id=table.staff)
                user_dict['avatar'] = avatar.absolute_avatar_url(user)
                user_dict['user_name'] = user.full_name
                user_dict['table_id'] = statement_state.id
                unread_list.append(user_dict)
            web_my_receive_dict['already_count'] = len(already_list)
            web_my_receive_dict['unread_count'] = len(unread_list)
            web_my_receive_dict['unread_list'] = unread_list

            send_table_list.append(web_my_receive_dict)

    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'send_table_list': send_table_list, 'page': page_count})


# 我发出的
def my_send(request, user_profile):
    page = int(request.GET.get('page', 1))

    generate_time = request.GET.get('start_time')
    screen_over_time = request.GET.get('over_time')
    date_type = request.GET.get('date_type')

    try:
        page1 = (page - 1) * 10
        page2 = page * 10
        filter_dict = dict()

        if generate_time:
            filter_dict['generate_time__range'] = (generate_time, time.time())
        if screen_over_time:
            filter_dict['generate_time__range'] = ('0', screen_over_time)
        if all([generate_time, screen_over_time]):
            filter_dict['generate_time__range'] = (generate_time, screen_over_time)
        if date_type:
            filter_dict['types'] = date_type
        filter_dict['user'] = user_profile.email

        statement = Statement.objects.filter(**filter_dict).order_by('-id')[page1:page2]
        page_count = Statement.objects.filter(**filter_dict).count()
        page_count = math.ceil(page_count / 10)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取我收到的报表失败", })

    try:
        send_table_list = []
        for st in statement:
            user_dict = {}
            user_dict['avatarurl'] = avatar.absolute_avatar_url(user_profile)
            user_dict['fullname'] = user_profile.full_name
            user_dict['generate_time'] = st.generate_time
            user_dict['table_id'] = st.id
            user_dict['type'] = st.types
            send_table_list.append(user_dict)

    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取数据失败", })

    return JsonResponse({'errno': 0, 'message': "成功", 'send_table_list': send_table_list, 'page': page_count})


# 我收到的
def my_receive(request, user_profile):
    generate_time = request.GET.get('start_time')
    screen_over_time = request.GET.get('over_time')
    sender = request.GET.get('sender')
    date_type = request.GET.get('date_type')

    page = int(request.GET.get('page', 1))
    page1 = (page - 1) * 10
    page2 = page * 10
    try:
        filter_dict = dict()
        if generate_time:
            filter_dict['receive_time__range'] = (generate_time, time.time())
        if screen_over_time:
            filter_dict['receive_time__range'] = ('0', screen_over_time)

        if all([generate_time, screen_over_time]):
            filter_dict['receive_time__range'] = (generate_time, screen_over_time)

        if sender:
            filter_dict['staff'] = sender
        else:
            filter_dict['staff'] = user_profile.id
        if date_type:
            filter_dict['types'] = date_type

        statement_state_list = StatementState.objects.filter(**filter_dict).order_by('-id')[page1:page2]
        page_count = StatementState.objects.filter(**filter_dict).count()
        page_count = math.ceil(page_count / 10)

    except Exception:
        return JsonResponse({'errno': 1, 'message': "获取我收到的报表失败"})

    try:
        receive_table_list = []
        for statement_state in statement_state_list:
            user_dict = {}
            s = Statement.objects.get(id=statement_state.statement_id.id)
            user = UserProfile.objects.get(email=s.user)
            user_dict['avatarurl'] = avatar.absolute_avatar_url(user)
            user_dict['fullname'] = user.full_name
            user_dict['generate_time'] = statement_state.receive_time
            user_dict['table_id'] = s.id
            user_dict['state'] = statement_state.state
            user_dict['type'] = s.types

            receive_table_list.append(user_dict)
    except Exception:
        return JsonResponse({'errno': 2, 'message': "获取信息失败"})
    return JsonResponse({'errno': 0, 'message': "成功", 'receive_table_list': receive_table_list, 'page': page_count})


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
            user_data_dict['avatarurl'] = avatar.absolute_avatar_url(user)
            user_data_dict['id'] = user.id
            user_data_dict['fullname'] = user.full_name
            user_data_dict['email'] = user.email
            streams_user_data_list.append(user_data_dict)
        a = Stream.objects.get(id=streams_user_id_list)
        streams_dict[a.name] = streams_user_data_list
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

    if not all([date_type, accomplish]):
        return JsonResponse({'errno': 1, 'message': "缺少必要参数"})
    try:
        generate_time = time.time()
        a = Statement(user=user, generate_time=generate_time, types=date_type, accomplish=accomplish)

        if overdue:
            a.overdue = overdue

        if underway:
            a.underway = underway

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

    return JsonResponse({'errno': 0, 'message': "成功", 'table_id': a.id})


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
                                                    is_delete='f').order_by('-id')

        month_accomplish_list = []
        month_overdue_list = []
        month_underway_list = []
        month_accessory_list = []

        for month_backlog in month_backlog_list:
            if month_backlog.state == 0:
                month_accomplish_list.append(month_backlog.task)

            if month_backlog.over_time < now and month_backlog.state == 2:
                month_overdue_list.append(month_backlog.task)

            if month_backlog.over_time > now and month_backlog.state == 2:
                month_underway_list.append(month_backlog.task)

            month_accessory_obj_list = BacklogAccessory.objects.filter(backlog_id=month_backlog)
            month_accessory_obj_dict = {}

            for month_accessory_obj in month_accessory_obj_list:
                month_accessory_obj_dict['url'] = month_accessory_obj.accessory_url
                month_accessory_obj_dict['size'] = month_accessory_obj.accessory_size
                accessory_name = month_accessory_obj.accessory_name
                month_accessory_obj_dict['name'] = accessory_name
                types = accessory_name.split('.')
                month_accessory_obj_dict['type'] = types[-1]

            if month_accessory_obj_dict:
                month_accessory_list.append(month_accessory_obj_dict)
        month_backlog_count = Backlog.objects.filter(user=user, create_time__range=(day_begin, day_end),
                                                     is_delete='f', state=0).count()
        completeness = 0
        if month_backlog_count + len(month_overdue_list):
            completeness = month_backlog_count / (month_backlog_count + len(month_overdue_list))

        return JsonResponse(
            {'errno': 0, 'message': "成功", 'accomplish_list': month_accomplish_list, 'overdue_list':
                month_overdue_list, "underway_list": month_underway_list, 'completeness': completeness,
             'accessory_list': month_accessory_list})

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
        week_accessory_list = []

        for week_backlog in week_backlog_list:
            if week_backlog.state == 0:
                week_accomplish_list.append(week_backlog.task)

            if week_backlog.over_time < now and week_backlog.state == 2:
                week_overdue_list.append(week_backlog.task)

            if week_backlog.over_time > now and week_backlog.state == 2:
                week_underway_list.append(week_backlog.task)

            month_accessory_obj_list = BacklogAccessory.objects.filter(backlog_id=week_backlog)
            month_accessory_obj_dict = {}

            for month_accessory_obj in month_accessory_obj_list:
                month_accessory_obj_dict['url'] = month_accessory_obj.accessory_url
                month_accessory_obj_dict['size'] = month_accessory_obj.accessory_size
                accessory_name = month_accessory_obj.accessory_name
                month_accessory_obj_dict['name'] = accessory_name
                types = accessory_name.split('.')
                month_accessory_obj_dict['type'] = types[-1]

            if month_accessory_obj_dict:
                week_accessory_list.append(month_accessory_obj_dict)

        week_backlog_count = Backlog.objects.filter(user=user, create_time__range=(a, b), is_delete='f',
                                                    state=0).count()
        completeness = 0
        if week_backlog_count + len(week_overdue_list):
            completeness = week_backlog_count / (week_backlog_count + len(week_overdue_list))

        return JsonResponse(
            {'errno': 0, 'message': "成功", 'accomplish_list': week_accomplish_list, 'overdue_list':
                week_overdue_list, "underway_list": week_underway_list, 'completeness': completeness,
             'accessory_list': week_accessory_list})

    elif date_type == "day":
        a = int(time.mktime(time.strptime(str(datetime.date.today()), '%Y-%m-%d')))
        b = int(time.mktime(time.strptime(str(datetime.date.today()
                                              + datetime.timedelta(days=1)), '%Y-%m-%d'))) - 1

        day_backlog_list = Backlog.objects.filter(user=user, create_time__range=(a, b), is_delete='f').order_by('-id')

        day_accomplish_list = []
        day_overdue_list = []
        day_underway_list = []
        day_accessory_list = []

        for day_backlog in day_backlog_list:
            if day_backlog.state == 0:
                day_accomplish_list.append(day_backlog.task)

            if day_backlog.over_time < now and day_backlog.state == 2:
                day_overdue_list.append(day_backlog.task)

            if day_backlog.over_time > now and day_backlog.state == 2:
                day_underway_list.append(day_backlog.task)

            month_accessory_obj_list = BacklogAccessory.objects.filter(backlog_id=day_backlog)
            month_accessory_obj_dict = {}

            for month_accessory_obj in month_accessory_obj_list:
                month_accessory_obj_dict['url'] = month_accessory_obj.accessory_url
                month_accessory_obj_dict['size'] = month_accessory_obj.accessory_size
                accessory_name = month_accessory_obj.accessory_name
                month_accessory_obj_dict['name'] = accessory_name
                types = accessory_name.split('.')
                month_accessory_obj_dict['type'] = types[-1]

            if month_accessory_obj_dict:
                day_accessory_list.append(month_accessory_obj_dict)

        day_backlog_count = Backlog.objects.filter(user=user, create_time__range=(a, b), is_delete='f', state=0).count()
        completeness = 0
        if day_backlog_count + len(day_overdue_list):
            completeness = day_backlog_count / (day_backlog_count + len(day_overdue_list))

        return JsonResponse(
            {'errno': 0, 'message': "成功", 'accomplish_list': day_accomplish_list, 'overdue_list':
                day_overdue_list, "underway_list": day_underway_list, 'completeness': completeness,
             'accessory_list': day_accessory_list})


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
        return JsonResponse({'errno': 3, 'message': '截止时间不能早于当前时间'})
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
        accessory_lists = []
        backlog = Backlog.objects.get(id=backlog_id)
        for i in accessory_list:
            if i['type'] == 'add':
                accessory_dict = {}
                if not all([i['url'], i['size'], i['name']]):
                    return JsonResponse({'errno': 2, 'message': '缺少必要参数'})
                a = BacklogAccessory.objects.create(backlog_id=backlog,
                                                    accessory_url=i['url'],
                                                    accessory_size=i['size'],
                                                    accessory_name=i['name'])

                accessory_dict['name'] = a.accessory_name
                accessory_dict['url'] = a.accessory_url
                accessory_dict['size'] = a.accessory_size
                accessory_dict['id'] = a.id
                accessory_lists.append(accessory_dict)

            elif i['type'] == 'del':
                if not i['accessory_id']:
                    return JsonResponse({'errno': 3, 'message': '缺少必要参数'})
                accessory = BacklogAccessory.objects.get(id=i['accessory_id'])
                accessory.is_delete = True
                accessory.save()
        UpdateBacklog.objects.create(update_backlog="%s修改了附件" % uodate_time, backlog_id=backlog)
    except Exception:
        return JsonResponse({'errno': 1, 'message': '错误'})

    if accessory_list:
        return JsonResponse({'errno': 0, 'message': '修改完成', 'accessory_list': accessory_lists})
    return JsonResponse({'errno': 0, 'message': '修改完成'})


# 待办事项列表
def backlogs_view_g(request, user_profile):
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
            a['create_timestamp'] = bl.create_time
            a['over_timestamp'] = bl.over_time
            time_array = time.localtime(bl.over_time)
            over_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            a['over_time'] = over_time
            a['task'] = bl.task
            a['task_details'] = bl.task_details
            a['state'] = bl.state
            accessory_lists = BacklogAccessory.objects.filter(backlog_id=bl.id, is_delete='f')
            accessory_list = []
            if accessory_lists:
                for accessory in accessory_lists:
                    accessory_list.append(accessory.accessory_url)
                a["accessory_list"] = accessory_list
            past_due_list.append(a)


        else:
            b = {}
            b['backlog_id'] = bl.id
            time_array = time.localtime(bl.create_time)
            create_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            b['create_time'] = create_time
            b['create_timestamp'] = bl.create_time
            time_array = time.localtime(bl.over_time)
            over_time = time.strftime("%Y-%m-%d %H:%M:%S", time_array)
            b['over_time'] = over_time
            b['over_timestamp'] = bl.over_time
            b['task'] = bl.task
            b['task_details'] = bl.task_details
            if bl.over_time - now < 86400:
                b['warn'] = True


            else:
                b['warn'] = False
            b['state'] = bl.state

            accessory_lists = BacklogAccessory.objects.filter(backlog_id=bl.id, is_delete='f')
            accessory_list = []
            if accessory_lists:
                for accessory in accessory_lists:
                    accessory_list.append(accessory.accessory_url)
                b["accessory_list"] = accessory_list

            backlog_list.append(b)

    return JsonResponse({'errno': 0, 'message': '成功', 'past_due_list': past_due_list, 'backlog_list': backlog_list})


# 事项详情
def backlogs_details(request, user_profile):
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
        accessory_dict['id'] = accessory.id
        accessory_dict['url'] = accessory.accessory_url
        accessory_dict["size"] = accessory.accessory_size
        accessory_name = accessory.accessory_name
        accessory_dict['name'] = accessory_name
        types = accessory_name.split('.')
        accessory_dict['type'] = types[-1]
        accessory_list.append(accessory_dict)
    backlogs_dict['accessory_list'] = accessory_list

    return JsonResponse(
        {'errno': 0, 'message': '成功', 'backlog_dict': backlogs_dict, "update_backlog_list": update_backlog_list})


# 查看已完成事项
def accomplis_backlogs_view(request, user_profile):
    user = str(user_profile)
    user = re.match(r"<UserProfile: (.*) <.*>>", user).group(1)

    page = request.GET.get('page')
    generate_time = request.GET.get('start_time')
    over_time = request.GET.get('over_time')
    accomplis_task = request.GET.get('accomplis_task')
    filter_dict = {}

    if generate_time:
        filter_dict['create_time__range'] = (generate_time, time.time())
    if over_time:
        filter_dict['create_time__range'] = ('0', over_time)
    if all([generate_time, over_time]):
        filter_dict['create_time__range'] = (generate_time, over_time)

    if accomplis_task:
        filter_dict['task__contains'] = accomplis_task
    filter_dict['user'] = user
    filter_dict['state'] = 0
    filter_dict['is_delete'] = 'f'

    try:
        page = int(page)
        sums1 = 0
        sums2 = 20
        if page != 1:
            sums1 = (page - 1) * 20
            sums2 = page * 20
        accomplis_backlogs_list = Backlog.objects.filter(**filter_dict).order_by('-id')[sums1:sums2]
    except Exception:
        return JsonResponse({'errno': 1, 'message': '获取数据失败'})

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
                accessory_name = accessory.accessory_name
                accessory_dict['name'] = accessory_name
                types = accessory_name.split('.')
                accessory_dict['type'] = types[-1]
            a["accessory_dict"] = accessory_dict

        a['state'] = accomplis_backlogs.state
        accomplis_backlogs_listss.append(a)

    return JsonResponse({'errno': 0, 'message': '成功', 'accomplis_backlog_list': accomplis_backlogs_listss})
