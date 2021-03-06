from zerver.models import Message, UserMessage, ZgCollection, Stream, Attachment, ZgCloudDisk, Realm, UserProfile, \
    active_user_ids, Recipient, StatementState, ZgReview, ZgWorkNotice, get_stream_recipient
from django.http import JsonResponse
import json
from datetime import datetime, timezone, timedelta
from zerver.lib import avatar
from django.db.models import Q, F
from dysms_python.demo_sms_send import send_sms
from zerver.views.zg_tools import req_tools
from django.core.cache import cache
import random
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from zerver.tornado.event_queue import send_event
from django.shortcuts import redirect, render
from zerver.views.zg_tools import req_tools, zg_send_tools
import time


# 审批通知列表
def approval_notice(request, user_profile):
    notice_type = request.GET.get('notice_type')
    work_notice_list = list()
    if not notice_type:
        work_notices = ZgWorkNotice.objects.filter(user=user_profile).order_by('-id')
    else:
        work_notices = ZgWorkNotice.objects.filter(user=user_profile, notice_type=notice_type).order_by('-id')
    for work_notice in work_notices:
        work_notice_dict = dict()
        work_notice_dict['notice_type'] = work_notice.notice_type
        work_notice_dict['stair'] = work_notice.stair
        work_notice_dict['second'] = work_notice.second
        work_notice_dict['third'] = work_notice.third
        work_notice_dict['send_time'] = work_notice.send_time
        aa = work_notice.send_time.split('.')[0]
        print(aa)
        timeArray = time.strptime(aa, "%Y-%m-%d %H:%M:%S")
        timeStamp = int(time.mktime(timeArray))
        work_notice_dict['timestamp'] = timeStamp
        work_notice_dict['table_type'] = work_notice.table_type
        work_notice_dict['table_id'] = work_notice.table_id
        work_notice_dict['table_state'] = work_notice.table_state
        work_notice_list.append(work_notice_dict)

    return JsonResponse({'errno': 0, 'message': '成功', 'work_notice_list': work_notice_list})


# 获取初始化日志,通知信息
def zg_initialize_log(request, user_profile):
    statement_state = StatementState.objects.filter(staff=user_profile.id, state='f')
    # 待审批
    review_objs = ZgReview.objects.filter(status='审批中', send_user_id=user_profile.id, duties='approval',
                                          is_know=False).order_by('-id')
    # 抄送我的
    inform_objs = ZgReview.objects.filter(send_user_id=user_profile.id, duties='inform', is_know=False).order_by('-id')
    data = dict()
    type_dict = {'leave': '的请假申请', 'evection': '的出差申请', 'reimburse': '的报销申请',
                 'jobs_please': '的工作请示', 'purchase': '的采购申请',
                 'project_progress': '的工程进度汇报', }
    if not statement_state:
        data['log_inform'] = None
        data['log_count'] = None

    else:
        user_id = statement_state.order_by('-id')[0].statement_id.user
        user = UserProfile.objects.get(email=user_id)
        data['log_inform'] = user.full_name + '的日志'
        data['log_count'] = statement_state.count()
        data['log_time'] = statement_state.order_by('-id')[0].receive_time

    if not all([review_objs, inform_objs]):
        data['review_inform'] = None
        data['review_count'] = None
    else:
        data['review_count'] = inform_objs.count() + review_objs.count()
        if review_objs:
            review_obj_send = review_objs[0].send_time
        else:
            review_obj_send = None
        if inform_objs:
            inform_obj_send = inform_objs[0].send_time
        else:
            inform_obj_send = None

        if review_obj_send >= inform_obj_send:
            data['review_inform'] = review_objs[0].user.full_name + '的' + type_dict[review_objs[0].types] + '需要您审批'
            data['review_time'] = review_obj_send
        else:
            data['review_inform'] = inform_objs[0].user.full_name + '的' + type_dict[review_objs[0].types] + '需要您知晓'
            data['review_time'] = inform_obj_send

    return JsonResponse({'errno': 0, 'message': "成功", 'data': data})


# # # 发送短信验证码
def send_zg_sms(request):
    sms = request.GET.get('sms')
    send_type = request.GET.get('type')
    sms_code = '%04d' % random.randint(0, 9999)
    #                   注册，                        更换管理员                      更改密码
    send_sms_dict = {'register': 'SMS_107415213', 'change_admin': 'SMS_107415211', 'new_password': 'SMS_107415212'}

    try:
        aaa = send_sms(sms, send_sms_dict[send_type], "{\"code\":\"%s\",\"product\":\"云通信\"}" % sms_code)
    except Exception:
        return JsonResponse({'errno': 1, 'message': '短信发送失败，请检查参数后从新发送'})
    cache.set(sms + '_' + send_type, sms_code, 300)
    print(sms)
    print(sms_code)
    #
    return JsonResponse({'errno': 0, 'message': '成功'})


# 修改密码
@csrf_exempt
def new_password(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        sms_code = request.POST.get('sms_code')
        new_password = request.POST.get('new_password')
        print(phone, sms_code, new_password)
        if not all([phone, sms_code, new_password]):
            return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

        if not cache.get(phone + '_new_password'):
            return JsonResponse({'errno': 2, 'message': '验证码错误'})
        users = UserProfile.objects.filter(email=phone + '@zulip.com')
        if users:
            users[0].set_password(new_password)
            users[0].save()
            return JsonResponse({'errno': 0, 'message': '修改成功'})
        return JsonResponse({'errno': 3, 'message': '输入错误'})


@csrf_exempt
def app_nue_password(request):
    phone = request.POST.get('phone')
    smscode = request.POST.get('smscode')
    password1 = request.POST.get('password1')
    password2 = request.POST.get('password2')

    if not all([phone, smscode, password1, password2]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    pass


def nuw_time():
    stockpile_time = datetime.utcnow()
    stockpile_time = stockpile_time.replace(tzinfo=timezone.utc)
    tzutc_8 = timezone(timedelta(hours=8))
    stockpile_time = stockpile_time.astimezone(tzutc_8)
    return stockpile_time


# 删除主题
def del_subject(request, user_profile):
    req = request.body
    if not req:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    req = req.decode()
    req = json.loads(req)
    subject = req.get('subject')
    stream_id = req.get('stream_id')
    if not all([subject, stream_id]):
        return JsonResponse({'errno': 2, 'message': '缺少必要参数'})
    recipient = get_stream_recipient(stream_id)
    Message.objects.filter(subject=subject, recipient=recipient).delete()
    event = {'zg_type': 'del_subject',
             'subject': subject,
             'stream_id': stream_id
             }
    event = zg_send_tools(event)
    user_list = UserProfile.objects.values_list('id',flat=True)
    send_event(event,user_list)

    return JsonResponse({'errno': 0, 'message': '删除成功'})


# 收藏
def zg_collection(request, user_profile):
    req = req_tools(request)
    types = req.get('type')
    type_id = req.get('type_id')
    # 状态
    status = req.get('status')
    flagattr = getattr(UserMessage.flags, 'starred')
    if types == 'message':
        message_objs = Message.objects.filter(id=type_id)
        if not message_objs:
            return JsonResponse({'errno': 1, 'message': '消息ID错误'})
        msgs = UserMessage.objects.filter(user_profile=user_profile,
                                          message=type_id)
        if status == 'add':
            try:
                msgs.update(flags=F('flags').bitor(flagattr))
                ZgCollection.objects.create(user=user_profile, types=types, type_id=type_id, collection_time=nuw_time())
            except Exception as e:
                print(e)
                return JsonResponse({'errno': 3, 'message': '收藏失败'})
            return JsonResponse({'errno': 0, 'message': '收藏成功'})
        elif status == 'remove':
            try:
                msgs.update(flags=F('flags').bitand(~flagattr))
                ZgCollection.objects.filter(types=types, type_id=type_id).delete()
            except Exception as e:
                print(e)
                return JsonResponse({'errno': 3, 'message': '删除失败'})
            return JsonResponse({'errno': 0, 'message': '取消收藏成功'})
        else:
            raise AssertionError("Invalid message flags operation")

    else:
        return JsonResponse({'errno': 2, 'message': '类型错误'})


# 收藏列表
def zg_collection_list(request, user_profile):
    collection_objs = ZgCollection.objects.filter(user=user_profile).order_by()
    collection_list = list()
    for collection_obj in collection_objs:
        collection_dict = {}

        if collection_obj.types == 'message':
            message_obj = Message.objects.filter(id=collection_obj.type_id)

            if message_obj:
                content = message_obj[0].content
                collection_dict['user_name'] = message_obj[0].sender.full_name
                collection_dict['user_avatars'] = avatar.absolute_avatar_url(message_obj[0].sender)
                if not message_obj[0].subject:
                    collection_dict['subject'] = '来自于:私聊'
                else:
                    collection_dict['subject'] = '来自于:' + message_obj[0].subject
                collection_dict['content'] = message_obj[0].content
                collection_dict['collection_time'] = collection_obj.collection_time
                collection_dict['message_id'] = message_obj[0].id
                collection_list.append(collection_dict)
                collection_dict['type'] = None

                if len(content.split('.')) == 3:
                    if len(content.split('.')[2]) == 3 or len(content.split('.')[2]) == 4:
                        collection_dict['name'] = content.split(']')[0][1:]
                        collection_dict['type'] = content.split('.')[2][0:-1]
                        collection_dict['content'] = 'http://' + request.META['HTTP_HOST'] + content.split('(')[
                                                                                                 1][0:-1]
                if len((content.split('.'))) > 3:
                    if content.split('.')[-1] == 'aac':
                        collection_dict['type'] = 'aac'
                        # collection_dict['content'] = content.split('(')[1][0:-1]

    return JsonResponse({'errno': 0, 'message': '成功', 'collection_list': collection_list})


# 群组权限认证
def zg_stream_permissions(request, user_profile):
    stream_id = request.GET.get('stream_id')
    try:
        stream = Stream.objects.get(id=int(stream_id))
    except Exception as e:
        print(e)
        return JsonResponse({'errno': 1, 'message': 'id错误'})
    stream_permissions = False
    if stream.create_user_id == user_profile.id or user_profile.is_realm_admin:
        stream_permissions = True
    return JsonResponse({'errno': 0, 'message': 'id错误', 'stream_permissions': stream_permissions})


# 添加用户云盘
def zg_abb_clouddisk(request, user_profile):
    req = req_tools(request)
    file_name = req.get('name')
    if not file_name:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    attachment = Attachment.objects.filter(file_name=file_name)
    if not attachment:
        return JsonResponse({'errno': 2, 'message': 'name错误'})
    try:
        ZgCloudDisk.objects.create(attachment=attachment[0], user=user_profile)
    except Exception as e:
        print(e)
        return JsonResponse({'errno': 3, 'message': '添加云盘失败'})

    return JsonResponse({'errno': 0, 'message': '添加云盘成功'})


# 查看云盘列表
def user_clouddisk(request, user_profile):
    clouddisk_list = []
    cloud_disk_objs = ZgCloudDisk.objects.filter(user=user_profile.id)

    for cloud_disk_obj in cloud_disk_objs:
        cloud_disk_obj = cloud_disk_obj.attachment
        clouddisk_dict = dict()

        if cloud_disk_obj.size / 1024 / 1024 > 1:
            clouddisk_dict['size'] = str(round(cloud_disk_obj.size / 1024 / 1024, 2)) + 'M'
        elif cloud_disk_obj.size / 1024 > 1:
            clouddisk_dict['size'] = str(round(cloud_disk_obj.size / 1024, 2)) + 'KB'
        else:
            clouddisk_dict['size'] = cloud_disk_obj.size
        clouddisk_dict['name'] = cloud_disk_obj.file_name
        clouddisk_dict['path'] = cloud_disk_obj.path_id
        clouddisk_dict['create_time'] = cloud_disk_obj.create_time
        clouddisk_dict['id'] = cloud_disk_obj.id
        clouddisk_list.append(clouddisk_dict)
    return JsonResponse({'errno': 0, 'message': '成功', 'clouddisk_list': clouddisk_list})


# 查看文件详情
def file_details(request, user_profile):
    file_name = request.GET.get('name')
    # file_name=file_name[1:-1]
    if not file_name:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    # 缺少必要参数    file_name.encode()
    #     file_name = file_name.decode()

    attachment = Attachment.objects.filter(file_name=file_name)
    if not attachment:
        return JsonResponse({'errno': 2, 'message': 'name错误'})
    file_dict = dict()
    attachment = attachment[0]
    file_dict['size'] = attachment.size
    file_dict['name'] = attachment.file_name
    file_dict['url'] = attachment.path_id
    file_dict['create_time'] = attachment.create_time
    return JsonResponse({'errno': 0, 'message': '成功', 'file_dict': file_dict})


# 删除文件
def file_del(request, user_profile):
    req = req_tools(request)
    del_id = req.get('id')
    try:
        ZgCloudDisk.objects.get(id=del_id).delete()
    except Exception as e:
        print(e)
        return JsonResponse({'errno': 0, 'message': '删除失败'})

    return JsonResponse({'errno': 0, 'message': '删除成功'})


# 修改用户名
def update_user_full_name(request, user_profile):
    req = req_tools(request)
    full_name = req.get('full_name')

    if not full_name:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    payload = dict(email=user_profile.email,
                   user_id=user_profile.id,
                   full_name=full_name)
    send_event(dict(type='realm_user', op='update', person=payload),
               active_user_ids(user_profile.realm_id))
    user_profile.full_name = full_name
    user_profile.save()

    return JsonResponse({'errno': 0, 'message': '成功'})


# 验证用户
@csrf_exempt
def verification_user(request):
    if request.method == 'GET':
        phone = request.GET.get('phone')

        user = UserProfile.objects.filter(email=phone + '@zulip.com')
        if not user:
            return JsonResponse({'errno': 0, 'message': '成功'})

        return JsonResponse({'errno': 1, 'message': '该用户已注册'})


# web验证注册手机验证码是否正确
@csrf_exempt
def sms_verification(request):
    if request.method == 'GET':
        sms_code = request.GET.get('sms_code')
        phone = request.GET.get('phone')
        if not all([sms_code, phone]):
            return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

        if sms_code == cache.get(phone + '_register'):
            return JsonResponse({'errno': 0, 'message': '成功'})
        return JsonResponse({'errno': 2, 'message': '验证码错误'})
