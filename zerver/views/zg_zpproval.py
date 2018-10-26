from django.http import JsonResponse
from zerver.decorator import zulip_login_required
from zerver.models import ZgLeave, ZgReview, ZgReimburse, UserProfile, Feedback, ZgCorrectzAccessory, Attachment, \
    ZgWorkNotice, ZgPurchase, JobsPlease, ProjectProgress
import json
from datetime import datetime, timezone, timedelta
from zerver.lib import avatar
from django.db.models import Q
from zerver.tornado.event_queue import send_event
from zerver.views.zg_tools import zg_send_tools, send_approver_observer
from zerver.views.zg_tools import req_tools


def nuw_time():
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    return stockpile_time


zpproval = {'leave': '的请假申请', 'evection': '的出差申请', 'reimburse': '的报销申请',
            'jobs_please': '的工作请示', 'purchase': '的采购申请',
            'project_progress': '的工程进度汇报', }

zpproval_obj = {'leave': ZgLeave, 'evection': ZgLeave, 'reimburse': ZgReimburse,
                'jobs_please': JobsPlease, 'purchase': ZgPurchase,
                'project_progress': ProjectProgress, }


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


# 采购
def zg_purchase(request, user_profile):
    req = req_tools(request)
    reason = req.get('reason')
    # 预计采购日期
    purchase_date = req.get('purchase_date')
    # 物品名称
    goods_name = req.get('goods_name')
    # 物品规格
    specification = req.get('specification')
    # 单价
    unit_price = req.get('unit_price')
    # 数量
    count = req.get('count')
    # 总价
    total_prices = req.get('total_prices')

    img_url = req.get('img_url')
    approver_list = req.get('approver_list')
    observer_list = req.get('observer_list')

    if not all([reason, purchase_date, goods_name, unit_price, count, total_prices, approver_list]):
        return JsonResponse({'errno': 1, 'message': '缺少参数'})
    # try:
    print(nuw_time)
    purchase = ZgPurchase.objects.create(user=user_profile,
                                         reason=reason,
                                         puchase_date=purchase_date,
                                         goods_name=goods_name,
                                         specification=specification,
                                         unit_price=unit_price,
                                         count=count,
                                         total_prices=total_prices,
                                         send_time=nuw_time())
    event = dict()

    send_approver_observer(user_profile, purchase.id, 'purchase', approver_list, observer_list,
                           img_url, event,
                           reason, total_prices)
    # except Exception as e:
    #     print(e)
    #     return JsonResponse({'errno': 2, 'message': '发送申请失败'})
    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 工作请示
def jobs_please(request, user_profile):
    req = req_tools(request)
    reason = req.get('reason')
    urgency_degree = req.get('urgency_degree')
    jobs_date = req.get('jobs_date')
    content = req.get('content')

    img_url = req.get('img_url')
    approver_list = req.get('approver_list')
    observer_list = req.get('observer_list')
    if not all([reason, urgency_degree, approver_list]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    try:
        jobs_please = JobsPlease.objects.create(user=user_profile, reason=reason, urgency_degree=urgency_degree,
                                                jobs_date=jobs_date,
                                                content=content, send_time=nuw_time())
        event = dict()
        send_approver_observer(user_profile, jobs_please.id, 'jobs_please', approver_list, observer_list, img_url,
                               event,
                               reason, urgency_degree)
    except Exception as e:
        print(e)
        return JsonResponse({'errno': 2, 'message': '发送申请失败'})
    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 工程进度汇报
def project_progress(request, user_profile):
    req = req_tools(request)
    project_name = req.get('project_name')
    happening = req.get('happening')
    quality = req.get('quality')
    issue = req.get('issue')
    scheme = req.get('scheme')
    worker_improve = req.get('worker_improve')
    coordinate_department = req.get('coordinate_department')
    complete_time = req.get('complete_time')
    remark = req.get('remark')

    img_url = req.get('img_url')
    observer_list = req.get('observer_list')

    if not all([project_name, happening, quality, complete_time, observer_list]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    try:
        project_progress = ProjectProgress.objects.create(user=user_profile, project_name=project_name,
                                                          happening=happening,
                                                          quality=quality,
                                                          issue=issue, scheme=scheme, worker_improve=worker_improve,
                                                          coordinate_department=coordinate_department,
                                                          complete_time=complete_time,
                                                          remark=remark, send_time=nuw_time())

        event = dict()
        approver_list = []
        send_approver_observer(user_profile, project_progress.id, 'project_progress', approver_list, observer_list,
                               img_url, event, project_name, happening)
    except Exception as e:
        print(e)
        return JsonResponse({'errno': 2, 'message': '发送申请失败'})
    return JsonResponse({'errno': 0, 'message': '申请成功'})


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
            event['theme'] = user_profile.full_name + '的' + types + '申请需要您的审批'
            for approver in approver_list:
                ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=approver, table_id=aaa.id,
                                        send_time=nuw_time())
                user = UserProfile.objects.get(id=approver)
                ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=cause,
                                            third=start_time + '～' + end_time, send_time=nuw_time(),
                                            table_type=approval_type, table_id=aaa.id)
            send_event(event, approver_list)

        if observer_list:
            event['theme'] = user_profile.full_name + '的' + types + '申请需要您知晓'
            for observer in observer_list:
                ZgReview.objects.create(types=approval_type, user=user_profile, send_user_id=observer, duties='inform',
                                        table_id=aaa.id, send_time=nuw_time())

                user = UserProfile.objects.get(id=observer)
                ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=cause,
                                            third=start_time + '～' + end_time, send_time=nuw_time(),
                                            table_type=approval_type, table_id=aaa.id)

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
        event['theme'] = user_profile.full_name + '的' + '报销' + '申请需要您的审批'
        for approver in approver_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=approver, table_id=a.id,
                                    send_time=nuw_time())

            user = UserProfile.objects.get(id=approver)
            ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=amount,
                                        third=category, send_time=nuw_time(),
                                        table_type='reimburse', table_id=a.id)

        send_event(event, approver_list)
    if observer_list:
        event['theme'] = user_profile.full_name + '的' + '报销' + '申请需要您的知晓'
        for observer in observer_list:
            ZgReview.objects.create(types='reimburse', user=user_profile, send_user_id=observer, duties='inform',
                                    table_id=a.id, send_time=nuw_time())
            user = UserProfile.objects.get(id=observer)
            ZgWorkNotice.objects.create(user=user, notice_type='审批', stair=event['theme'], second=amount,
                                        third=category, send_time=nuw_time(),
                                        table_type='reimburse', table_id=a.id)

        send_event(event, approver_list)
    #
    # ZgWorkNotice.objects.create(notice_type='审批', headline=event['theme'], subtitle=category,
    #                             time_quantum=start_time + '～' + end_time, send_time=nuw_time(),
    #                             table_type=approval_type, table_id=aaa.id)

    return JsonResponse({'errno': 0, 'message': '申请成功'})


# 待审批列表
def expectation_approval_list(request, user_profile):
    iaitiate_list = []
    review_objs = ZgReview.objects.filter(status='审批中', send_user_id=user_profile.id, duties='approval').order_by('-id')
    if review_objs:
        for review_obj in review_objs:
            aa = {}
            name = zpproval[review_obj.types]
            aa['name'] = review_obj.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(review_obj.user)
            aa['type'] = review_obj.types
            aa['id'] = review_obj.table_id
            aa['status'] = review_obj.status
            aa['send_time'] = review_obj.send_time
            if review_obj.types == project_progress:
                aa['status'] = '未读'
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
            name = zpproval[review_obj.types]
            aa['name'] = review_obj.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(review_obj.user)
            aa['type'] = review_obj.types
            aa['id'] = review_obj.table_id
            aa['send_time'] = review_obj.send_time


            if review_obj.types == 'leave' or review_obj.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=review_obj.table_id, approval_type=review_obj.types)

            else:
                reimburse = zpproval_obj[review_obj.types].objects.filter(id=review_obj.table_id)

            bb = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批未通过', duties='approval').count()
            cc = ZgReview.objects.filter(table_id=aa['id'], types=aa['type'], status='审批中', duties='approval').count()

            if reimburse[0].status == '已撤销':
                aa['status'] = '已撤销'
            elif review_obj.types=='project_progress':
                aa['status'] ='已读'

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
    initiate_objs = ZgReview.objects.filter(id__in=initiate_ids).distinct('table_id', 'types')
    print(ZgReview.objects.filter(id__in=initiate_ids).distinct('table_id', 'types'))
    initiate_list = []
    if initiate_objs is not None:
        for initiate_obj in initiate_objs:
            aa = {}
            name = zpproval[initiate_obj.types]
            aa['name'] = user_profile.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(user_profile)
            aa['type'] = initiate_obj.types
            aa['id'] = initiate_obj.table_id

            if initiate_obj.types == 'leave' or initiate_obj.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=initiate_obj.table_id, approval_type=initiate_obj.types)

            else:
                reimburse = zpproval_obj[initiate_obj.types].objects.filter(id=initiate_obj.table_id)

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

            if initiate_obj.types == 'project_progress':
                aa['status'] = initiate_obj.is_know

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
            name = zpproval[inform.types]
            aa['name'] = inform.user.full_name + name
            aa['user_avatar'] = avatar.absolute_avatar_url(inform.user)
            aa['type'] = inform.types
            aa['id'] = inform.table_id

            if inform.types == 'leave' or inform.types == 'evection':
                reimburse = ZgLeave.objects.filter(id=inform.table_id, approval_type=inform.types)

            else:
                reimburse = zpproval_obj[inform.types].objects.filter(id=inform.table_id)

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

    review_objs = ZgReview.objects.filter(send_user_id=user_profile.id, types=types, table_id=ids)
    if review_objs:
        review_objs.update(is_know=True)
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
    data['head_name'] = table_obj.user.full_name + zpproval[types]
    data['head_avatar'] = avatar.absolute_avatar_url(table_obj.user)
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
        data['approval_type'] = 'reimburse'
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='reimburse', table_id=ids)

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

    elif types == 'jobs_please':
        reimburse = JobsPlease.objects.filter(id=ids)
        if not reimburse:
            return JsonResponse({'errno': 3, 'message': '无效数据'})
        reimburse = reimburse[0]
        data['reason'] = reimburse.reason
        data['approval_type'] = 'jobs_please'
        data['urgency_degree'] = reimburse.urgency_degree
        data['jobs_date'] = reimburse.jobs_date
        data['content'] = reimburse.content
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='jobs_please', table_id=ids)
    elif types == 'purchase':
        reimburse = ZgPurchase.objects.filter(id=ids)
        if not reimburse:
            return JsonResponse({'errno': 3, 'message': '无效数据'})
        reimburse = reimburse[0]
        data['approval_type'] = 'purchase'
        data['reason'] = reimburse.reason
        data['puchase_date'] = reimburse.puchase_date
        data['goods_name'] = reimburse.goods_name
        data['specification'] = reimburse.specification
        data['unit_price'] = reimburse.unit_price
        data['count'] = reimburse.count
        data['total_prices'] = reimburse.total_prices
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='purchase', table_id=ids)
    elif types == 'project_progress':
        reimburse = ProjectProgress.objects.filter(id=ids)
        if not reimburse:
            return JsonResponse({'errno': 3, 'message': '无效数据'})
        reimburse = reimburse[0]
        review_obj = ZgReview.objects.filter(types=types, table_id=ids, send_user_id=user_profile.id)
        review_obj.update(is_know=True, status='审批通过')
        data['approval_type'] = 'project_progress'
        data['project_name'] = reimburse.project_name
        data['happening'] = reimburse.happening
        data['quality'] = reimburse.quality
        data['issue'] = reimburse.issue
        data['scheme'] = reimburse.scheme
        data['worker_improve'] = reimburse.worker_improve
        data['coordinate_department'] = reimburse.coordinate_department
        data['complete_time'] = reimburse.complete_time
        data['remark'] = reimburse.remark
        data['head_name'] = reimburse.user.full_name + zpproval[types]
        data['head_avatar'] = avatar.absolute_avatar_url(reimburse.user)
        accessorys = ZgCorrectzAccessory.objects.filter(correctz_type='project_progress', table_id=ids)
        for accessory in accessorys:
            img_list.append('/user_uploads/' + accessory.attachment.path_id)
        data['image_url'] = img_list
        reads = ZgReview.objects.filter(is_know=True, types=project_progress, table_id=ids)
        unreads = ZgReview.objects.filter(is_know=False, types=project_progress, table_id=ids)
        data['read_count'] = reads.count()
        data['unread_count'] = unreads.count()
        data['read_list'] = list()
        data['unread_list'] = list()
        for read in reads:
            feedback_dict = {}
            user = UserProfile.objects.get(id=read.send_user_id)
            feedback_dict['user_avatar'] = avatar.absolute_avatar_url(user.user)
            feedback_dict['user_name'] = user.user.full_name
            data['read_list'].append(feedback_dict)
        for unread in unreads:
            feedback_dict = {}
            user = UserProfile.objects.get(id=unread.send_user_id)
            feedback_dict['user_avatar'] = avatar.absolute_avatar_url(user.user)
            feedback_dict['user_name'] = user.user.full_name
            data['unread_list'].append(feedback_dict)

        feedback_objs = Feedback.objects.filter(types='project_progress', table_id=ids)
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
        JsonResponse({'errno': 0, 'message': '成功', 'data': data})
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
    else:
        try:
            table_objs = zpproval_obj[types].objects.filter(user=user_profile, id=ids)
        except Exception:
            return JsonResponse({'errno': 2, 'message': '无此条信息'})

    if states == '审批通过' or states == '审批未通过':

        review_objs = ZgReview.objects.filter(types=types, table_id=ids, duties='approval')
        if not review_objs:
            return JsonResponse({'errno': 2, 'message': '无此条信息'})

        if states == '审批通过':
            review_objs = review_objs.filter(send_user_id=user_profile.id)
            if types == 'leave' or types == 'evection':
                leave = ZgLeave.objects.filter(id=ids)
                leave.update(status=states)
            else:
                reimburse = zpproval_obj[types].objects.filter(id=ids)
                reimburse.update(status=states)

        else:
            review_objs.update(status=states)
            if types == 'leave' or types == 'evection':
                leave = ZgLeave.objects.filter(id=ids)
                leave.update(status=states)
            elif types == 'reimburse':
                reimburse = zpproval_obj[types].objects.filter(id=ids)
                reimburse.update(status=states)

        review_objs.update(status=states)
        return JsonResponse({'errno': 0, 'message': '审批成功'})

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
        table_type = {'evection': '出差申请', 'leave': '请假申请', 'purchase': '采购申请', 'jobs_please': '工作请示',
                 'project_progress': '工程进度汇报'}
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
