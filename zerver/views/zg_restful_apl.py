from zerver.models import Message, UserMessage, ZgCollection, Stream, Attachment, ZgCloudDisk
from django.http import JsonResponse
from zerver.decorator import zulip_login_required
from zerver.tornado.event_queue import send_event
import json
from datetime import datetime, timezone, timedelta
from zerver.tornado.event_queue import request_event_queue
from zerver.lib.actions import do_send_messages
from zerver.lib import avatar
from django.db.models import Q, F
from zerver.tornado.event_queue import send_event
from zerver.views.zg_tools import zg_user_info

from zerver.views.zg_tools import req_tools


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
                                          message__id__in=type_id)

        if status == 'add':

            try:
                msgs.update(flags=F('flags').bitor(flagattr))
                ZgCollection.objects.create(user=user_profile, types=types, type_id=type_id, collection_time=nuw_time())
            except Exception:
                return JsonResponse({'errno': 3, 'message': '收藏失败'})
        elif status == 'remove':
            try:
                msgs.update(flags=F('flags').bitand(~flagattr))
                ZgCollection.objects.filter(types=types, type_id=type_id).delete()
            except Exception:
                return JsonResponse({'errno': 3, 'message': '删除失败'})
        else:
            raise AssertionError("Invalid message flags operation")

    else:
        return JsonResponse({'errno': 2, 'message': '类型错误'})

    return JsonResponse({'errno': 0, 'message': '收藏成功'})


# 收藏列表
def zg_collection_list(request, user_profile):
    collection_objs = ZgCollection.objects.filter(user=user_profile).order_by()

    collection_list = list()
    for collection_obj in collection_objs:
        collection_dict = {}

        if collection_obj.types == 'message':
            message_obj = Message.objects.filter(id=collection_obj.type_id)
            collection_dict['user_name'] = message_obj.sender.full_name
            collection_dict['user_avatars'] = avatar.absolute_avatar_url(message_obj.sender)
            collection_dict['subject'] = '来自于:' + message_obj.subject
            collection_dict['content'] = message_obj.content
            collection_dict['collection_time'] = collection_obj.collection_time
            collection_list.append(collection_dict)

    return JsonResponse({'errno': 0, 'message': '成功', 'collection_list': collection_list})


# 频道权限认证
def zg_stream_permissions(request, user_profile):
    stream_id = request.GET.get('stream_id')
    try:
        stream = Stream.objects.get(id=stream_id)
    except Exception:
        return JsonResponse({'errno': 1, 'message': 'id错误'})
    stream_permissions = False
    if stream.create_user_id == user_profile.id or user_profile.is_realm_admin:
        stream_permissions = True
    return JsonResponse({'errno': 0, 'message': 'id错误', 'stream_permissions': stream_permissions})


# 添加用户云盘
def zg_abb_clouddisk(request, user_profile):
    req = req_tools(request)
    path_id = req.get('path_id')
    if not path_id:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    attachment = Attachment.objects.filter(path_id=path_id)
    if not attachment:
        return JsonResponse({'errno': 2, 'message': 'path_id错误'})
    try:
        ZgCloudDisk.objects.create(attachment=attachment[0], user=user_profile)
    except Exception:
        return JsonResponse({'errno': 3, 'message': '添加云盘失败'})

    return JsonResponse({'errno': 0, 'message': '添加云盘成功'})


# 查看云盘列表
def user_clouddisk(request, user_profile):
    clouddisk_list = []
    cloud_disk_objs = ZgCloudDisk.objects.filter(user=user_profile.id)

    for cloud_disk_obj in cloud_disk_objs:
        clouddisk_dict = dict()

        if cloud_disk_obj.sizi/1024/1024>1:
            clouddisk_dict['size'] = str(cloud_disk_obj.size/1024/1024)+'M'
        elif cloud_disk_obj.size / 1024 > 1:
            clouddisk_dict['size'] = str(cloud_disk_obj.size/1024)+'KB'
        else:
            clouddisk_dict['size'] =cloud_disk_obj.size
        clouddisk_dict['name'] = cloud_disk_obj.file_name
        clouddisk_dict['url'] = cloud_disk_obj.path_id
        clouddisk_dict['create_time'] = cloud_disk_obj.create_time
        clouddisk_list.append(clouddisk_dict)
    return JsonResponse({'errno': 0, 'message': '成功','clouddisk_list':clouddisk_list})

