    var management = (function () {
    var exports = {};
    $("body").ready(function () {
        //点击一键生成日志 出现日志弹窗
        // $(".create_generate_log").hide();
        function cancel (){
            $(".new_plan_title").val("");
            $(".create_taskdate").val('');
          }
        function timestamp(str){
            str = str.replace(/-/g,'/');
            var date = new Date(str); 
            var time = date.getTime();
            var n = time/1000;
            return n;
        }
        function innhtml(val1,val2,data){
            var li = "<li class='generate_log_plan_ctn'>\
            <input type='checkbox'>\
            <p class='text-inline'>"+val1+"</p>\
            <p><span>截止日期&nbsp;&nbsp;</span><span class='date-inline'>"+val2+"</span></p>\
            <p>\
            <span class='generate_log_plan_editor'>编辑</span>\
            <span class='generate_log_plan_delete' data_id="+data.backlog_id+">删除</span>\
            </p>\
            </li>"
            return li 
        }
        function del(){
            $('.generate_log_plan_ctn ').on('click',".generate_log_plan_delete",function(e){
                e.preventDefault()
                var that =$(this)
                // console.log($(this).attr("data_id"))
                var id = {
                    backlog_id:$(this).attr("data_id")
                }
                var data_id = JSON.stringify(id)
                channel.del({
                    url: 'json/zg/backlog/',
                    idempotent: true,
                    data:data_id,
                    success:(data)=>{
                       if(data.errno===0){
                        // var li  = "."+(that.parent().parent()).attr("class")
                        that.parent().parent().remove()
                       }
                    }
                })
            })
        }
        function plancommon(){
            var inttitle = $(".new_plan_title").val();
            var inttime = $(".create_taskdate").val();
            var over_time = timestamp(inttime);
            var obj = {
                "task":inttitle,
                "over_time":over_time,
            }
            var j = JSON.stringify(obj)
            return {
                j,
                inttitle,
                inttime
            }
        }
        function logClick (data){
            var rendered = $(templates.render('log',{
                underway_list:data.underway_list,
                accomplish_list:data.accomplish_list,
                overdue_list:data.overdue_list
            }));
            $('.create_generate_log').append(rendered);
            $("#management_ctn .generate_log_close").on("click",function(e){
                $("#management_ctn .create_generate_log").hide();
                $('.create_generate_log').empty()   
             });
            $('#newplan_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            }); 
            $(".new_plan").on("click",".new_plan_save",function(e){
                var j = plancommon()
                channel.post({
                    // idempotent: true,
                    url:"json/zg/backlog/",
                    data:j.j,
                    success: function (data) {
                        console.log(data)
                        if(data.errno===0){
                            var li = innhtml(j.inttitle,j.inttime,data)
                            $('.generate_log_plan_box').append(li)
                            del()
                            $('.generate_log_plan_ctn ').on('click',".generate_log_plan_editor",function(e){
                                e.preventDefault()
                                var that =$(this)
                                console.log(that)
                                var li  = "."+(that.parent().parent()).attr("class")
                                var textval=  $(li).find(".text-inline").text()
                                var textdate= $(li).find(".date-inline").text()
                                $(".new_plan_title").val(textval);
                                $(".create_taskdate").val(textdate);
                                var fix_id = that.next().find(".data_id").prevObject.attr("data_id")
                                $(li).remove()
                                var plan = $(".new_plan").find(".new_plan_save")
                                plan.attr("class","fix_plan_save")
                                plan.attr("revise_id",fix_id)
                                var cancel = $(".new_plan").find(".new_plan_cancel")
                                cancel.attr("class","fix_plan_cancel")
                                cancel.attr("revise_id",fix_id)
                            })
                        }
                    },
                });
                cancel()
            })
            $(".new_plan ").on("click",'.fix_plan_save',function(e){
                var j = plancommon()
                var over_time = timestamp(j.inttime);
                var obj = {
                    "task":j.inttitle,
                    "over_time":over_time,
                    "backlogs_id":$(this).attr("revise_id")
                }
                var data_list ={
                    "backlog_id":obj.backlogs_id
                }
                console.log(obj.backlogs_id)
                var data = JSON.stringify(obj)
                channel.put({
                    url:"json/zg/backlog/",
                    data:data,
                    success:function(data){
                        if(data.errno===0){
                            console.log()
                            var li = innhtml(j.inttitle,j.inttime,data_list)
                            $('.generate_log_plan_box').append(li)
                            del()
                            var plan = $(".new_plan").find(".fix_plan_save")
                                plan.attr("class","new_plan_save")
                            }
                    }
                })
                cancel()
            })
            $(".new_plan").on("click",".fix_plan_cancel",function(e){
                var j = plancommon()
                var data = {
                      backlog_id:$(this).attr("revise_id")
                }
                var li = innhtml(j.inttitle,j.inttime,data)
                $('.generate_log_plan_box').append(li)
                cancel()
                var plan = $(".new_plan").find(".fix_plan_cancel")
                    plan.attr("class","new_plan_cancel")
            })
            $(".generate_log_submit").on("click",function(e){
                var accomplish= $(".generate_log_finished_text").val()
                var underway  =$(".generate_log_unfinished_text").val()
                var overdue = $(".generate_log_pdfinished_text").val()
                var list = []
                $(".generate_log_plan_delete").each(function(){
                    var ids= $(this).attr('data_id')
                    list.push(ids)
                })
                const arr = list.toString()
                console.log(list,arr)
                console.log(accomplish,underway,overdue)
            })
            $('.new_plan').on('click',".new_plan_cancel",(e)=>{
                cancel()
            })
            
          
        }
        $(".generate_log").on("click",(e)=>{
             $(".create_generate_log").show();
            channel.get({
                url: "json/zg/creator/table?date_type=day",
                idempotent: true,
                success: function (data) {
                if(data){
                     logClick(data)
                    }
                },
            });
        })
        


       
        // $("#management_ctn").on("click",function(e){
        //     // console.log("修改成功")
        //     // e.preventDefault();
        //     e.stopPropagation();
        //     $(".create_generate_log").hide();
        // })
        
        $(".create_daily").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".create_weekly").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".create_monthly").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".new_task_title").on("click",function(e){
            $("#search_query").val("");
        })

        
        $(".new_task_save").on("click",function(e){
            var inttitle = $(".create_tasttitle").val();
            var inttime = $(".create_taskdate").val();
            function timestamp(str){
                str = str.replace(/-/g,'/');
                var date = new Date(str); 
                var time = date.getTime();
                var n = time/1000;
                return n;
            }
            var over_time = timestamp(inttime);
            var obj = {
                "task":inttitle,
                "over_time":over_time,
            }
            var j = JSON.stringify(obj)
            $.ajax({
                type:"POST",
                url:"json/zg/backlog/",
                contentType:"application/json",
                dataType:"json",
                data:j,
                success:function(res){
                    if(res.errno == 0){
                        $.ajax({
                            type:"GET",
                            url:"json/zg/backlog/",
                            success:function(response){
                                if(response.errno == 3){
                                    console.log(response.message)
                                }
                                var new_append_task;
                                var new_append_over_time;
                                var new_append_id;
                                for(var key in response.backlog_list){
                                    new_append_id = response.backlog_list[0].id
                                    new_append_task = response.backlog_list[0].task
                                    new_append_over_time = response.backlog_list[0].over_time
                                }
                                $(".todo_box").prepend("<li class='todo'>\
                                <div class='todo_left'>\
                                        <input type='checkbox' class='add_checkbox'>\
                                        <p class='add_ctn' taskid="+new_append_id+">"+new_append_task+"</p>\
                                </div>\
                                <div class='todo_right'>\
                                        <i class='iconfont icon-beizhu note_icon'></i>\
                                        <div id='file_choose'>\
                                            <input type='file' id='file_inputs' class='test-image-file'>\
                                            <i class='iconfont icon-fujian1 attachment_icon' id='attach_file'></i>\
                                         </div>\
                                        <p class='add_datatime'>"+new_append_over_time+"</p>\
                                </div>\
                            </li>")
                        $(".new_task_title").val("");
                        $(".new_task_date").val("");
                        var backlog_id;
                        $("#file_choose").on("click", "#file_inputs", function (e) {
                            // e.preventDefault();
                            // $("#file-choose #file_inputs").trigger("click");
                            console.log(4444)
                        });
                        $(".add_ctn").on("click",function(e){
                            $(".taskdetail_md").show();
                            $(".app").css("overflow-y","hidden");
                            $(".taskdetail_list").html($(this).html());
                            
                            var taskid = Number($(this).attr("taskid"))
                            backlog_id = taskid;
                        })
                        $(".taskdetail_tips_confirm").on("click",function(e){
                            var _obj_backlog_id = {
                                "backlog_id":backlog_id
                            }
                            var obj_backlog_id = JSON.stringify(_obj_backlog_id)
                            $.ajax({
                                type:"DELETE",
                                url:"json/zg/backlog/",
                                contentType:"application/json",
                                data:obj_backlog_id,
                                success:function(r){
                                }
                            })
                            $("p[taskid='"+backlog_id+"']").parent().parent().remove();
                            $(".taskdetail_tips_box").hide();
                            $(".taskdetail_md").hide();
                            $(".app").css("overflow-y","scroll");
                        })

                        $(".add_checkbox").on("click",function(e){
                            var inputid = Number($(this).attr("inputid"))
                            var state = ($(this).attr("state"))
                            if($(this).is(":checked")){
                                var _this = $(this);
                                state = ($(this).attr("state"))
                                state = 0;
                                var backlog_change = {
                                    state:0,
                                    backlogs_id:inputid
                                }
                                var obj_backlog_change = JSON.stringify(backlog_change);
                                $.ajax({
                                    type:"PUT",
                                    url:"json/zg/backlog/",
                                    contentType:"application/json",
                                    data:obj_backlog_change,
                                    success:function(res){
                                        _this.parent().parent().remove();
                                        $(".completed_box").prepend(_this.parent().parent());
                                        // 临时方案
                                        location.reload();
                                        // 临时方案
                                        //zyc添加
                                        //zyc添加
                                    }
                                })
                            }else{
                                
                            }
                        })
                            },
                            error:function(reject){
                                console.log(reject)
                            }   
                        })
                    }else if(res.errno == 1){
                        console.log(res.message)
                    }else if(res.errno == 3){
                        console.log(res.message)
                    }
                },
                error:function(rej){
                    console.log(rej)
                }
            })
        })

        $(".new_task_cancel").on("click",function(e){
            $(".new_task_title").val("");
            $(".new_task_date").val("")
        })
        //点击待办事项文本内容展示详情弹窗
        $(".add_ctn").on("click",function(e){
            console.log("dadasdasd")
            $(".taskdetail_md").show();
            $(".app").css("overflow-y","hidden")
            console.log("helow")
        })
        //点击任务详情模版关闭任务详情
        $(".taskdetail_md").on("click",function(e){
            e.stopPropagation();
            e.preventDefault();
            $(".taskdetail_md").hide();
            $(".app").css("overflow-y","scroll");
        })
        //任务详情上的内容点击生效
        $(".taskdetail_box").on("click",function(e){
            e.stopPropagation();
            // e.preventDefault();
        })
        //任务详情点击关闭
        $(".taskdetail_close").on("click",function(e){
            $(".taskdetail_md").hide();
            $(".app").css("overflow-y","scroll")
        })
        //日志弹窗关闭
        // $("#management_ctn .generate_log_close").on("click",function(e){
        //     console.log(1213)
        //     $("#management_ctn .create_generate_log").hide();
        // })
        //任务详情弹窗内的文件展示 划入事件
        $(".taskdetail_attachment").on("mousemove",function(e){
            $(this).css("border","1px solid #A0ACBF")
            $(this).children().last().show();
        })
        //任务详情弹窗内的文件展示 划出事件
        $(".taskdetail_attachment").on("mouseleave",function(e){
            $(this).css("border","1px solid #fff")
            $(this).children().last().hide();
        })
        $(".taskdetail_selectionbtn").on("click",function(e){
            // $(".taskdetail_selectionbtn").append()
        })
        
        //关闭操作提示
        $(".taskdetail_tips_close").on("click",function(e){
            $(".taskdetail_tips_box").hide();
        })
        //点击删除字样弹窗
        $(".taskdetail_deleteone").on("click",function(e){
            $(".taskdetail_tips_box").show();
        })
        //点击取消去除提示框
        $(".taskdetail_tips_cancel").on("click",function(e){
            $(".taskdetail_tips_box").hide();
        })
        // $(".todo_laber").on("click",function(e){
        //     console.log("xoxi1231")
        //     // $(".todo_label").removeClass()
        //     $(".todo_label").addClass("icon-weiwancheng")
        // })
        //日历汉化
            $.fn.datetimepicker.dates['zh-CN'] = {  
                days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],  
                daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],  
                daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],  
                months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],  
                monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],  
                today: "今日",  
                suffix: [],  
                meridiem: ["上午", "下午"],  
                weekStart: 1  
            };  
        //初始化 待办事项日历
            $('#datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });  
        //初始化 任务详情任务开始日历
            $('#taskstart_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });  
        //初始化 任务详情截止日历
            $('#taskstop_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });  
        //初始化 新计划日历
            // $('#newplan_datetimepicker').datetimepicker({  
            //     language:"zh-CN",  
            //     todayHighlight: true,  
            //     minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
            //     weekStart:1  
            // });  
            
        //初始化 筛选 开始时间日历
            $('#screenstart_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });  
        //初始化 筛选 结束时间日历
            $('#screenend_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            }); 
        //日志助手显示
            $(".log_assistant_btn").on("click",function(e){
                e.stopPropagation();
                e.preventDefault();
                var window_high = window.screen.height;
                $(".log_assistant_md").css("height",window_high);
                $(".log_assistant_md").css("overflow","auto");
                $(".log_assistant_md").show();
                $(".app").css("overflow-y","hidden");
                // $.ajax({
                //     type:"GET",
                //     url:"json/zg/receive/table",
                //     contentType:"application/json",
                //     success:function(res){
                //         console.log(res)

                //     }
                // })
                
                var html = templates.render("log_assistant_box")
                $(".app").after(html)
                //日志助手点击md关闭
                $(".log_assistant_md").on("click",function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    $(".log_assistant_md").hide();
                    $(".app").css("overflow-y","scroll")
                })
                //日志助手关闭
                $(".log_assistant_close").on("click",function(e){
                    $(".log_assistant_md").hide();
                    $(".app").css("overflow-y","scroll")
                    $('.log_assistant_md').empty()   
                })
                //日志助手阻止冒泡
                $(".log_assistant_box").on("click",function(e){
                    e.stopPropagation();
                    e.preventDefault();
                })
                //我收到的 点击内容
                $(".log_assistant_received").on("click",function(e){
                    $(this).addClass("high_light").siblings().removeClass("high_light");
                    $(".log_assistant_prompt_box").show();
                    $(".log_assistant_ctn").css("margin-top","0px");
                    $(".log_assistant_unread").hide();
                    $(".log_assistant_title").html("我收到的")
                })
                //我发出的 点击内容
                $(".log_assistant_send").on("click",function(e){
                    $(this).addClass("high_light").siblings().removeClass("high_light");
                    $(".log_assistant_prompt_box").hide();
                    $(".log_assistant_ctn").css("margin-top","20px");
                    $(".log_assistant_unread").show();
                    $(".log_assistant_title").html("我发出的")
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
            
        
            
           
            
            
        
        //只看未读
        $(".log_assistant_read").on("click",function(e){
            
        })
        
        
        //点击打开周报
        // $("#weekly").on("click",function(e){
        //     var zjson={
        //         d1:"这是一个秋天",
        //         d2:"风儿那么缠绵"
        //     }
        //     $(".management_siber").html("<div>"+zjson.d1+zjson.d2+"</div>")
        //     $.ajax({
        //         type:"",
        //         url:"",
        //         success:function(data){

        //         }
        //     })
        //     $(".management_set").show();
        // })
        // //点击关闭
        // $(".close_management_set").on("click",function(){
        //     $(".management_set").fadeOut();
        // })
        //拖拽效果
        // $(".management_set").on("mousedown",function(e){
        //     var x =parseInt(e.pageX - $(".management_set").offset().left);
        //     var y =parseInt(e.pageY - $(".management_set").offset().top); 
        //     $(".management_set").bind("mousemove",function(ev){
        //         var ox = ev.pageX - x;
        //         var oy = ev.pageY-y;
        //         $(".management_set").css({
        //             left:ox+"px",
        //             top:oy+"px"
        //         })
        //     })
        //     $(".management_set").on("mouseup",function(e){
        //         $(this).unbind("mousemove");
        //     })
        // })
    
        // $(".close_calendar").on("click",function(e){
    //     $("#schedule-box").hide();
    // })

    // label图标切换
    // $("label").on("click",function(e){
    //     var taskdetail_s = $("#taskdetail_check");
    //     console.log("hello")
    //     console.log(taskdetail_s)
    // })
    });

    
    
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
