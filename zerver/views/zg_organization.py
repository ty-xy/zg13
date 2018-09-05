from django.http import JsonResponse
from zerver.models import Message, ZgDepartment, UserProfile, Realm
from django.db.models import Q
from zerver.lib import avatar
from zerver.views.zg_tools import req_tools
import json


# def zg_address_book(request,user_profile):
#     Message.objects.filter(sender=user_profile,recipient=)


# 部门列表
def department_list(request, user_profile):
    department_lists = []
    department_objs = ZgDepartment.objects.filter(realm=user_profile.realm)
    if department_objs:
        for department_obj in department_objs:
            department = {}
            name = department_obj.name
            user_count = UserProfile.objects.filter(department=department_obj.id, realm=user_profile.realm.id).count()
            department['name'] = name
            department['id'] = department_obj.id
            department['num'] = user_count
            department_lists.append(department)
            not_department_count = UserProfile.objects.filter(department=None, realm=user_profile.realm.id).count()

    return JsonResponse({'errno': 0, 'message': '成功', 'department_lists': department_lists,'not_department_count':not_department_count})


# 没有部门成员
def not_department_user(request, user_profile):
    not_department_list = []
    user_list = UserProfile.objects.filter(department=None, realm=user_profile.realm.id)
    if user_list:
        for user in user_list:
            user_dict = {}
            avatars = avatar.absolute_avatar_url(user)
            name = user.full_name
            user_dict['avatarurl'] = avatars
            user_dict['fullname'] = name
            user_dict['id'] = user.id
            not_department_list.append(user_dict)
    return JsonResponse({'errno': 0, 'message': '成功', 'not_department_list': not_department_list})


# 组织基本信息查看
def organization_information(request, user_profile):
    data = {}
    data['name'] = user_profile.realm.name
    data['description'] = user_profile.realm.description
    return JsonResponse({'errno': 0, 'message': '成功', 'data': data})


# 更改组织基本信息
def put_organization_information(request, user_profile):
    if not user_profile.is_realm_admin:
        return JsonResponse({'errno': 1, 'message': '无权限'})

    req = req_tools(request)
    name = req.get('name')
    description = req.get('description')

    if name:
        user_profile.realm.name = name
    if description:
        user_profile.realm.description = description
    user_profile.save()
    return JsonResponse({'errno': 0, 'message': '成功'})


# 更换管理员
def put_admin(request, user_profile):
    if not user_profile.is_realm_admin:
        return JsonResponse({'errno': 1, 'message': '无权限'})
    req = req_tools(request)
    user_id = req.get('user_id')

    user_profile.is_realm_admin = False

    user_objs = UserProfile.objects.filter(id=user_id)
    if user_objs:
        user_objs[0].is_realm_admin = True
        return JsonResponse({'errno': 0, 'message': '成功'})


# 查看子管理员
def child_admin(request, user_profile):
    child_admin_objs = UserProfile.objects.filter(zg_permission=1, realm=user_profile.realm.id)
    user_list = []
    for child_admin_obj in child_admin_objs:
        user_dict = {}
        user_dict['name'] = child_admin_obj.full_name
        user_dict['avatar'] = avatar.absolute_avatar_url(child_admin_obj)
        user_dict['id'] = child_admin_obj.id
        user_list.append(user_dict)
    return JsonResponse({'errno': 0, 'message': '成功', 'user_list': user_list})


# 更改子管理员
def up_child_admin(request, user_profile):
    req = req_tools(request)
    types = req.get('type')
    ids = req.get('id_list')
    print(types, ids)
    if not all([types, ids]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    for i in ids:
        user_obj = UserProfile.objects.filter(id=i)
        if types == 'add':
            user_obj.update(zg_permission=1)

        elif types == 'del':
            user_obj.update(zg_permission=0)

        print(user_obj[0].zg_permission)
    return JsonResponse({'errno': 0, 'message': '成功'})


# 添加部门
def add_department(request, user_profile):
    req = req_tools(request)
    name = req.get('name')
    if not name:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    try:
        ZgDepartment.objects.create(name=name, realm=user_profile.realm)
    except Exception:
        return JsonResponse({'errno': 0, 'message': '创建部门失败'})
    return JsonResponse({'errno': 0, 'message': '创建部门成功'})


# 批量移动
def user_mobile_batch(request, user_profile):
    req = req_tools(request)
    user_list = req.get('user_list')
    types = req.get('type')
    department_id = req.get('department_id')

    if not all([user_list, types]):
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    for user_id in user_list:
        if types == 'mobile':
            department_objs = ZgDepartment.objects.filter(id=department_id)
            user_objs = UserProfile.objects.filter(id=user_id)
            if not all([department_objs, user_objs]):
                return JsonResponse({'errno': 2, 'message': '移动成员失败'})
            user_objs[0].department = department_objs[0]
            user_objs[0].save()
        
        elif types == 'del':
            # try:
            print(user_id)
            user_obj=UserProfile.objects.get(id=user_id)
            user_obj.department=None
            user_obj.save()
            # except Exception:
            #     return JsonResponse({'errno': 3, 'message': '删除失败'})
    return JsonResponse({'errno': 0, 'message': '成功'})


# 人员详情信息
def user_details(request, user_profile):
    user_id = request.GET.get('user_id')
    if not user_id:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})

    user_obj = UserProfile.objects.filter(id=user_id)

    data = {}
    data['avatarurl'] = avatar.absolute_avatar_url(user_obj[0])
    data['fullname'] = user_obj[0].full_name
    data['id'] = user_obj[0].id
    data['email'] = user_obj[0].email
    data['department'] = user_obj[0].department
    return JsonResponse({'errno': 0, 'message': '成功', 'data': data})


# 解散部门
def department_del(request, user_profile):
    req = req_tools(request)
    department_id = req.get('department_id')

    if not user_profile.is_realm_admin:
        return JsonResponse({'errno': 1, 'message': '无权限'})
    user_objs = ZgDepartment.objects.filter(id=department_id).delete()
    return JsonResponse({'errno': 0, 'message': '成功'})


# 修改部门名称

def department_up(request, user_profile):
    req = req_tools(request)
    department_id = req.get('department_id')

    department_name = req.get('department_name')

    if user_profile.is_realm_admin == 'f' and user_profile.zg_permission != 1:
        return JsonResponse({'errno': 1, 'message': '无权限'})

    aa = ZgDepartment.objects.filter(id=department_id)
    aa.update(name = department_name)

    return JsonResponse({'errno': 0, 'message': '修改成功'})


# 部门人员
def department_user_list(request, user_profile):
    department_id = request.GET.get('department_id')

    if not department_id:
        return JsonResponse({'errno': 1, 'message': '缺少必要参数'})
    user_list = []

    user_objs = UserProfile.objects.filter(department=department_id)
    for i in user_objs:
        user_dict = {}
        user_dict['fullname'] = i.full_name
        user_dict['avatarurl'] = avatar.absolute_avatar_url(i)
        user_dict['id'] = i.id
        user_list.append(user_dict)
    return JsonResponse({'errno': 0, 'message': '成功', 'user_list': user_list})

# 判断权限
def zg_user_permissions(request, user_profile):

    if user_profile.is_realm_admin == 'f' or user_profile.zg_permission is None:
        return JsonResponse({'errno': 0, 'message': False})

    else:
        return JsonResponse({'errno': 0, 'message': True})
