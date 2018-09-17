var contact = (function(){
    var exports = {};
    $("body").ready(function(){
        $("#global_filters li a").on("click",function(){
            $(this).addClass("left_blue_height").parent().siblings().children().removeClass("left_blue_height")
        })
        //私聊点击
        $(".private_button").on("click",function(){
            $(".organization_team").hide()
            $(".keep_exist").show()
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            $(".group_icon").hide()
            //添加默认空白
            $(".move_ctn").append(templates.render("right_blank_page"))
            //清空列表
            $(".notice_ctn_box").children().remove();
            $("#main_div").hide();
            $("#compose").hide();
            $(".tab-content").css("height","calc(100% - 232px)")
        })
        //联系人点击
        $(".contact").off().on("click",function(){
            $.ajax({
                url:"json/zg/user",
                type:"GET",
                success:function(res){
                    initStyle()
                    $(".notice_ctn_box").children().remove();
                    var user_list = res.user_list;
                    var user_list_our = templates.render("user_list_our",{user_list:user_list})
                    $(".notice_ctn_box").append(user_list_our)
                    $(".notice_ctn_box").append(templates.render("invited_users"))
                    //点击联系人弹出右边页面
                    $(".notice_ctn_box").on("click",".user_list_box",function(){
                        $("#zfilt").children().remove();
                        $(".move_ctn").children().remove();
                        $(".move_ctn").show()
                        $("#main_div").hide();
                        $("#compose").hide();
                        var user_name = $(this).children().last().text();
                        var user_id = $(this).attr("user_id");
                        var email = $(this).attr("email");
                        var avatar = $(this).children().first().children().attr("src")
                        var short_name = $(this).attr("short_name");
                        var _href = "#narrow/pm-with/"+user_id+"-"+short_name
                        var user_detail_contact = templates.render("user_detail_contact",{user_name:user_name,user_id:user_id,email:email,avatar:avatar,_href:_href,short_name:short_name})
                        $(".move_ctn").append(user_detail_contact)
                        //发送消息点击事件
                        $(".user_detail_send").on("click",function(){
                            $(".move_ctn").children().remove();
                            $("#main_div").show();
                            $("#compose").show();
                            $(".group_icon").hide();
                            $(".persistent_data").show()
                            $(".tab-content").css("height","calc(100% - 232px)")
                            //上方显示聊天对面信息
                            //获取更新消息列表
                            $(".persistent_data").show();
                            var _time = new Date()
                            var time = _time.getHours() +':'+_time.getMinutes()
                            var arr = JSON.parse(localStorage.getItem("arr"))
                            if(arr == null){
                                arr = []
                                $(".persistent_data").prepend(templates.render("notice_box",{name:user_name,avatar:avatar,_href:_href,time:time,send_id:user_id}))
                                arr.push(server_events.set_local_news(user_id,'',user_name,avatar,time,'',_href))
                                localStorage.setItem("arr",JSON.stringify(arr))
                            }else{
                                var flag = false;
                                for(var i =0;i<arr.length;i++){
                                    if(arr[i].send_id == user_id){
                                        flag = true;
                                        arr[i].content = arr[i].content
                                        localStorage.setItem("arr",JSON.stringify(arr))
                                    }
                                }
                                if(!flag){
                                    $(".persistent_data").prepend(templates.render("notice_box",{name:user_name,avatar:avatar,_href:_href,time:time,send_id:user_id}))
                                    arr.push(server_events.set_local_news(user_id,'',user_name,avatar,time,',',_href))
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                }
                            }
                            //推送消息删除
                            $(".persistent_data").on("mouseover",".only_tip",function(){
                                $(this).children().last().children().last().show()
                                $(".notice_box_del").unbind("click").bind("click",function(e){
                                    e.stopPropagation()
                                    e.preventDefault()
                                    var now_name = $(this).prev().prev().children().first().text()
                                    var pipei_name = $(".home-title").children().first().text()
                                    if(now_name == pipei_name){
                                        window.location.href = "#narrow/is/starred"
                                    }
                                    console.log(now_name)
                                    console.log(pipei_name)
                                    $(this).parent().parent().parent().remove();
                                    var send_id = $(this).parent().parent().attr("send_id")
                                    arr = JSON.parse(localStorage.getItem("arr"))
                                    for(var i=0;i<arr.length;i++){
                                        if(arr[i].send_id == send_id){
                                            arr.remove(i)
                                        }
                                    }
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                })
                            })
                            $(".persistent_data").on("mouseout",".only_tip",function(){
                                $(this).children().last().children().last().hide()
                            })
                            setTimeout(function(){
                                $(".home-title").show();
                            },10)
                            $(".home-title button").hide();
                            $(".home-title span").html(user_name);
                            //做个切换到消息板块的假象试试
                            $(".notice_ctn_box").children().remove();
                            $(".news_icon").addClass("left_blue_height");
                            $(".address_book").removeClass("left_blue_height")
                        })
                    })
                }
            })
        })
        
        //待办点击
        $(".todo_list").on("click",function(){
            $(".organization_team").hide()
            $(".group_icon").hide()
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //右侧填补空白页
            $(".move_ctn").append(templates.render("right_blank_page"))
            //清空列表
            $(".notice_ctn_box").children().remove();
            $(".notice_ctn_box").append("<ul class='todo_box'></ul>")
            $(".notice_ctn_box").append("<div class='generate_log'><p>一键生成日志</p></div>");
            $(".notice_ctn_box").append(templates.render("add_new_task"))
            $(".notice_ctn_box").append("<div class='management_titleB'>\
            <div class='morn_managementtext'>已完成任务</div>\
            <i class='iconfont icon-xialaxuanze right_san'></i></div>")
            $(".notice_ctn_box").append("<ul class='completed_box'></ul>")
            
            //新增任务
            $(".new_add_task").on("click",function(){
                $(".new_add_task").hide();
                $(".new_task").show();
            })
            //取消
            $(".new_task_cancel").on("click",function(e){
                management.new_task_cancel();
            })
            //保存
            $(".new_task_save").off().on("click",function(e){
                var state = management.new_task_save()
                if(state==undefined){
                    management.new_task_cancel()
                }
            })
            //初始化日期
            $('#datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });
            //已完成下拉
            $(".right_san").on("click",function(){
                $(".completed_box").toggle();
                if($(".completed_box").is(":hidden")){
                    $(".right_san").css("transform","rotate(0deg)")
                }else{
                    $(".right_san").css("transform","rotate(180deg)")
                }
            })
            $(".generate_log").on("click",function(){
                management.generate_log();
            })
            
        })
        //管理组点击
        $(".manage_group").on("click",function(){
            $(".organization_team").hide()
            //清空右侧添加内容
            $(".group_icon").hide()
            $(".move_ctn").children().remove();
            //右侧填补空白页
            $(".move_ctn").append(templates.render("right_blank_page"))
            //清空列表
            $(".notice_ctn_box").children().remove();
            var manage_group = templates.render("manage_groups")
            $(".notice_ctn_box").append(manage_group)
            $(".common_img").on("click",function(){
                $(".move_ctn").children().remove();
                attendance.attendance()
                $(".tab-content").css("height","100%");
            })
        })
        //收藏点击
        $(".collection").on("click",function(){
            $(".organization_team").hide()
            $(".group_icon").hide()
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //右侧填补空白页
            $(".move_ctn").append(templates.render("right_blank_page"))
            //清空列表
            $(".notice_ctn_box").children().remove();
            var collection_tip_box = templates.render('collection_tip_box');
            $(".notice_ctn_box").append(collection_tip_box)
            $(".collection_tip").on("click",function(){
                $('.move_ctn').children().remove()
                $.ajax({
                    type:"GET",
                    url:"json/zg/collection/list",
                    success:function(res){
                        collection_list = res.collection_list
                        var collection_content_box = templates.render("collection_content_box",{collection_list:collection_list})
                        $('.move_ctn').append(collection_content_box)
                        $(".collection_content_star").on("click",function(){
                            var message_id = $(this).attr("message_id")
                            $(this).parent().parent().remove()
                            var obj = {
                                type:"message",
                                type_id:message_id,
                                status:"remove"
                            }
                            $.ajax({
                                type:"PUT",
                                url:"json/zg/collection/",
                                contentType:"appliction/json",
                                data:JSON.stringify(obj),
                                success:function(res){
                                    if(res.errno == 0){
                                        server_events.operating_hints("取消收藏成功!")
                                    }
                                }
                            })
                        })
                    }
                })
            })
        })
        //团队组织方法
        $(".organization_team").on("click",function(){
            $.ajax({
                type:"GET",
                url:"json/zg/user/permissions",
                success:function(res){
                    identity = res.message
                    $("#group_seeting_choose").hide();
                    $("#zfilt").removeClass("focused_table")
                    //清空右侧添加内容
                    $(".move_ctn").children().remove();
                    var organization_team_box = templates.render("organization_team_box",{identity:identity})
                    $(".move_ctn").append(organization_team_box)
                    //获取部门列表
                    getDepartmentList()
                    //获取无部门人员
                    getNoDepartmentList()
                    //邀请成员点击
                    $(".invite_members").on("click",function(){
                        var invite_members_md = templates.render("invite_members_md")
                        $(".app").append(invite_members_md)
                        //阻止时间冒泡
                        $(".invite_members_box").on("click",function(e){
                            e.stopPropagation();
                        })
                        //点击x关闭
                        $(".invite_members_close").on("click",function(){
                            $(".invite_members_md").hide()
                        })
                        //点击模版关闭
                        $(".invite_members_md").on("click",function(){
                            $(".invite_members_md").hide()
                        })
                    })
                    //团队设置点击
                    $(".management_team").on("click",function(){
                        $(".organization_chart_md").remove()
                        var organization_chart_md = templates.render("organization_chart_md")
                        $(".app").append(organization_chart_md)
                        //组织基本信息数据获取
                        getOrganizeBasic()
                        //组织基本信息数据修改
                        $(".organization_chart_box").on("click",".organization_chart_ctn_basic_save",function(){
                            var name = $(".item_name").val()
                            var description = $(".construction_description").val()
                            var obj = {
                                name:name,
                                description:description
                            }; 
                            $.ajax({
                                type:"PUT",
                                contentType:"application/json",
                                url:"json/zg/organization/information/updata/",
                                data:JSON.stringify(obj),
                                success:function(res){
                                    if(res.errno == 0){
                                        server_events.operating_hints("基本信息保存成功!")
                                    }
                                }
                            })
                        })
                        //点击关闭键关闭
                        $(".organization_chart_close").on("click",function(){
                            $(".organization_chart_md").hide()
                        })
                        //点击模版关闭
                        $(".organization_chart_md").on("click",function(){
                            $(".organization_chart_md").hide()
                        })
                        //阻止事件冒泡
                        $(".organization_chart_box").on("click",function(e){
                            e.stopPropagation()
                        })
                        //点击基本信息
                        $(".organization_chart_box").on("click",".organization_chart_basic_btn",function(){
                            $(".organization_chart_change_box").children().remove();
                            //组织基本信息数据获取
                            getOrganizeBasic()
                            //样式切换变化
                            $(this).addClass("color_li").siblings().removeClass("color_li")
                            $(this).children().first().addClass("color_icon").parent().siblings().children().removeClass("color_icon")
                            $(this).children().last().addClass("color_text").parent().siblings().children().removeClass("color_text")
                        })
                        //点击更换管理员
                        $(".organization_chart_box").on("click",".organization_chart_master_btn",function(){
                            $(".organization_chart_change_box").children().remove();
                            var organization_chart_ctn_master=templates.render("organization_chart_ctn_master")
                            $(".organization_chart_change_box").append(organization_chart_ctn_master)
                            //样式切换变化
                            $(this).addClass("color_li").siblings().removeClass("color_li")
                            $(this).children().first().addClass("color_icon").parent().siblings().children().removeClass("color_icon")
                            $(this).children().last().addClass("color_text").parent().siblings().children().removeClass("color_text")
                        })
                        //点击更换子管理员
                        $(".organization_chart_box").on("click",".organization_chart_child_btn",function(){
                            updataAdmin()
                            //添加子管理员
                            $(".organization_chart_box").on("click",".organization_chart_ctn_child_add",function(){
                                id_list = []
                                function xy (content){
                                    for(var key in content){
                                        id_list.push(content[key].id)
                                    }
                                    console.log(id_list)
                                    var obj = {
                                        type:"add",
                                        id_list:id_list
                                    }
                                    $.ajax({
                                        type:"PUT",
                                        contentType:"application/json",
                                        url:"json/zg/admin/child/updata/",
                                        data:JSON.stringify(obj),
                                        success:function(res){
                                            if(res.errno == 0){
                                                server_events.operating_hints("添加子管理员成功!")
                                                updataAdmin()
                                            }
                                        }
                                    })
                                }
                                // chooseFile.chooseTeam(xy);
                                chooseFile.chooseTeamMember(xy)
                                // function xy (content){
                                //     console.log(content)
                                // }
                                // // 传个函数进去就可以了
                                //  chooseFile.choosePeople(xy);
                            })
                            //删除子管理员
                            $(".organization_chart_box").on("click",".child_administrator_del",function(){
                                var id_list = []
                                id_list.push($(this).attr("user_id"))
                                console.log(id_list)
                                var obj = {
                                    type:"del",
                                    id_list:id_list
                                }
                                $.ajax({
                                    type:"PUT",
                                    contentType:"application/json",
                                    url:"json/zg/admin/child/updata/",
                                    data:JSON.stringify(obj),
                                    success:function(res){
                                        if(res.errno == 0){
                                            updataAdmin()
                                        }
                                    }
                                })
                            })
                            //样式切换变化
                            $(this).addClass("color_li").siblings().removeClass("color_li")
                            $(this).children().first().addClass("color_icon").parent().siblings().children().removeClass("color_icon")
                            $(this).children().last().addClass("color_text").parent().siblings().children().removeClass("color_text")
                        })
                        //点击解散团队
                        $(".organization_chart_box").on("click",".organization_chart_team_btn",function(){
                            $(".organization_chart_change_box").children().remove();
                            var organization_chart_ctn_team=templates.render("organization_chart_ctn_team")
                            $(".organization_chart_change_box").append(organization_chart_ctn_team)
                            //获取验证码
                            $(".organization_chart_box").on("click",".disband_time",function(){
                                var countdown=60;
                                function sendmsg(){
                                    if(countdown==0){
                                        $(".disband_time").attr("disabled",false);
                                        $(".disband_time").val("获取验证码");
                                        countdown=60;
                                        return false;
                                    }
                                    else{
                                        $(".disband_time").attr("disabled",true);
                                        $(".disband_time").val(countdown+"s");
                                        countdown--;
                                    }
                                    setTimeout(function(){
                                        sendmsg();
                                    },1000);
                                }
                                sendmsg()
                            })
                            //样式切换变化
                            $(this).addClass("color_li").siblings().removeClass("color_li")
                            $(this).children().first().addClass("color_icon").parent().siblings().children().removeClass("color_icon")
                            $(this).children().last().addClass("color_text").parent().siblings().children().removeClass("color_text")
                        })
                        //团队设置切换
                        $(".organization_chart_setting").on("click",function(){
                            //ui切换效果
                            $(this).addClass("bottom_line color_text").siblings().removeClass("bottom_line color_text")
                            $(".organization_chart_group_list_box").remove()
                            $(".organization_chart_change_box").children().remove()
                            $(".organization_chart_tab").remove()
                            var organization_chart_tab = templates.render("organization_chart_tab")
                            $(".organization_chart_body").prepend(organization_chart_tab)
                            $.ajax({
                                type:"GET",
                                url:"json/zg/organization/information",
                                success:function(res){
                                    var data = res.data
                                    var organization_chart_ctn_basic=templates.render("organization_chart_ctn_basic",{data:data})
                                    $(".organization_chart_change_box").append(organization_chart_ctn_basic)
                                }
                            })
                        })
                        //组织结构切换
                        $(".organization_chart_group").off().on("click",function(){
                            //ui切换效果
                            $(this).addClass("bottom_line color_text").siblings().removeClass("bottom_line color_text")
                            $(".organization_chart_tab").remove()
                            $(".organization_chart_change_box").children().remove()
                            //获取部门列表
                            $.ajax({
                                type:"GET",
                                url:"json/zg/department/list",
                                success:function(res){
                                    var department_lists = res.department_lists
                                    var not_department_count = res.not_department_count
                                    $(".organization_chart_group_list_box").remove()
                                    //默认 部门列表以及其右侧人员
                                    console.log(res)
                                    var organization_chart_group_list = templates.render("organization_chart_group_list",{department_lists:department_lists,not_department_count:not_department_count})
                                    $(".organization_chart_body").prepend(organization_chart_group_list)
                                    //添加部门列表右侧内容
                                    for(var i=0;i<department_lists.length;i++){
                                        var init_group = department_lists[0]
                                    }
                                    if(init_group){
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/department/user/list",
                                            contentType:"application/json",
                                            data:{department_id:init_group.id},
                                            success:function(res){
                                                user_list = res.user_list
                                                var organization_chart_group_detail = templates.render("organization_chart_group_detail",{init_group:init_group,user_list:user_list})
                                                $(".organization_chart_change_box").append(organization_chart_group_detail)
                                                //保存更改
                                                $(".new_group_save").off().on("click",function(){
                                                    saveData()
                                                })
                                            }
                                        })
                                    }
                                    //保存更改
                                    $(".new_group_save").off().on("click",function(){
                                        saveData()
                                    })
                                    //点击不同部门切换右侧内容
                                    $(".organization_chart_box").off("click",".organization_chart_group_list li").on("click",".organization_chart_group_list li",function(){
                                        $(this).addClass("color_li").siblings().removeClass("color_li")
                                        $(".organization_chart_group_detail_box").remove()
                                        name = $(this).children().first().text().trim()
                                        id = $(this).attr("department_id")
                                        init_group = {
                                            name:name,
                                            id:id
                                        }
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/department/user/list",
                                            contentType:"application/json",
                                            data:{department_id:id},
                                            success:function(res){
                                                user_list = res.user_list
                                                console.log(res)
                                                var organization_chart_group_detail = templates.render("organization_chart_group_detail",{init_group:init_group,user_list:user_list})
                                                $(".organization_chart_change_box").html(organization_chart_group_detail)
                                                //保存更改
                                                $(".new_group_save").off().on("click",function(){
                                                    saveData()
                                                })
                                            }
                                        })
                                    })
                                    //未分配人员列表更新
                                    $(".organization_chart_box").on("click",".undistributed",function(){
                                        //获取无部门人员
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/not/department/user",
                                            success:function(res){
                                                $(".organization_chart_group_detail_box").remove()
                                                var user_list = res.not_department_list
                                                var organization_chart_group_detail = templates.render("organization_chart_group_detail",{user_list:user_list})
                                                $(".organization_chart_change_box").append(organization_chart_group_detail)
                                            }
                                        })
                                    })
                                }
                            })
                            //新增部门
                            $(".organization_chart_box").off("click",".organization_chart_group_add").on("click",".organization_chart_group_add",function(){
                                var organization_add_group_popover = templates.render("organization_add_group_popover")
                                $(".organization_chart_md").append(organization_add_group_popover)
                                $(".organization_add_group_popover").on("click",function(e){
                                    e.stopPropagation();
                                })  
                                //保存按钮
                                $(".organization_add_group_finish").on("click",function(){
                                    var name = $(".organization_add_group_input").val()
                                    var obj = {
                                        name:name
                                    }
                                    $.ajax({
                                        type:"POST",
                                        contentType:"application/json",
                                        url:"json/zg/department/add/",
                                        data:JSON.stringify(obj),
                                        success:function(res){
                                            if(res.errno == 0){
                                                server_events.operating_hints("新增部门成功!")
                                                $.ajax({
                                                    type:"GET",
                                                    url:"json/zg/department/list",
                                                    success:function(res){
                                                        $(".organization_add_group_popover").remove()
                                                        $(".organization_chart_group_list_box").remove()
                                                        var department_lists = res.department_lists
                                                        var organization_chart_group_list = templates.render("organization_chart_group_list",{department_lists:department_lists})
                                                        $(".organization_chart_body").prepend(organization_chart_group_list)
                                                    }
                                                })
                                            }
                                        }
                                    })
                                })
                                //取消按钮
                                $(".organization_add_group_cancel").on("click",function(){
                                    $(".organization_add_group_popover").hide()
                                })
                            })
                            //部门设置
                            $(".organization_chart_box").on("click",".branch_icon",function(e){
                                e.stopPropagation()
                                $(".branch_ctn").show();
                            })
                            //内容点击阻止冒泡
                            $(".organization_chart_box").on("click",".branch_ctn",function(e){
                                e.stopPropagation()
                            })
                            //点击空白取消
                            $(".organization_chart_box").on("click",function(e){
                                e.stopPropagation()
                                $(".branch_ctn").hide();
                            })
                            //修改部门名称
                            $(".organization_chart_box").on("click",".branch_change_name",function(){
                                $(".branch_box").hide();
                                $(".branch_operation").show();
                                //input框获取部门名称
                                for(var i=0;i<$(".branch_name").length;i++){
                                    $branch_name = $(".branch_name")[0].innerHTML.trim()
                                }
                                console.log($(".new_group_name"))
                                $(".new_group_name").val($branch_name)
                                $(".new_group_name").attr("department_id",$(".branch_name").attr("department_id"))
                            })
                            //删除部门
                            $(".organization_chart_box").on("click",".branch_delete_group",function(){
                                var organization_chart_group_delete = templates.render("organization_chart_group_delete")
                                $(".organization_chart_md").append(organization_chart_group_delete)
                                $(".branch_ctn").hide()
        
                                //删除框点击
                                $(".organization_chart_group_delete_box").on("click",function(e){
                                    e.stopPropagation()
                                })
                                //取消点击
                                $(".organization_chart_group_delete_cancel,.organization_chart_group_delete_close").on("click",function(){
                                    $(".organization_chart_group_delete_box").hide();
                                })
                                //确认删除
                                $(".organization_chart_group_delete_ensure").on("click",function(){
                                    var department_id = $(".branch_name").attr("department_id")
                                    var obj = {
                                        department_id:department_id
                                    }
                                    $.ajax({
                                        type:"PUT",
                                        contentType:"application/json",
                                        url:"json/zg/department/del/",
                                        data:JSON.stringify(obj),
                                        success:function(res){
                                            if(res.errno == 0){
                                                server_events.operating_hints("删除部门成功!")
                                                $(".organization_chart_group_delete_box").hide()
                                                updataList()
                                            }
                                        }
                                    })
                                })
                            })
                            //取消更改
                            $(".organization_chart_box").on("click",".new_group_cancle",function(){
                                $(".branch_box").show();
                                $(".branch_operation").hide();
                            })
                            //批量删除
                            $(".organization_chart_box").on("click",".new_group_box input",function(){
                                if($(".new_group_box input").is(":checked")){
                                    $(".batch_delete,.adjust_department").removeClass("opacity_li")
                                }else{
                                    $(".batch_delete,.adjust_department").addClass("opacity_li")
                                }   
                            })
                            //批量删除
                            $(".organization_chart_box").off("click",".batch_delete").on("click",".batch_delete",function(){
                                if($(this).is(".opacity_li")){
                                    return;
                                }else{
                                    var user_list = []
                                    var arr = $(".new_group_box input:checked").parent()
                                    for(var i=0;i<arr.length;i++){
                                        user_list.push(Number(arr[i].getAttribute("user_id")))
                                    }
                                    var obj = {
                                        user_list:user_list,
                                        type:"del"
                                    }
                                    $.ajax({
                                        type:"PUT",
                                        contentType:"application/json",
                                        url:"json/zg/user/mobile_batch/",
                                        data:JSON.stringify(obj),
                                        success:function(res){
                                            if(res.errno == 0){
                                                server_events.operating_hints("批量删除成功!")
                                                updataList()
                                            }
                                        }
                                    })
                                }
                            })
                            //调整部门
                            $(".organization_chart_box").on("click",".adjust_department",function(){
                                if($(this).is(".opacity_li")){
                                    return
                                }else{
                                    var user_list = []
                                    var department_list = []
                                    var arr = $(".new_group_box input:checked").parent()
                                    for(var i=0;i<arr.length;i++){
                                        user_list.push(Number(arr[i].getAttribute("user_id")))
                                    }
                                    chooseFile.chooseTeam(xy);
                                    function xy (content){
                                        for(var key in content){
                                            department_list.push(content[key].id)
                                        }
                                        var obj = {
                                            user_list:user_list,
                                            type:"mobile",
                                            new_department_id_list:department_list,
                                            department_id:"0"
                                        }
                                        $.ajax({
                                            type:"PUT",
                                            contentType:"application/json",
                                            url:"json/zg/user/mobile_batch/",
                                            data:JSON.stringify(obj),
                                            success:function(res){
                                                if(res.errno == 0){
                                                    updataList()
                                                }
                                            }
                                        })
                                    }
                                    
                                }
                            })
                        })
                    })
                    //部门列表点击
                    $(".move_ctn").on("click",".organization_team_dept_name",function(){
                        $(this).addClass("color_li").siblings().removeClass("color_li")
                        $(".organization_team_bottom_box").children().remove()
                        var id = $(this).attr("department_id")
                        var department_name = $(this).children().children().first().text()
                        $.ajax({
                            type:"GET",
                            url:"json/zg/department/user/list",
                            data:{department_id:id},
                            contentType:"application/json",
                            success:function(res){
                                $(".organization_team_bottom_box").children().remove()
                                var user_list = res.user_list
                                var organization_chart_department_detail = templates.render("organization_chart_department_detail",{user_list:user_list,department_name:department_name})
                                $(".organization_team_bottom_box").append(organization_chart_department_detail)
                                $(".organization_team_bottom_box").css("height",window.screen.height)
                                //返回上一级
                                $(".organization_team_bottom_box").on("click",".back_up",function(){
                                    $(".organization_team_bottom_box").children().remove()
                                    $(".organization_chart_department_box").remove()
                                    //获取部门列表
                                    getDepartmentList()
                                    //获取无部门人员
                                    getNoDepartmentList()
                                })
                            }
                        })
                    })
                }
            })
        })
        //工作通知
        $("body").on("click",".work_order",function(){
            $(".move_ctn").children().remove();
            var pushData = JSON.parse(localStorage.getItem("pushData"))
            var work_order_head = templates.render("work_order_head")
            $(".move_ctn").append(work_order_head)
            var work_order_body = templates.render("work_order_body",{pushData:pushData})
            $(".work_order_box").append(work_order_body)
            // 点击跳到详情页面
            $(".work_order_ctn").on("click",function(e){
                
            })
        })  
        //日志助手显示
        $("body").on("click",'.log_assistant_btn',function(e){
           window.location.href = "#narrow/is/starred"
           $(".tab-content").css("height","100%")
           e.stopPropagation();
           e.preventDefault();
           var window_high = window.screen.height;
           $(".log_assistant_md").css("height",window_high);
           $(".log_assistant_md").css("overflow","auto");
           $(".log_assistant_md").show();
           $.ajax({
               type:"GET",
               url:"json/zg/my/receive/web",
               contentType:"application/json",
               success:function(res){
                   var page = [];
                   for(var i= 2;i<=res.page;i++){
                       page.push(i)
                   }
                   var lastpage = res.page;
                   $(".log_assistant_md").remove();
                   $(".move_ctn").children().remove();
                   var receive_table_list = res.receive_table_list;
                   var html = templates.render("log_assistant_box",{receive_table_list:receive_table_list,page:page})
                   $(".move_ctn").append(html)
                   //点击下载附件图片
                   $(".download_fujian").on("click",function(){
                       window.open($(this).attr("href"))
                   })
                   $(".log_assistant_md").on("click",function(e){
                       e.stopPropagation();
                       e.preventDefault();
                       $(".log_assistant_md").hide();
                       $(".log_assistant_md").remove();
                       $(".app").css("overflow-y","scroll")
                       $('.log_assistant_md').empty()   
                   })
                   //日志助手关闭
                   $(".log_assistant_close").on("click",function(e){
                       $(".log_assistant_md").hide();
                       $(".log_assistant_md").remove();
                       $(".app").css("overflow-y","scroll")
                       $('.log_assistant_md').empty()   
                   })
                   //日志助手阻止冒泡
                   $(".log_assistant_box").on("click",function(e){
                       e.stopPropagation();
                       e.preventDefault();
                   })
                   $(".log_assistant_screening").on("click",function(e){
                       e.preventDefault();
                       e.stopPropagation();
                       $(".log_screening").show();
                   })
                   $(".log_screening").on("click",function(){
                       e.stopPropagation();
                       e.preventDefault();
                   })
                   $(".log_assistant_ctn_box").on("click",function(e){
                       $(".log_screening").hide();
                   })
                   //我收到的 点击内容
                   $(".log_assistant_box").on("click",".log_assistant_received",function(e){
                       $(this).addClass("high_light").siblings().removeClass("high_light");
                       $(".log_assistant_prompt_box").show();
                       $(".log_assistant_ctn").css("margin-top","0px");
                       $(".log_assistant_unread").hide();
                       $(".log_assistant_title").html("我收到的");
                       $.ajax({
                                   type:"GET",
                                   url:"json/zg/my/receive/web",
                                   contentType:"application/json",
                                   success:function(res){
                                       $(".paging_box").remove();
                                       $(".paging_box_receive").remove();
                                       $(".paging_box_send").remove();
                                       var page = [];
                                       for(var i= 2;i<=res.page;i++){
                                           page.push(i)
                                       }
                                       $(".log_assistant_ctn").remove();
                                       var receive_table_list = res.receive_table_list;
                                       var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                                       var paging = templates.render("paging_receive",{page:page})
                                       $(".log_assistant_ctn_box").append(html);
                                       $(".log_assistant_ctn_box").append(paging);
                                       //点击下载附件图片
                                       $(".download_fujian").on("click",function(){
                                           window.open($(this).attr("href"))
                                       })
                                        //点击分页
                                       $(".paging_receive").on("click",".paging_btn_receive",function(e){
                                           var page = Number($(this).text());
                                           $(this).addClass("blue_light").siblings().removeClass("blue_light");
                                           console.log($(".paging_box_receive"))
                                           getLogReceive(page)
                                       });
                                       //上翻
                                           $(".paging_receive_prev").on("click",function(){
                                               var page = $(".blue_light").text();
                                                   page--;
                                                   if(page<1){
                                                       return;
                                                   }
                                                   console.log("asndiobfsdgobdasfbos")
                                                   $(".blue_light").prev().addClass("blue_light").siblings().removeClass("blue_light");
                                                   getLogReceive(page)
                                               })
                                       //下翻
                                           $(".paging_receive_next").on("click",function(){
                                               var page = $(".blue_light").text();
                                                   page++;
                                                   if(page>lastpage){
                                                       return;
                                                   }
                                                   $(".blue_light").next().addClass("blue_light").siblings().removeClass("blue_light");
                                                   getLogReceive(page)
                                               })
                                   }
                               })

                   });
                   //点击分页
                       //上翻
                   $(".paging_prev").on("click",function(){
                       var page = $(".blue_light").text();
                       page--;
                       if(page<1){
                           return;
                       }
                       $(".blue_light").prev().addClass("blue_light").siblings().removeClass("blue_light");
                    //    getLogReceive(page)
                       $.ajax({
                           type:"GET",
                           url:"json/zg/my/receive/web?page="+page+"",
                           contentType:"application/json",
                           success:function(res){
                               $(".log_assistant_ctn").remove();
                               var receive_table_list = res.receive_table_list;
                               var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                               $(".paging_box").before(html)
                               //翻页后移至顶部
                               $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                               //点击下载附件图片
                               $(".download_fujian").on("click",function(){
                                   window.open($(this).attr("href"))
                               })
                           }
                       })
                   })
                       //下翻
                   $(".paging_next").on("click",function(){
                       var page = $(".blue_light").text();
                       page++;
                       if(page>lastpage){
                           return;
                       }
                       $(".blue_light").next().addClass("blue_light").siblings().removeClass("blue_light");
                    //    getLogReceive(page)
                       $.ajax({
                           type:"GET",
                           url:"json/zg/my/receive/web?page="+page+"",
                           contentType:"application/json",
                           success:function(res){
                               $(".log_assistant_ctn").remove();
                               var receive_table_list = res.receive_table_list;
                               var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                               $(".paging_box").before(html)
                               //翻页后移至顶部
                               $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                               //点击下载附件图片
                               $(".download_fujian").on("click",function(){
                                   window.open($(this).attr("href"))
                               })
                           }
                       })
                   })
                       //点击页数
                   $(".paging").on("click",".paging_btn",function(e){
                       console.log($(".paging_box"))
                       var page = Number($(this).text());
                       $(this).addClass("blue_light").siblings().removeClass("blue_light");
                    //    getLogReceive(page)
                       $.ajax({
                           type:"GET",
                           url:"json/zg/my/receive/web?page="+page+"",
                           contentType:"application/json",
                           success:function(res){
                               $(".log_assistant_ctn").remove();
                               var receive_table_list = res.receive_table_list;
                               var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                               $(".paging_box").before(html)
                               //翻页后移至顶部
                               $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                               //点击下载附件图片
                               $(".download_fujian").on("click",function(){
                                   window.open($(this).attr("href"))
                               })
                           }
                       })
                   })
                   //点击上一页
                   //我发出的 点击内容
                   $(".log_assistant_box").on("click",".log_assistant_send",function(e){
                       $(this).addClass("high_light").siblings().removeClass("high_light");
                       $(".log_assistant_prompt_box").hide();
                       $(".log_assistant_ctn").css("margin-top","20px");
                       $(".log_assistant_unread").show();
                       $(".log_assistant_title").html("我发出的")
                       $.ajax({
                           type:"GET",
                           url:"json/zg/my/send/web",
                           contentType:"application/json",
                           success:function(res){
                               console.log(res)
                               var page = [];
                               for(var i= 2;i<=res.page;i++){
                                   page.push(i)
                               }
                               var send_lastpage = res.page;
                               $(".paging_box").remove();
                               $(".paging_box_receive").remove();
                               $(".paging_box_send").remove();
                               $(".log_assistant_unread").show();
                               $(".log_assistant_ctn").remove();
                               var send_table_list = res.send_table_list;
                               var html = templates.render("log_assistant_send",{send_table_list:send_table_list});
                               var paging = templates.render("paging_send",{page:page})
                               $(".log_assistant_ctn_box").append(html);
                               $(".log_assistant_ctn_box").append(paging);
                               //翻页后移至顶部
                               $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                               //点击下载附件图片
                               $(".download_fujian").on("click",function(){
                                   window.open($(this).attr("href"))
                               })
                               //点击分页
                               $(".paging_send").on("click",".paging_btn_send",function(e){
                                   var page = Number($(this).text());
                                   $(this).addClass("blue_light").siblings().removeClass("blue_light");
                                   getLogSend(page)
                               })
                                   //上翻
                                   $(".paging_send_prev").on("click",function(){
                                       var page = $(".blue_light").text();
                                           page--;
                                           if(page<1){
                                               return;
                                           }
                                           $(".blue_light").prev().addClass("blue_light").siblings().removeClass("blue_light");
                                           getLogSend(page)
                                   })
                                   //下翻
                                   $(".paging_send_next").on("click",function(){
                                       var page = $(".blue_light").text();
                                       page++;
                                       if(page>send_lastpage){
                                           return;
                                       }
                                       $(".blue_light").next().addClass("blue_light").siblings().removeClass("blue_light");
                                       getLogSend(page)
                                   })
                               //显示未读
                               $(".log_assistant_unread").on("click",".log_assistant_unreadperson",function(){
                                   $(".already_read").hide();
                                   $(".unread").show();

                               })
                               //显示已读
                               $(".log_assistant_unread").on("click",".log_assistant_readperson",function(){
                                   $(".already_read").show();
                                   $(".unread").hide();
                               })
                               $(".log_assistant_unread div").on("click",function(){
                                   $(this).css("color","#333333").siblings().css("color","#999999")
                               })
                               //附件图片显示原图
                               $(".thumbnail").on("click",function(){
                                   console.log($(this))
                               })
                               }
                           })
                   })
                       }
                   })
           //筛选
           $(".log_assistant_screening").on("click",function(e){
               $(".log_screening").show();
           })
           //关闭筛选
           $(".log_screening_close").on("click",function(e){
               $(".log_screening").hide();
           })
           //选择发送人
           $(".log_screening_select").on("click",function(e){
               $("#people-choose").show();
           })
           //关闭选择发送人
           $(".choose_team_close").on("click",function(e){
               $("#people-choose").hide();
           })
        })
       //没有部门成员点击跳转聊天
       $(".move_ctn").on("click",".organization_team_single_box li",function(){
            $(".group_icon").hide()
            $(".home-title button").hide();
            //做个切换到消息板块的假象试试
            $(".notice_ctn_box").children().remove();
            $(".news_icon").addClass("left_blue_height");
            $(".address_book").removeClass("left_blue_height")
       })
       //收藏消息
       $("#zfilt").off("click",".additional_collection").on("click",".additional_collection",function(){
        var id = Number($(this).parent().parent().parent().parent().parent().parent().parent().attr("zid"))
        flag = $(this).parent().prev().attr("star")
        star = $(this).parent().prev().children().first()
        var status;
        if(flag == "false"){
            status = "add"
            $(this).parent().prev().attr("star","true")
        }else{
            status = "remove"
            $(this).parent().prev().attr("star","false")
        }
        var obj = {
            type:"message",
            type_id:id,
            status:status
        }
        $.ajax({
            type:"PUT",
            url:"json/zg/collection/",
            contentType:"appliction/json",
            data:JSON.stringify(obj),
            success:function(res){
                if(res.message == '收藏成功'){
                    star.show()
                }else if(res.message == "取消收藏成功"){
                    star.hide()
                }
            }
        })
    })


    })
    
//组织基本信息获取
function getOrganizeBasic(){
    $.ajax({
        type:"GET",
        url:"json/zg/organization/information",
        success:function(res){
            $(".organization_chart_ctn_basic").remove()
            $(".organization_chart_tab").remove()
            var data = res.data
            var organization_chart_ctn_basic=templates.render("organization_chart_ctn_basic",{data:data})
            $(".organization_chart_change_box").append(organization_chart_ctn_basic)
            var organization_chart_tab = templates.render("organization_chart_tab")
            $(".organization_chart_body").prepend(organization_chart_tab)
        }
    })
}
//初始化contact样式
function initStyle(){
    $(".organization_team").show()
    //清空右侧添加内容
    $(".move_ctn").children().remove();
    //右侧填补空白页
    $(".move_ctn").append(templates.render("right_blank_page"))
    //清空列表
    $(".notice_ctn_box").children().remove();
    $(".group_icon").show()
    $(".home-title").hide();
    $("#main_div").hide();
    $("#compose").hide();
}
//获取无部门人员
function getNoDepartmentList(){
    $.ajax({
        type:"GET",
        url:"json/zg/not/department/user",
        success:function(res){
            $(".organization_team_single_box").remove()
            var not_department_list = res.not_department_list
            var organization_team_single = templates.render("organization_team_single",{not_department_list:not_department_list})
            $(".organization_team_bottom_box").append(organization_team_single)
            $(".organization_team_bottom_box").css("height",window.screen.height)
        }
    })
}
//获取部门列表
function getDepartmentList(){
    //获取部门列表
    $.ajax({
        type:"GET",
        url:"json/zg/department/list",
        success:function(res){
            $(".organization_team_dept_box").remove()
            var department_lists = res.department_lists
            var organization_team_dept = templates.render("organization_team_dept",{department_lists:department_lists})
            $(".organization_team_bottom_box").prepend(organization_team_dept)
            $(".organization_team_bottom_box").css("height",window.screen.height)
        }
    })
}
//获取子管理员列表
function updataAdmin(){
    $.ajax({
        type:"GET",
        url:"json/zg/admin/child",
        success:function(res){
            $(".organization_chart_change_box").children().remove();
            var user_list = res.user_list
            var organization_chart_ctn_child=templates.render("organization_chart_ctn_child",{user_list:user_list})
            $(".organization_chart_change_box").append(organization_chart_ctn_child)
        }
    })
}
function saveData(){
    var department_name = $(".new_group_name").val()
    var department_id = $(".new_group_name").attr("department_id")
    var obj = {
        department_id:department_id,
        department_name:department_name
    }
    $.ajax({
        type:"PUT",
        contentType:"application/json",
        url:"json/zg/department/up/",
        data:JSON.stringify(obj),
        success:function(res) {
            if(res.errno == 0){
                updataList()
            }
        }
    })
}
function updataList(){
    $(".organization_chart_group_list_box").remove()
    $(".organization_chart_change_box").children().remove()
    $.ajax({
        type:"GET",
        url:"json/zg/department/list",
        success:function(res){
            var department_lists = res.department_lists
            var not_department_count = res.not_department_count
            var organization_chart_group_list = templates.render("organization_chart_group_list",{department_lists:department_lists,not_department_count:not_department_count})
            $(".organization_chart_body").prepend(organization_chart_group_list)
            // $(".organization_chart_box").on("click",".organization_chart_group_list li",function(){
            //     $(this).addClass("color_li").siblings().removeClass("color_li")
            //     $(".organization_chart_group_detail_box").remove()
            //     name = $(this).children().first().text().trim()
            //     id = $(this).attr("department_id")
            //     init_group = {
            //         name:name,
            //         id:id
            //     }
            //     $.ajax({
            //         type:"GET",
            //         url:"json/zg/department/user/list",
            //         contentType:"application/json",
            //         data:{department_id:id},
            //         success:function(res){
            //             console.log(345)
            //             user_list = res.user_list
            //             var organization_chart_group_detail = templates.render("organization_chart_group_detail",{init_group:init_group,user_list:user_list})
            //             $(".organization_chart_change_box").append(organization_chart_group_detail)
            //             //保存更改
            //             $(".new_group_save").off().on("click",function(){
            //                 saveData()
            //             })
            //         }
            //     })
            //     //保存更改
            //     $(".new_group_save").off().on("click",function(){
            //         saveData()
            //     })
            // })
            //添加部门列表右侧内容
            for(var i=0;i<department_lists.length;i++){
                var init_group = department_lists[0]
            }
            if(init_group){
                $.ajax({
                    type:"GET",
                    url:"json/zg/department/user/list",
                    contentType:"application/json",
                    data:{department_id:init_group.id},
                    success:function(res){
                        user_list = res.user_list
                        var organization_chart_group_detail = templates.render("organization_chart_group_detail",{init_group:init_group,user_list:user_list})
                        $(".organization_chart_change_box").append(organization_chart_group_detail)
                        //保存更改
                        $(".new_group_save").off().on("click",function(){
                            saveData()
                        })
                    }
                })
            }
            //保存更改
            $(".new_group_save").off().on("click",function(){
                saveData()
            })
        }
    })
}
function getLogReceive(page){
    $.ajax({
        type:"GET",
        url:"json/zg/my/receive/web?page="+page+"",
        contentType:"application/json",
        success:function(res){
            $(".log_assistant_ctn").remove();
            var receive_table_list = res.receive_table_list;
            var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
            $(".paging_box_receive").before(html);
            console.log($(".paging_box_receive"))
            // console.log(html)
            //翻页后移至顶部
            $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
            //点击下载附件图片
            $(".download_fujian").on("click",function(){
                window.open($(this).attr("href"))
            })
        }
    })
}
function getLogSend(page){
    $.ajax({
        type:"GET",
        url:"json/zg/my/send/web?page="+page+"",
        contentType:"application/json",
        success:function(res){

            $(".log_assistant_ctn").remove();
            var send_table_list = res.send_table_list;
            var html = templates.render("log_assistant_send",{send_table_list:send_table_list})
            console.log(html)
            $(".paging_box_send").before(html)
            //翻页后移至顶部
            $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
            //点击下载附件图片
            $(".download_fujian").on("click",function(){
                window.open($(this).attr("href"))
            })
        }
    })
}
return exports
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}