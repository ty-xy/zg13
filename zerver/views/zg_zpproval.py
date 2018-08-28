from django.http import JsonResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgLeave, ZgReview, ZgReimburse, Message, UserProfile, Feedback
from zerver.tornado.event_queue import send_event
import json
from datetime import datetime, timezone, timedelta
from zerver.tornado.event_queue import request_event_queue
from zerver.lib.actions import do_send_messages
from zerver.lib import avatar
from django.db.models import Q
from zerver.tornado.event_queue import send_event


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
    event = {'type': 'update_message_flags',
              'operation': 1,
              'flag': 1,
              'messages': 1,
              'all': False}
    aa=int(aa)
    bb=[]
    bb.append(aa)
    send_event(event,bb)
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
    # 审批人
    approver_list = req.get('approver_list')
    # 抄送人
    observer_list = req.get('observer_list')

    if not all([approver_list, approval_type, start_time, end_time, count, cause]):
        return JsonResponse({'errno': 1, 'message': '带*号的是必填参数哦'})

    # try:
    aaa = ZgLeave.objects.create(user=user_profile, approval_type=approval_type, content=content, start_time=start_time,
                                 end_time=end_time,
                                 send_time=nuw_time(),
                                 count=count, cause=cause, img_url=img_url)

    # 添加审批人
    if approver_list:
        for approver in approver_list:
            ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=approver, table_id=aaa.id,
                                    send_time=nuw_time())
    if observer_list:
        for observer in observer_list:
            ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=observer, duties='inform',
                                    table_id=aaa.id, send_time=nuw_time())

    # except Exception:
    # return JsonResponse({'errno': 2, 'message': '发送申请失败'})

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
    image_url = req.get('image_url')
    approver_list = req.get('approver_list')
    observer_list = req.get('observer_list')

    if not all([amount, category, approver_list]):
        JsonResponse({'errno': 2, 'message': '带*号为必填参数'})

    a = ZgReimburse.objects.create(user=user_profile, category=category, amount=amount, detail=detail,
                                   image_url=image_url, send_time=nuw_time())

    if approver_list:
        for approver in approver_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=approver, table_id=a.id,
                                    send_time=nuw_time())
    if observer_list:
        for observer in observer_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=observer, duties='inform',
                                    table_id=a.id, send_time=nuw_time())

    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 待审批列表
def expectation_approval_list(request, user_profile):
    iaitiate_list = []
    review_objs = ZgReview.objects.filter(status='审批中', send_user_id=user_profile.id)
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
    review_objs = ZgReview.objects.filter(Q(status='审批通过')|Q(status='审批未通过'), send_user_id=user_profile.id)

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
            completed_list.append(aa)

    return JsonResponse({'errno': 0, 'message': '成功', 'completed_list': completed_list})


# 我发起的
def approval_initiate_me(request, user_profile):
    # 查询发送人是我的发送人审批人表
    initiate_objs = ZgReview.objects.filter(user=user_profile).order_by().distinct('types', 'table_id')
    initiate_list = []
    if initiate_objs:
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
            bb = ZgReview.objects.filter(types=aa['type'], table_id=aa['id'], status='审批未通过', duties='approval').count()
            cc = ZgReview.objects.filter(types=aa['type'], table_id=aa['id'], status='审批中', duties='approval').count()
            dd = ZgReview.objects.filter(types=aa['type'], table_id=aa['id'], status='已撤销', duties='approval').count()
            if dd > 0:
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
    inform_objs = ZgReview.objects.filter(send_user_id=user_profile.id, duties='inform').order_by()
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
            bb = ZgReview.objects.filter(types=aa['type'], table_id=aa['id'],
                                         status='审批未通过').count()
            cc = ZgReview.objects.filter(types=aa['type'], table_id=aa['id'],
                                         status='审批中').count()

            if bb > 0:
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
    # else:
    #     data['button_status'] =2

    approver_statu = True
    # print(data['button_status'],'--------------------------=-=-=-')
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
    data = {}
    if types == 'reimburse':
        reimburse = ZgReimburse.objects.filter(id=ids)

        if not reimburse:
            return JsonResponse({'errno': 2, 'message': '无效数据'})
        reimburse = reimburse[0]
        data['amount'] = reimburse.amount
        data['category'] = reimburse.category
        data['detail'] = reimburse.detail
        data['image_url'] = reimburse.image_url


    elif types == 'leave' or 'evection':
        reimburse = ZgLeave.objects.filter(id=ids, approval_type=types)
        if not reimburse:
            return JsonResponse({'errno': 3, 'message': '无效数据'})
        reimburse = reimburse[0]

        data['approval_type'] = reimburse.approval_type
        data['start_time'] = reimburse.start_time
        data['end_time'] = reimburse.end_time
        data['count'] = reimburse.count
        data['cause'] = reimburse.cause
        data['img_url'] = reimburse.img_url
    else:
        return JsonResponse({'errno': 4, 'message': '类型错误'})

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
        review_objs = ZgReview.objects.filter(send_user_id=user_profile.id, types=types, table_id=ids)
        if not review_objs:
            return JsonResponse({'errno': 2, 'message': '无此条信息'})
        if types == 'leave' or 'evection':
            leave = ZgLeave.objects.filter(send_user_id=user_profile.id, types=types, table_id=ids)
            leave[0].status = states
            leave[0].save()
        elif types == 'reimburse':
            reimburse = ZgReimburse.objects.filter(send_user_id=user_profile.id, types=types, table_id=ids)
            reimburse[0].status = states
            reimburse[0].save()
        review_objs[0].status = states
        review_objs[0].save()
    elif states == '发起申请':
        if not table_objs:
            return JsonResponse({'errno': 3, 'message': '无此条信息'})
        table_objs[0].status = states
        table_objs[0].save()
        review_objs = ZgReview.objects.filter(types=types, table_id=ids)
        for review_obj in review_objs:
            review_obj.status = '审批中'
            review_obj.save()
    elif states == '已撤销':
        if not table_objs:
            return JsonResponse({'errno': 3, 'message': '无此条信息'})
        table_objs[0].status = states
        table_objs[0].save()

        review_objs = ZgReview.objects.filter(types=types, table_id=ids)
        for review_obj in review_objs:
            review_obj.status = '已撤销'
            review_obj.save()

    else:
        return JsonResponse({'errno': 4, 'message': '无此条信息'})

    return JsonResponse({'errno': 0, 'message': '修改成功'})


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
