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
        function fetch_data(){
            
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
                    success:function(data){
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
                j:j,
                inttitle:inttitle,
                inttime:inttime
            }
        }
        function logClick (data){
            var rendered = $(templates.render('log',{
                underway_list:data.underway_list,
                accomplish_list:data.accomplish_list,
                overdue_list:data.overdue_list
            }));
            $('.create_generate_log').append(rendered);
          
            //  $("#create_log_de").on("click",function(e){
        
            $("#management_ctn").on("click",".create_generate_log",function(e){
            // console.log("修改成功")
                 if(e.target.className==="create_generate_log"){
                     $(".create_generate_log").hide();
                     $('.create_generate_log').empty() 
                 }else{
                    return 
                 }
             })
            $("#management_ctn ").on("click",".generate_log_close",function(e){
                // $("#management_ctn .create_generate_log").hide();
                $(".create_generate_log").hide();
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
                            editor()
                        }
                    },
                });
                cancel()
            })
            function editor(){
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
       
            $(".new_plan ").on("click",'.fix_plan_save',function(e){
                var j = plancommon()
                var over_time = timestamp(j.inttime);
                var obj = {
                    "task":j.inttitle,
                    "over_time":over_time,
                    "backlog_id":$(this).attr("revise_id")
                }
                var data_list ={
                    "backlog_id":obj.backlog_id
                }
                console.log(obj.backlog_id)
                var data = JSON.stringify(obj)
                channel.put({
                    url:"json/zg/backlog/",
                    data:data,
                    success:function(data){
                        if(data.errno===0){
                            console.log()
                            var li = innhtml(j.inttitle,j.inttime,data_list)
                            $('.generate_log_plan_box').append(li)
                            var plan = $(".new_plan").find(".fix_plan_save")
                                plan.attr("class","new_plan_save")
                                editor()
                                del()
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
                var plan = $(".new_plan").find(".fix_plan_cancel")
                    plan.attr("class","new_plan_cancel")
                editor()
                del()
                cancel()
            })
            $(".generate_log_submit").on("click",function(e){
                var accomplish= $(".generate_log_finished_text").text()
                var underway  =$(".generate_log_unfinished_text").val()
                var overdue = $(".generate_log_pdfinished_text").val()
                var list = []
                $(".generate_log_plan_delete").each(function(){
                    var ids= $(this).attr('data_id')
                    list.push(ids)
                })
                // var arr = list.toString()
                console.log(list)
                console.log(accomplish,underway,overdue)
                 var paramas ={
                    accomplish:$.trim(accomplish),
                    underway:$.trim(underway),
                    overdue:$.trim(overdue),
                    backlog_list:list,
                    send_list:[27],
                    date_type:"day"
                 }
                 console.log(paramas)
                 channel.post({
                        url:"json/zg/v1/table",
                        data:JSON.stringify(paramas),
                        // idempotent: true,
                        contentType:"application/json",
                        success:function(data){
                            console.log(data)
                        }
                 })
            })
            $('.new_plan').on('click',".new_plan_cancel",function(e){
                cancel()
            })
           
            $('.add_log_people').on("click",".generate_log_member_addlogo",function(e){
                $(".modal-log").show()
                var list = []
                channel.get({
                    url:"json/streams",
                    success:function(data){
                        data.streams.forEach(function(el,i){
                             list[el.stream_id]=el.name
                        })
                        var rendered = $(templates.render('choose',{
                            data:list
                        }));
                        $(".modal-log-content").append(rendered)
                        $(".button-cancel").on("click",function(e){
                        $(".modal-log").hide()
                        })
                        $(".button-confirm").on("click",function(e){
                            $(".modal-log").hide()
                        })
                        $(".box-list-left").on("click",".choose-check",function(e){
                            var inputid= Number($(this).attr("inputid"))
                            // $(".modal-log-content").empty()
                            if($(this).is(":checked")){
                                channel.get({
                                    url:"json/zg/v1/stream/recipient/data",
                                    success:function(data){
                                        if(data.errno===0){
                                             console.log(data)
                                            var li = $(templates.render('choose_person',{
                                                datalist:data.streams_dict[inputid],
                                            }));
                                            // console.log((".box-right-list").length)
                                            $(".box-right-list").append(li)
                                            $(".button-cancel").on("click",function(e){
                                                $(".box-right-list").remove()
                                            })
                                        }
                                    }
                                })
                            }
                       })
                        $(".button-right").on("click",function(e){
                             var id = $(this).attr('button-key')
                             channel.get({
                                url:"json/zg/v1/stream/recipient/data",
                                success:function(data){
                                    if(data.errno===0){
                                        var li = $(templates.render('choose_people',{
                                            data:data.streams_dict[id]
                                        }));
                                        $(".modal-log-content").append(li)
                                        $(".button-cancel").on("click",function(e){
                                            $(".choose-teams-list").remove()
                                        })
                                    }
                                }
                            })
                        })
                    }
                })
                console.log(list)
                
            })
        }
     
        $(".generate_log").on("click",function(e){
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
       
        // $("#create_log_de").on("click",function(e){
        //     // console.log("修改成功")
        //     e.preventDefault();
        //     e.stopPropagation();
        //     console.log(1231321)
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

        function updata(){
            $.ajax({
                type:"GET",
                url:"json/zg/backlog",
                success:function(res){
                    $(".todo_box").children().remove();
                    var backlog_list = res.backlog_list
                    var past_due_list = res.past_due_list
                    var html_li = templates.render("todo_box_li",{backlog_list:backlog_list,past_due_list:past_due_list});
                    $(".todo_box").append(html_li)
                }
            })
            $.ajax({
                type:"GET",
                url:"json/zg/backlog/accomplis",
                data:{page:1},
                success:function(rescompleted){
                    $(".completed_box").children().remove();
                    var completed_data = rescompleted.accomplis_backlog_list
                    var html_completed = templates.render("completed_li",{completed_data:completed_data})
                    $(".completed_box").append(html_completed);
                }
            })
        }
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
                "over_time":over_time+86399,
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
                            //     var new_append_task;
                            //     var new_append_over_time;
                            //     var new_append_id;
                            //     for(var key in response.backlog_list){
                            //         new_append_id = response.backlog_list[0].backlog_id
                            //         new_append_task = response.backlog_list[0].task
                            //         new_append_over_time = response.backlog_list[0].over_time
                            //     }
                            //     $(".todo_box").prepend("<li class='todo'>\
                            //     <div class='todo_left'>\
                            //             <input type='checkbox' class='add_checkbox'>\
                            //             <p class='add_ctn' inputid="+new_append_id+" taskid="+new_append_id+">"+new_append_task+"</p>\
                            //     </div>\
                            //     <div class='todo_right'>\
                            //             <i class='iconfont icon-beizhu note_icon'></i>\
                            //             <i class='iconfont icon-fujian1 attachment_icon' id='file-inputs'></i>\
                            //             <p class='add_datatime'>"+new_append_over_time+"</p>\
                            //     </div>\
                            // </li>")
                            //测试方案2
                            updata()
                            //测试方案2
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

                        //
                        $(".todo_box").on("click",".add_checkbox",function(e){
                            var inputid = Number($(this).attr("inputid"))
                            var state = ($(this).attr("state"))
                            if($(this).is(":checked")){
                                var _this = $(this);
                                state = ($(this).attr("state"))
                                state = 0;
                                var backlog_change = {
                                    state:0,
                                    backlog_id:inputid
                                }
                                var obj_backlog_change = JSON.stringify(backlog_change);
                                $.ajax({
                                    type:"PUT",
                                    url:"json/zg/backlog/",
                                    contentType:"application/json",
                                    data:obj_backlog_change,
                                    success:function(res){
                                        // _this.parent().parent().remove();
                                        // $(".completed_box").prepend(_this.parent().parent());
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/backlog",
                                            success:function(res){
                                                $(".todo_box").children().remove();
                                                var backlog_list = res.backlog_list
                                                var past_due_list = res.past_due_list
                                                var html_li = templates.render("todo_box_li",{backlog_list:backlog_list,past_due_list:past_due_list});
                                                $(".todo_box").append(html_li)
                                            }
                                        })
                                        $.ajax({
                                            type:"GET",
                                            url:"json/zg/backlog/accomplis",
                                            data:{page:1},
                                            success:function(rescompleted){
                                                $(".completed_box").children().remove();
                                                var completed_data = rescompleted.accomplis_backlog_list
                                                var html_completed = templates.render("completed_li",{completed_data:completed_data})
                                                $(".completed_box").append(html_completed);
                                            }
                                        })
                                    }
                                })
                            }else{
                                
                            }
                        })
                        //统一
                        // $(".todo_box").on("click",".add_checkbox",function(e){
                        //     var inputid = Number($(this).attr("taskid"))
                        //     console.log(inputid)
                        //     var state = ($(this).attr("state"))
                        //     console.log(state)
                        //     if($(this).is(":checked")){
                        //         var _this = $(this);
                        //         state = ($(this).attr("state"))
                        //         state = 0;
                        //         var backlog_change = {
                        //             state:0,
                        //             backlog_id:inputid
                        //         }
                        //         var obj_backlog_change = JSON.stringify(backlog_change);
                        //         $.ajax({
                        //             type:"PUT",
                        //             url:"json/zg/backlog/",
                        //             contentType:"application/json",
                        //             data:obj_backlog_change,
                        //             success:function(res){
                        //                 // _this.parent().parent().remove();
                        //                 // $(".completed_box").prepend(_this.parent().parent());
                        //                 $.ajax({
                        //                     type:"GET",
                        //                     url:"json/zg/backlog",
                        //                     success:function(res){
                        //                         $(".todo_box").children().remove();
                        //                         var backlog_list = res.backlog_list
                        //                         var past_due_list = res.past_due_list
                        //                         var html_li = templates.render("todo_box_li",{backlog_list:backlog_list,past_due_list:past_due_list});
                        //                         $(".todo_box").append(html_li)
                        //                     }
                        //                 })
                        //                 $.ajax({
                        //                     type:"GET",
                        //                     url:"json/zg/backlog/accomplis",
                        //                     data:{page:1},
                        //                     success:function(rescompleted){
                        //                         $(".completed_box").children().remove();
                        //                         var completed_data = rescompleted.accomplis_backlog_list
                        //                         var html_completed = templates.render("completed_li",{completed_data:completed_data})
                        //                         $(".completed_box").append(html_completed);
                        //                     }
                        //                 })
                        //             }
                        //         })
                        //     }else{
                                
                        //     }
                        // })
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
                var receive_table_list = [];
                $.ajax({
                    type:"GET",
                    url:"json/zg/v1/my/receive",
                    contentType:"application/json",
                    success:function(res){
                        receive_table_list = res.receive_table_list;
                        console.log(receive_table_list)
                        console.log(res)
                        console.log(res.message)
                        // console.log(res)
                        // console.log("hellonhdfvjkbojs")
                                    //日志助手 我发出的
                        // $(".log_assistant_send").on("click",function(e){
                        //     e.stopPropagation();
                        //     e.preventDefault();
                        //     $.ajax({
                        //         type:"GET",
                        //         url:"json/zg/v1/my/send",
                        //         contentType:"application/json",
                        //         success:function(res){
                        //             receive_table_list = res;
                        //             console.log(res)
                        //             console.log("hellonhdfvjkbojs")
                        //         }
                        //     })
                        // })
                    }
                })
                console.log(receive_table_list)
                console.log("hello")
                var html = templates.render("log_assistant_box")
                $(".app").after(html)
                // $(".log_assistant_md").remove();
                //日志助手点击md关闭
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
