var contact = (function(){
    var exports = {};
    $("body").ready(function(){
        //联系人点击
        $(".contact").on("click",function(){
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //清空列表
            $(".notice_ctn_box").children().remove();
            $(".group_icon").show()
            $(".home-title").hide();
            // $(".middle_ctn").children().hide();
            $("#main_div").hide();
            $("#compose").hide();
            $.ajax({
                url:"json/zg/user",
                type:"GET",
                success:function(res){
                    $(".notice_ctn_box").children().remove();
                    var user_list = res.user_list;
                    var user_list_our = templates.render("user_list_our",{user_list:user_list})
                    var user_me = res.user_me;
                    $(".notice_ctn_box").append(user_list_our)
                    //点击联系人弹出右边页面
                    $(".notice_ctn_box").on("click",".user_list_box",function(){
                        $("#zfilt").children().remove();
                        $(".move_ctn").children().remove();
                        $("#main_div").hide();
                        $("#compose").hide();
                        var x = new Date()
                        console.log(x)
                        var user_name = $(this).children().last().text();
                        var user_id = $(this).attr("user_id");
                        var email = $(this).attr("email");
                        var avatar = $(this).children().first().children().attr("src")
                        var short_name = $(this).attr("short_name");
                        var _href = "#narrow/pm-with/"+user_id+"-"+short_name
                        // $("#empty_narrow_all_mentioned").remove();
                        // $("#compose_controls").hide();
                        var user_detail_contact = templates.render("user_detail_contact",{user_name:user_name,user_id:user_id,email:email,avatar:avatar,_href:_href})
                        $(".move_ctn").append(user_detail_contact)
                        //发送消息点击事件
                        $(".user_detail_send").on("click",function(){
                            $(".move_ctn").children().remove();
                            // $("#compose_controls").show();
                            $("#main_div").show();
                            $("#compose").show();
                            $(".tab-content").css("height","calc(100% - 232px)")
                        })
                    })
                }
            })
        })
        //私聊点击
        $(".private_button").on("click",function(){
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            $(".group_icon").hide()
            //清空列表
            $(".notice_ctn_box").children().remove();
        })
        //管理组点击
        $(".manage_group").on("click",function(){
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //清空列表
            $(".notice_ctn_box").children().remove();
            var manage_group = templates.render("manage_groups")
            $(".notice_ctn_box").append(manage_group)
            $(".common_img").on("click",function(){
                attendance.attendance()
                $(".tab-content").css("height","100%");
            })
        })
        //待办点击
        $(".todo_list").on("click",function(){
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //清空列表
            $(".notice_ctn_box").children().remove();
            $(".notice_ctn_box").append("<ul class='todo_box'></ul>")
            $(".generate_log").on("click",function(){
                management.generate_log();
            })
        })
    })
    
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}