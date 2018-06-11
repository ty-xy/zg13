    var management = (function () {
    var exports = {};
    $(function () {
        //点击一键生成日志 出现日志弹窗
        $(".generate_log").on("click",function(e){
            e.preventDefault();
            e.stopPropagation();
            $(".create_generate_log").show();
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
            let inttitle = $(".new_task_title").val();
            let inttime = $(".new_task_date").val();
            $.ajax({
                type:"GET",
                url:"",
                data:{
                    "inttitle":inttitle,
                    "inttime":inttime
                },
                success:function(res){

                },
                error:function(rej){

                }
            })
        })

        $(".new_task_cancel").on("click",function(e){
            $(".new_task_title").val("");
            $(".new_task_date").val("")
        })
        //点击待办事项文本内容展示详情弹窗
        $(".add_ctn").on("click",function(e){
            console.log("任务执行了")
            $(".taskdetail_md").show();
        })
        //点击任务详情模版关闭任务详情
        $(".taskdetail_md").on("click",function(e){
            e.stopPropagation();
            e.preventDefault();
            $(".taskdetail_md").hide();
        })
        //任务详情上的内容点击生效
        $(".taskdetail_box").on("click",function(e){
            e.stopPropagation();
            // e.preventDefault();
        })
        //任务详情点击关闭
        $(".taskdetail_close").on("click",function(e){
            $(".taskdetail_md").hide();
        })
        //日志弹窗关闭
        $(".generate_log_close").on("click",function(e){
            $(".create_generate_log").hide();
        })
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
            $('#newplan_datetimepicker').datetimepicker({  
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
                $(".app").css("overflow-y","hidden")
            })
        //日志助手关闭
            $(".log_assistant_close").on("click",function(e){
                $(".log_assistant_md").hide();
                $(".app").css("overflow-y","scroll")
            })
        //日志助手点击md关闭
            $(".log_assistant_md").on("click",function(e){
                e.stopPropagation();
                e.preventDefault();
                $(".log_assistant_md").hide();
                $(".app").css("overflow-y","scroll")
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
                console.log('dasdknjbcnjbn')
            })
        //我发出的 点击内容
            $(".log_assistant_send").on("click",function(e){
                $(this).addClass("high_light").siblings().removeClass("high_light");
                $(".log_assistant_prompt_box").hide();
                $(".log_assistant_ctn").css("margin-top","20px");
                $(".log_assistant_unread").show();
            })
        //日志助手拖拽
        $(".log_assistant_box").on("mousedown",function(e){
            var x =parseInt(e.pageX - $(".log_assistant_box").offset().left);
            var y =parseInt(e.pageY - $(".log_assistant_box").offset().top); 
            $(".log_assistant_box").bind("mousemove",function(ev){
                var ox = ev.pageX - x;
                var oy = ev.pageY-y;
                $(".log_assistant_box").css({
                    left:ox+"px",
                    top:oy+"px"
                })
            })
            $(".log_assistant_box").on("mouseup",function(e){
                $(this).unbind("mousemove");
            })
        })
        //只看未读
        $(".log_assistant_read").on("click",function(e){
            
        })
        //筛选
        $(".log_assistant_screening").on("click",function(e){
            
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
