var contact = (function(){
    var exports = {};
    $("body").ready(function(){
        $(".contact").on("click",function(){
            $(".notice_ctn_box").children().remove();
            $(".group_icon").show()
            $(".home-title").hide();
            $("#compose-container").hide();
            console.log("123")
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
                        // $("#main_div").children().remove();
                        $(".private_user_name").remove();
                        $("#zfilt").children().remove();
                        $(".user_detail_box").remove();
                        var x = new Date()
                        console.log(x)
                        var user_name = $(this).children().last().text();
                        var user_id = $(this).attr("user_id");
                        var email = $(this).attr("email");
                        var avatar = $(this).children().first().children().attr("src")
                        var short_name = $(this).attr("short_name");
                        var _href = "#narrow/pm-with/"+user_id+"-"+short_name
                        $("#empty_narrow_all_mentioned").remove();
                        $("#compose_controls").hide();
                        var user_detail_contact = templates.render("user_detail_contact",{user_name:user_name,user_id:user_id,email:email,avatar:avatar,_href:_href})
                        $("#main_div").append(user_detail_contact)
                        
                        //发送消息点击事件
                        $(".user_detail_send").on("click",function(){
                            $(".private_user_name").remove();
                            $(".user_detail_box").remove();
                            $("#main_div").prepend("<div class='private_user_name'>"+user_name+"</div>")

                        })
                    })
                }
            })
        })
        $(".private_button").on("click",function(){
            $(".group_icon").hide()
            $(".notice_ctn_box").children().remove();
        })
        $(".manage_group").on("click",function(){
            $("#compose_controls").hide();
            $(".notice_ctn_box").children().remove();
            var manage_group = templates.render("manage_groups")
            $(".notice_ctn_box").append(manage_group)
            
            $(".common_img").on("click",function(){
                
                attendance.attendance()
            })
        })
    })
    
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}