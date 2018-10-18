from django.http import JsonResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgLeave, ZgReview, ZgReimburse, UserProfile, Feedback, ZgCorrectzAccessory, Attachment
import json
from datetime import datetime, timezone, timedelta
from zerver.lib import avatar
from django.db.models import Q
from zerver.tornado.event_queue import send_event
from zerver.views.zg_tools import zg_send_tools


def nuw_time():
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    return stockpile_time


# 请假出差表
@zulip_login_required
def view_leave(request, user_profile):
    aa = request.GET.get('aa')
    event = {'type': 'ZgNotice',
             'qqq': 'saddsadas'}
    aa = int(aa)
    bb = [26]
    bb.append(aa)
    send_event(event, bb)
    return JsonResponse({'errno': 1})


# 添加请假出差
@zulip_login_required
def add_leave(request, user_profile):
    # 传入
    req = request.body
    if not req:
        return JsonResponse({'errno': 3, 'message': '带*号的是必填参数哦'})
    req = req.decode()
    req = json.loads(req)
    # 审批类型
    approval_type = req.get('approval_type')
    # 请假人，申请人
    content = req.get('content')
    # 开始时间
    start_time = req.get('start_time')
    # 结束时间
    end_time = req.get('end_time')
    # 天数
    count = req.get('count')
    # 事由
    cause = req.get('cause')
    # 图片
    img_url = req.get('img_url')
    print(img_url)
    # 审批人
    approver_list = req.get('approver_list')
    # 抄送人
    observer_list = req.get('observer_list')

    if not all([approver_list, approval_type, start_time, end_time, count, cause]):
        return JsonResponse({'errno': 1, 'message': '带*号的是必填参数哦'})

    try:
        aaa = ZgLeave.objects.create(user=user_profile, approval_type=approval_type, content=content,
                                     start_time=start_time,
                                     end_time=end_time,
                                     send_time=nuw_time(),
                                     count=count, cause=cause)
        if img_url:
            for img in img_url:
                path_id = img.split('user_uploads/')[1]
                if path_id[-1] == ')':
                    path_id = img.split('user_uploads/')[1][: -1]
                attachment = Attachment.objects.filter(path_id=path_id)
                print(attachment)
                ZgCorrectzAccessory.objects.create(correctz_type='leave', table_id=aaa.id, attachment=attachment[0])

        types = ''
        if approval_type == 'evection':
            types = '出差'
        elif approval_type == 'leave':
            types = '请假'

        event = {'zg_type': 'JobsNotice',
                 'time': nuw_time(),
                 'avatar_url': avatar.absolute_avatar_url(user_profile),
                 'user_name': user_profile.full_name,
                 'content': {'type': approval_type,
                             'reason': cause,
                             'time_length': start_time + '   ～   ' + end_time,
                             'id': aaa.id
                             }}
        event = zg_send_tools(event)
        # 添加审批人
        if approver_list:
            for approver in approver_list:
                ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=approver, table_id=aaa.id,
                                        send_time=nuw_time())
            event['theme'] = user_profile.full_name + '的' + types + '申请需要您的审批'
            send_event(event, approver_list)

        if observer_list:
            for observer in observer_list:
                ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=observer, duties='inform',
                                        table_id=aaa.id, send_time=nuw_time())
            event['theme'] = user_profile.full_name + '的' + types + '申请需要您知晓'
            send_event(event, observer_list)

    except Exception as e:
        print(e)
        return JsonResponse({'errno': 2, 'message': '发送申请失败'})

    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 添加报销
def reimburse_add(request, user_profile):
    req = request.body
    if not req:
        return JsonResponse({'errno': 1, 'message': '参数为空'})
    req = req.decode()
    req = json.loads(req)
    amount = req.get('amount')
    category = req.get('category')
    detail = req.get('detail')
    image_url = req.get('img_url')
    approver_list = req.get('approver_list')
    observer_list = req.get('observer_list')

    if not all([amount, category, approver_list]):
        JsonResponse({'errno': 2, 'message': '带*号为必填参数'})

    a = ZgReimburse.objects.create(user=user_profile, category=category, amount=amount, detail=detail,
                                   send_time=nuw_time())
    if image_url:
        for img in image_url:
            print(img)
            print(img.split('/')[-1])
            path_id = img.split('user_uploads/')[1]
            if path_id[-1] == ')':
                path_id = img.split('user_uploads/')[1][: -1]
            attachment = Attachment.objects.filter(path_id=path_id)
            ZgCorrectzAccessory.objects.create(correctz_type='reimburse', table_id=a.id, attachment=attachment[0])

    event = {'zg_type': 'JobsNotice',
             'time': nuw_time(),
             'avatar_url': avatar.absolute_avatar_url(user_profile),
             'user_name': user_profile.full_name,

             'content': {'type': 'reimburse',
                         'amount': amount,
                         'category': category,
                         'id': a.id
                         }}

    event = zg_send_tools(event)
    if approver_list:
        for approver in approver_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=approver, table_id=a.id,
                                    send_time=nuw_time())
            event['theme'] = user_profile.full_name + '的' + '报销' + '申请需要您的审批'
            send_event(event, approver_list)
    if observer_list:
        for observer in observer_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=observer, duties='inform',
                                    table_id=a.id, send_time=nuw_time())

            event['theme'] = user_profile.full_name + '的' + '报销' + '申请需要您的知晓'
            send_event(event, approver_list)

    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 待审批列表
def expectation_approval_list(request, user_profile):
    iaitiate_list = []
    review_objs = ZgReview.objects.filter(status='审批中', send_user_id=user_profile.id, duties='approval').order_by('-id')
    if review_objs:
        for review_obj in review_objs:
            aa = {}
            if review_obj.types == 'reimburse':
                name = '的报销申请'
            elif review_obj.types == 'leave':
                name = '的请假申请'
            elif review_obj.types == 'evection':
                name = '的出差申请'
            else:
                name = ''
            aa['name'] = review_obj.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(review_obj.user)
            aa['type'] = review_obj.types
            aa['id'] = review_obj.table_id
            aa['status'] = review_obj.status
            aa['send_time'] = review_obj.send_time
            iaitiate_list.append(aa)

    return JsonResponse({'errno': 0, 'message': '成功', 'iaitiate_list': iaitiate_list})


# 已完成审批列表
def completed_approval_list(request, user_profile):
    completed_list = []
    review_objs = ZgReview.objects.filter(Q(status='审批通过') | Q(status='审批未通过'), send_user_id=user_profile.id).order_by(
        '-id')

    if review_objs:
        for review_obj in review_objs:
            aa = {}
            if review_obj.types == 'reimburse':
                name = '的报销申请'
            elif review_obj.types == 'leave':
                name = '的请假申请'
            elif review_obj.types == 'evection':
                name = '的出差申请'
            else:
                name = ''
            aa['name'] = review_obj.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(review_obj.user)
            aa['type'] = review_obj.types
            aa['id'] = review_obj.table_id
            aa['send_time'] = review_obj.send_time
            if review_obj.types == 'reimburse':
                reimburse = ZgReimburse.objects.filter(id=review_obj.table_id)

            elif review_obj.types == 'leave' or review_obj.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=review_obj.table_id, approval_type=review_obj.types)

            else:
                reimburse = None

            bb = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批未通过', duties='approval').count()
            cc = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批中', duties='approval').count()

            if reimburse[0].status == '已撤销':
                aa['status'] = '已撤销'
            else:
                if bb > 0:
                    aa['status'] = '审批未通过'
                elif cc > 0:
                    aa['status'] = '审批中'
                else:
                    aa['status'] = '审批通过'

            completed_list.append(aa)

    return JsonResponse({'errno': 0, 'message': '成功', 'completed_list': completed_list})


# 我发起的
def approval_initiate_me(request, user_profile):
    # 查询发送人是我的发送人审批人表
    initiate_ids = ZgReview.objects.filter(user=user_profile).order_by('-id').values_list('id', flat=True)
    print(initiate_ids)
    initiate_objs = ZgReview.objects.filter(id__in=initiate_ids).distinct('table_id','types')
    print(ZgReview.objects.filter(id__in=initiate_ids).distinct('table_id','types'))
    initiate_list = []
    if initiate_objs is not None:
        for initiate_obj in initiate_objs:
            aa = {}
            if initiate_obj.types == 'reimburse':
                name = '的报销申请'
            elif initiate_obj.types == 'leave':
                name = '的请假申请'
            elif initiate_obj.types == 'evection':
                name = '的出差申请'
            else:
                name = ''
            aa['name'] = user_profile.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(user_profile)
            aa['type'] = initiate_obj.types
            aa['id'] = initiate_obj.table_id

            if initiate_obj.types == 'reimburse':
                reimburse = ZgReimburse.objects.filter(id=initiate_obj.table_id)

            elif initiate_obj.types == 'leave' or initiate_obj.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=initiate_obj.table_id, approval_type=initiate_obj.types)

            else:
                reimburse = None

            bb = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批未通过', duties='approval').count()
            cc = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批中', duties='approval').count()

            if reimburse[0].status == '已撤销':
                aa['status'] = '已撤销'
            else:
                if bb > 0:
                    aa['status'] = '审批未通过'
                elif cc > 0:
                    aa['status'] = '审批中'
                else:
                    aa['status'] = '审批通过'

            aa['send_time'] = initiate_obj.send_time

            initiate_list.append(aa)

    return JsonResponse({'errno': 0, 'message': '成功', 'initiate_list': initiate_list})


# 抄送我的
def inform_approval(request, user_profile):
    inform_objs = ZgReview.objects.filter(send_user_id=user_profile.id, duties='inform').order_by('-id')
    inform_list = []
    if inform_objs:
        for inform in inform_objs:
            aa = {}
            if inform.types == 'reimburse':
                name = '的报销申请'
            elif inform.types == 'leave':
                name = '的请假申请'
            elif inform.types == 'evection':
                name = '的出差申请'
            else:
                name = ''

            aa['name'] = inform.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(inform.user)
            aa['type'] = inform.types
            aa['id'] = inform.table_id

            if inform.types == 'reimburse':
                reimburse = ZgReimburse.objects.filter(id=inform.table_id)

            elif inform.types == 'leave' or inform.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=inform.table_id, approval_type=inform.types)

            else:
                reimburse = None

            bb = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批未通过', duties='approval').count()
            cc = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批中', duties='approval').count()

            if reimburse[0].status == '已撤销':
                aa['status'] = '已撤销'
            elif bb > 0:
                aa['status'] = '审批未通过'
            elif cc > 0:
                aa['status'] = '审批中'
            else:
                aa['status'] = '审批通过'
            aa['send_time'] = inform.send_time
            inform_list.append(aa)

    return JsonResponse({'errno': 0, 'message': '成功', 'inform_list': inform_list})


def tools_approcal_details(types, ids, user_profile, table_obj):
    data = {}

    data['head_avatar'] = avatar.absolute_avatar_url(table_obj.user)

    if table_obj.status == '已撤销':
        data['head_status'] = '已撤销'

    else:
        bb = ZgReview.objects.filter(table_id=ids, types=types, status='审批未通过', duties='approval').count()
        cc = ZgReview.objects.filter(table_id=ids, types=types, status='审批中', duties='approval').count()
        if bb > 0:
            data['head_status'] = '审批未通过'
        elif cc > 0:
            data['head_status'] = '审批中'
        else:
            data['head_status'] = '审批通过'

    if user_profile.id == table_obj.user.id and table_obj.status == '发起申请':
        data['button_status'] = 1
    elif ZgReview.objects.filter(table_id=ids, types=types, send_user_id=user_profile.id, status='审批中',
                                 duties='approval'):
        data['button_status'] = 2
    elif ZgReview.objects.filter(Q(~Q(status='审批中') & ~Q(status='已撤销'), table_id=ids, types=types,
                                   send_user_id=user_profile.id) |
                                 Q(duties='inform', table_id=ids, types=types,
                                   send_user_id=user_profile.id)):
        data['button_status'] = 3
    elif table_obj.status == '已撤销' and table_obj.user != user_profile:
        data['button_status'] = 4
    elif table_obj.status == '已撤销' and table_obj.user == user_profile:
        data['button_status'] = 5
    else:
        data['button_status'] = 3

    approver_statu = True
    if data['button_status'] == 5:
        approver_statu = False

    data['head_avatar'] = avatar.absolute_avatar_url(table_obj.user)
    if types == 'leave':
        data['head_name'] = table_obj.user.full_name + '的请假申请'
    elif types == 'evection':
        data['head_name'] = table_obj.user.full_name + '的出差申请'
    elif types == 'reimburse':
        data['head_name'] = table_obj.user.full_name + '的报销申请'
    approver_list = []

    approver_list.append(
        {'user_avatar': data['head_avatar'], 'user_name': data['head_name'], 'times': table_obj.send_time,
         'status': '发起申请'})
    review = ZgReview.objects.filter(types=types, table_id=ids, duties='approval')

    if review and approver_statu == True:
        for rev in review:
            if rev.status == '审批通过':
                rev_dict = {}
                user_obj = UserProfile.objects.get(id=rev.send_user_id)
                rev_dict['user_avatar'] = avatar.absolute_avatar_url(user_obj)
                rev_dict["user_name"] = user_obj.full_name
                rev_dict['times'] = rev.send_time
                rev_dict['status'] = rev.status
                approver_list.append(rev_dict)
            elif rev.status == '审批未通过' or rev.status == '审批中':
                rev_dict = {}
                user_obj = UserProfile.objects.get(id=rev.send_user_id)
                rev_dict['user_avatar'] = avatar.absolute_avatar_url(user_obj)
                rev_dict["user_name"] = user_obj.full_name
                rev_dict['times'] = rev.send_time
                rev_dict['status'] = rev.status
                print(rev.status, user_obj.full_name)
                approver_list.append(rev_dict)
                break
    elif approver_statu == False:
        approver_list.append(
            {'user_avatar': data['head_avatar'], 'user_name': data['head_name'], 'times': table_obj.send_time,
             'status': '已撤销'})
    data['approver_list'] = approver_list

    inform_objs = ZgReview.objects.filter(types=types, table_id=ids, duties='inform')
    inform_list = []
    if inform_objs:
        for inform_obj in inform_objs:
            inform_dict = {}
            inform_user_id = inform_obj.send_user_id
            inform_user = UserProfile.objects.filter(id=inform_user_id)
            inform_dict['user_avatar'] = avatar.absolute_avatar_url(inform_user[0])
            inform_dict['user_name'] = inform_user[0].full_name
            inform_list.append(inform_dict)
    data['inform_list'] = inform_list

    feedback_objs = Feedback.objects.filter(types=types, table_id=ids)
    feedback_list = []

    if feedback_objs:
        for feedback_obj in feedback_objs:
            feedback_dict = {}
            feedback_dict['user_avatar'] = avatar.absolute_avatar_url(feedback_obj.user)
            feedback_dict['user_name'] = feedback_obj.user.full_name
            feedback_dict['times'] = feedback_obj.feedback_time
            feedback_dict['content'] = feedback_obj.content
            feedback_list.append(feedback_dict)
    data['feedback_list'] = feedback_list
    return data


# 审批详情
def approval_details(request, user_profile):
    types = request.GET.get('types')
    ids = request.GET.get('id')
    if not all([types, ids]):
        return JsonResponse({'errno': 1, 'message': '缺少参数'})
    data = dict()
    img_list = list()
    if types == 'reimburse':
        reimburse = ZgReimburse.objects.filter(id=ids)
        if not reimburse:
            return JsonResponse({'errno': 2, 'message': '无效数据'})
        reimburse = reimburse[0]
        data['amount'] = reimburse.amount
        data['category'] = reimburse.category
        data['detail'] = reimburse.detail
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='reimburse', table_id=ids)
        print(accessorys)

    elif types == 'leave' or types == 'evection':
        reimburse = ZgLeave.objects.filter(id=ids, approval_type=types)
        if not reimburse:
            return JsonResponse({'errno': 3, 'message': '无效数据'})
        reimburse = reimburse[0]
        data['approval_type'] = reimburse.approval_type
        data['start_time'] = reimburse.start_time
        data['end_time'] = reimburse.end_time
        data['count'] = reimburse.count
        data['cause'] = reimburse.cause
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='leave', table_id=ids)
        print(accessorys, ids)
    else:

        return JsonResponse({'errno': 4, 'message': '类型错误'})
    for accessory in accessorys:
        img_list.append('/user_uploads/' + accessory.attachment.path_id)
    data['image_url'] = img_list
    data2 = tools_approcal_details(types, ids, user_profile, reimburse)
    data1 = data.copy()
    data1.update(data2)
    return JsonResponse({'errno': 0, 'message': '成功', 'data': data1})


# 状态
def state_update(request, user_profile):
    req = request.body
    if not req:
        return JsonResponse({'errno': 1, 'message': '参数为空'})
    req = req.decode()
    req = json.loads(req)
    types = req.get('types')
    ids = req.get('id')
    states = req.get('state')

    print(types, '------' * 30)

    if states == '同意':
        states = '审批通过'
    elif states == '不同意':
        states = '审批未通过'
    elif states == '撤销':
        states = '已撤销'
    elif states == '再次提交':
        states = '发起申请'

    if not all([types, ids, states]):
        return JsonResponse({'errno': 6, 'message': '缺少参数'})
    if types == 'leave' or types == 'evection':
        table_objs = ZgLeave.objects.filter(user=user_profile, id=ids)
    elif types == 'reimburse':
        table_objs = ZgReimburse.objects.filter(user=user_profile, id=ids)
    else:
        return JsonResponse({'errno': 5, 'message': '暂无此类审批'})

    if states == '审批通过' or states == '审批未通过':

        review_objs = ZgReview.objects.filter(types=types, table_id=ids, duties='approval')
        if not review_objs:
            return JsonResponse({'errno': 2, 'message': '无此条信息'})

        if states == '审批通过':
            review_objs = review_objs.filter(send_user_id=user_profile.id)
            if types == 'leave' or types == 'evection':
                leave = ZgLeave.objects.filter(id=ids)
                leave.update(status=states)
            elif types == 'reimburse':
                reimburse = ZgReimburse.objects.filter(id=ids)
                reimburse.update(status=states)

        else:
            review_objs.update(status=states)
            if types == 'leave' or types == 'evection':
                leave = ZgLeave.objects.filter(id=ids)
                leave.update(status=states)
            elif types == 'reimburse':
                reimburse = ZgReimburse.objects.filter(id=ids)
                reimburse.update(status=states)

        review_objs.update(status=states)
        return JsonResponse({'errno': 0, 'message': '审批成功'})
        #
        # review_obj = ZgReview.objects.filter(Q(status='审批未通过') | Q(status='审批中') | Q(status='已撤销'), types=types,
        #                                      table_id=ids)

    # ==================================请假
    #         if not review_obj:
    #             ZgAttendance.objects.filter()

    elif states == '发起申请':
        if not table_objs:
            return JsonResponse({'errno': 3, 'message': '无此条信息'})
        table_objs[0].status = states
        table_objs[0].save()
        review_objs = ZgReview.objects.filter(types=types, table_id=ids)
        for review_obj in review_objs:
            review_obj.status = '已撤销'
            review_obj.save()
        return JsonResponse({'errno': 0, 'message': '撤销成功'})
    elif states == '已撤销':
        if not table_objs:
            return JsonResponse({'errno': 3, 'message': '无此条信息'})
        table_objs[0].status = states
        table_objs[0].save()

        review_objs = ZgReview.objects.filter(types=types, table_id=ids)
        for review_obj in review_objs:
            review_obj.status = '已撤销'
            review_obj.save()
        return JsonResponse({'errno': 0, 'message': '撤销成功'})
    else:
        return JsonResponse({'errno': 4, 'message': '无此条信息'})


# 反馈
def table_feedback(request, user_profile):
    req = request.body
    if not req:
        return JsonResponse({'errno': 1, 'message': '参数为空'})
    req = req.decode()
    req = json.loads(req)
    types = req.get('types')
    ids = req.get('id')
    content = req.get('content')

    if not all([types, ids, content]):
        return JsonResponse({'errno': 2, 'message': '缺少参数'})

    Feedback.objects.create(user=user_profile, types=types, table_id=ids, content=content, feedback_time=nuw_time())

    return JsonResponse({'errno': 0, 'message': '反馈成功,'})


# 催办
def zg_urgent(request, user_profile):
    types = request.GET.get('types')
    ids = request.GET.get('id')
    review = ZgReview.objects.filter(status='审批中', types=types, table_id=ids, duties='approval')
    send_list = []

    if review:
        table_type = {'leave': '请假', 'evection': '出差', 'reimburse': '报销'}
        send_list.append(review[0].send_user_id)

        event = {'zg_type': 'Urgent',
                 'time': nuw_time(),
                 'avatar_url': avatar.absolute_avatar_url(user_profile),
                 'user_name': user_profile.full_name,
                 'content': {'type': types,
                             'user_name': user_profile.full_name,
                             'theme': user_profile.full_name + '提醒您审批他的' + table_type[types] + '申请',
                             'id': ids
                             }}
        event = zg_send_tools(event)
        send_event(event, ['23'])
        return JsonResponse({'errno': 0, 'message': '催办成功,'})
    return JsonResponse({'errno': 1, 'message': '催办失败,'})
