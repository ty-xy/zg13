from zerver.models import Message, UserMessage, ZgCollection, Stream, Attachment, ZgCloudDisk, Realm
from django.http import JsonResponse
import json
from datetime import datetime, timezone, timedelta
from zerver.lib import avatar
from django.db.models import Q, F
from dysms_python.demo_sms_send import send_sms
from zerver.views.zg_tools import req_tools
from django.core.cache import cache
import random


# 发送短信验证码
def send_zg_sms(request, user_profile):
    sms = request.GET.get('sms')
    send_type = request.GET.get('type')
    sms_code = '%04d' % random.randint(0, 9999)
    #                   注册，                        更换管理员
    send_sms_dict = {'register': 'SMS_107415213', 'change_admin': 'SMS_107415211'}

    try:
        aaa = send_sms(sms, send_sms_dict[send_type], "{\"code\":\"%s\",\"product\":\"云通信\"}" % sms_code)
    except Exception:
        return JsonResponse({'errno': 1, 'message': '短信发送失败，请检查参数后从新发送'})
    cache.set(sms + '_' + send_type, sms_code, 60)

    return JsonResponse({'errno': 0, 'message': '成功'})


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
    if not subject:
        return JsonResponse({'errno': 2, 'message': '缺少必要参数'})
    Message.objects.filter(subject=subject).delete()
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
                collection_dict['user_name'] = message_obj[0].sender.full_name
                collection_dict['user_avatars'] = avatar.absolute_avatar_url(message_obj[0].sender)
                collection_dict['subject'] = '来自于:' + message_obj[0].subject
                collection_dict['content'] = message_obj[0].content
                collection_dict['collection_time'] = collection_obj.collection_time
                collection_dict['message_id'] = message_obj[0].id
                collection_list.append(collection_dict)

    return JsonResponse({'errno': 0, 'message': '成功', 'collection_list': collection_list})


# 频道权限认证
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
            clouddisk_dict['size'] = str(cloud_disk_obj.size / 1024 / 1024) + 'M'
        elif cloud_disk_obj.size / 1024 > 1:
            clouddisk_dict['size'] = str(cloud_disk_obj.size / 1024) + 'KB'
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
    print(file_name)
    #     file_name = file_name.decode()

    attachment = Attachment.objects.filter(file_name=file_name)
    if not attachment:
        return JsonResponse({'errno': 2, 'message': 'name错误'})
    file_dict = dict()
    attachment = attachment[0]
    if attachment.size / 1024 / 1024 > 1:
        file_dict['size'] = str(attachment.size / 1024 / 1024) + 'M'
    elif attachment.size / 1024 > 1:
        file_dict['size'] = str(attachment.size / 1024) + 'KB'
    else:
        file_dict['size'] = str(attachment.size) + 'b'
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
