var contact = (function(){
    var exports = {};
    $("body").ready(function(){

        $("#global_filters li a").on("click",function(){
            $(this).addClass("left_blue_height").parent().siblings().children().removeClass("left_blue_height")
        })
        //联系人点击
        $(".contact").on("click",function(){
            //清空右侧添加内容
            $(".move_ctn").children().remove();
            //右侧填补空白页
            $(".move_ctn").append(templates.render("right_blank_page"))
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
                            
                            
                            setTimeout(function(){
                                $(".home-title").show();
                            },10)
                            $(".home-title button").hide();
                            $(".home-title span").html(user_name);
                            //做个切换到消息板块的假象试试
                            $(".notice_ctn_box").children().remove();
                            $(".news_icon").addClass("left_blue_height");
                            $(".address_book").removeClass("left_blue_height")
                            // var log_assistant_prompt = templates.render("log_assistant_prompt");
                            // $(".notice_ctn_box").append(log_assistant_prompt)
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
            //添加默认空白
            $(".move_ctn").append(templates.render("right_blank_page"))
            //清空列表
            $(".notice_ctn_box").children().remove();
            $("#main_div").hide();
            $("#compose").hide();
            var log_assistant_prompt = templates.render("log_assistant_prompt");
            $(".notice_ctn_box").append(log_assistant_prompt)
            $(".tab-content").css("height","calc(100% - 232px)")
             //日志助手显示
             $(".log_assistant_btn").on("click",function(e){
                //  console.log($("#zfilt"))
                // $("#zfilt").hide();
                $(".tab-content").css("height","100%")
                $(".move_ctn").children().remove();
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
                        console.log(res)
                        var page = [];
                        for(var i= 2;i<=res.page;i++){
                            page.push(i)
                        }
                        var lastpage = res.page;
                        $(".log_assistant_md").remove();
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
                                                $.ajax({
                                                    type:"GET",
                                                    url:"json/zg/my/receive/web?page="+page+"",
                                                    contentType:"application/json",
                                                    success:function(res){
                                                        $(".log_assistant_ctn").remove();
                                                        var receive_table_list = res.receive_table_list;
                                                        var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                                                        $(".paging_box_receive").before(html);
                                                        //翻页后移至顶部
                                                        $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                                                        //点击下载附件图片
                                                        $(".download_fujian").on("click",function(){
                                                            window.open($(this).attr("href"))
                                                        })
                                                    }
                                                })
                                            });
                                            //上翻
                                                $(".paging_receive_prev").on("click",function(){
                                                    var page = $(".blue_light").text();
                                                        page--;
                                                        if(page<1){
                                                            return;
                                                        }
                                                        $(".blue_light").prev().addClass("blue_light").siblings().removeClass("blue_light");
                                                        $.ajax({
                                                            type:"GET",
                                                            url:"json/zg/my/receive/web?page="+page+"",
                                                            contentType:"application/json",
                                                            success:function(res){
                                                                $(".log_assistant_ctn").remove();
                                                                var receive_table_list = res.receive_table_list;
                                                                var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                                                                $(".paging_box_receive").before(html)
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
                                                $(".paging_receive_next").on("click",function(){
                                                    var page = $(".blue_light").text();
                                                        page++;
                                                        if(page>lastpage){
                                                            return;
                                                        }
                                                        $(".blue_light").next().addClass("blue_light").siblings().removeClass("blue_light");
                                                        $.ajax({
                                                            type:"GET",
                                                            url:"json/zg/my/receive/web?page="+page+"",
                                                            contentType:"application/json",
                                                            success:function(res){
                                                                $(".log_assistant_ctn").remove();
                                                                var receive_table_list = res.receive_table_list;
                                                                var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                                                                $(".paging_box_receive").before(html)
                                                                //翻页后移至顶部
                                                                $(".log_assistant_ctn_box").animate({scrollTop:0}, 0);
                                                                //点击下载附件图片
                                                                $(".download_fujian").on("click",function(){
                                                                    window.open($(this).attr("href"))
                                                                })
                                                            }
                                                        })
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
                            var page = Number($(this).text());
                            $(this).addClass("blue_light").siblings().removeClass("blue_light");
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
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/my/send/web?page="+page+"",
                                            contentType:"application/json",
                                            success:function(res){
                                                console.log(res)
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
                                    })
                                        //上翻
                                        $(".paging_send_prev").on("click",function(){
                                            var page = $(".blue_light").text();
                                                page--;
                                                if(page<1){
                                                    return;
                                                }
                                                $(".blue_light").prev().addClass("blue_light").siblings().removeClass("blue_light");
                                            $.ajax({
                                                type:"GET",
                                                url:"json/zg/my/send/web?page="+page+"",
                                                contentType:"application/json",
                                                success:function(res){
                                                    console.log(res)
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
                                        })
                                        //下翻
                                        $(".paging_send_next").on("click",function(){
                                            var page = $(".blue_light").text();
                                            page++;
                                            if(page>send_lastpage){
                                                return;
                                            }
                                            $(".blue_light").next().addClass("blue_light").siblings().removeClass("blue_light");
                                            $.ajax({
                                                type:"GET",
                                                url:"json/zg/my/send/web?page="+page+"",
                                                contentType:"application/json",
                                                success:function(res){
                                                    console.log(res)
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
                //日志助手拖拽
                // $(".log_assistant_box").on("mousedown",function(e){
                //     var x =parseInt(e.pageX - $(".log_assistant_box").offset().left);
                //     var y =parseInt(e.pageY - $(".log_assistant_box").offset().top); 
                //     $(".log_assistant_box").bind("mousemove",function(ev){
                //         var ox = ev.pageX - x;
                //         var oy = ev.pageY-y;
                //         $(".log_assistant_box").css({
                //             left:ox+"px",
                //             top:oy+"px"
                //         })
                //     })
                //     $(".log_assistant_box").on("mouseup",function(e){
                //         $(this).unbind("mousemove");
                //     })
                // })
            })
        })
        //管理组点击
        $(".manage_group").on("click",function(){
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
        //待办点击
        $(".todo_list").on("click",function(){
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
            $(".new_task_save").on("click",function(e){
                management.new_task_save();
                management.new_task_cancel();
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
            })
            $(".generate_log").on("click",function(){

                management.generate_log();
            })
            
        })
    })
    
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}