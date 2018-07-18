var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            // var da = {
            //     name:"周明珠",
            //     member:[34,35,36,37,38,39,40],
            //     jobs_time:"09:30:00",
            //     rest_time:"20:00:00",
            //     date:"123456",
            //     longitude:"123.12",
            //     latitude:"123.11",
            //     location:"华普国际大厦CBD",
            //     range:"100000"
            // }
            $.ajax({
                    type:"GET",
                    url:"json/zg/attendances/management",
                    contentType:"application/json",
                    success:function(res){
                        if(res.super_user==true){
                            //确认管理员身份继续请求日统计数据
                            var attendances_id;
                            for(var i=0;i<res.attendances_list.length;i++){
                                attendances_id = res.attendances_list[0].attendances_id
                            }
                            $.ajax({
                                type:"GET",
                                url:"json/zg/attendances/day?attendances_id="+attendances_id+"",
                                success:function(res){
                                    console.log(res)
                                }
                            })
                            var html = templates.render("attendance_box");
                            $(".app").after(html);
                            var attendances_list = res.attendances_list;
                            var attendance_all = templates.render("attendance_all",{attendances_list:attendances_list})
                            $(".attendance_ctn").append(attendance_all)
                            //关闭考勤
                            $(".attendance_close").on("click",function(){
                                $(".attendance_md").hide();
                            })
                            //初始化按事件筛选
                            $(".calendar_screen_select_y").datetimepicker({
                                language:"zh-CN",  
                                todayHighlight: true,  
                                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                                weekStart:1,
                                format:"yyyy-mm-dd"
                            })
                            //查看考勤日历
                            $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                                $(".attendance_ctn").children().remove();
                                $.ajax({
                                    type:"GET",
                                    url:"json/zg/attendance/month/solo/web",
                                    contentType:"application/json",
                                    data:{page:1},
                                    success:function(res){
                                        var month_attendance_list = res.month_attendance_list;
                                        var calendar_box = templates.render("calendar_box",{month_attendance_list:month_attendance_list});
                                        $(".attendance_ctn").append(calendar_box);
                                        //筛选时间
                                        $(".calendar_screen_select").datetimepicker({
                                            startView: 'decade',
                                            minView: 'decade',
                                            format: 'yyyy',
                                            maxViewMode: 2,
                                            minViewMode:2,
                                            autoclose: true
                                            }).on("changeDate",function(){
                                                console.log("这是一个秋天")
                                        }); 
                                        //点击具体日期显示详情
                                        $(".calendar_list").on("click",".calendar_list_num",function(){
                                            $(this).addClass("gray_date").parent().siblings().children().removeClass("gray_date");
                                        })
                                    }
                                })
                                
                                
                                //补卡弹窗
                                // var calendar_card = templates.render("calendar_card")
                                // $(".attendance_ctn").append(calendar_card)
                                

                            })
                            //返回到管理界面
                            $(".attendance_box").on("click",".calendar_return",function(){
                                $(".attendance_ctn").children().remove();
                                var attendance_all = templates.render("attendance_all")
                                $(".attendance_ctn").append(attendance_all);
                                //初始化按事件筛选
                                $(".calendar_screen_select_y").datetimepicker({
                                    language:"zh-CN",  
                                    todayHighlight: true,  
                                    minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                                    weekStart:1,
                                    format:"yyyy-mm-dd"
                                })
                                //查看考勤日历
                                $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                                    $(".attendance_ctn").children().remove();
                                //    var calendar_box = templates.render("calendar_box");
                                //    $(".attendance_ctn").append(calendar_box);
                                    $.ajax({
                                        type:"GET",
                                        url:"json/zg/attendance/month/solo/web",
                                        contentType:"application/json",
                                        data:{page:1},
                                        success:function(res){
                                            var month_attendance_list = res.month_attendance_list;
                                            var calendar_box = templates.render("calendar_box",{month_attendance_list:month_attendance_list});
                                            $(".attendance_ctn").append(calendar_box);
                                            //筛选时间
                                            $(".calendar_screen_select").datetimepicker({
                                                startView: 'decade',
                                                minView: 'decade',
                                                format: 'yyyy',
                                                maxViewMode: 2,
                                                minViewMode:2,
                                                autoclose: true
                                                }).on("changeDate",function(){
                                                    console.log("这是一个秋天")
                                            });
                                                //点击具体日期显示详情
                                            $(".calendar_list").on("click",".calendar_list_num",function(){
                                                $(this).addClass("gray_date").parent().siblings().children().removeClass("gray_date");
                                            })
                                        }
                                    })
                                })
                            })      
                            //点击考勤组的样式
                            $(".attendance_mangement").on('click',function(){
                                $(this).addClass("high_light").siblings().removeClass("high_light")
                                var html = templates.render("attendance_management");
                                $(".attendance_ctn").html(html)
                            })
                            //新增加项目
                            $(".attendance_ctn").on('click',".new_attendance",function(){
                                var html = templates.render("attendance_team");
                                $(".attendance_ctn").html(html)
                                //选择日期
                                $(".button-common").datetimepicker({
                                    language:"zh-CN",  
                                    weekStart: 1,
                                    todayBtn:  0,
                                    autoclose: 1,
                                    todayHighlight: 1,
                                    startView: 1,
                                    minView: 0,
                                    showHours : true,
                                    // minuteStep:1,
                                    maxView: 1,
                                    forceParse: 0,
                                    format:'hh:ii',
                                    })
                                //接入地点
                                $(".kaoqin-era").on('click',function(){
                                    $('#map-area').show()
                                    $("#map-area").on('click',".attendance-map-close",function(){
                                        $('#map-area').hide()
                                    })
                                })
                                $(".button-common-date").on('click',function(){
                                    $(".kaoqin-date-choose").show()
                                    $(".attendance_close_week").on('click',function(){
                                        $(".kaoqin-date-choose").hide()
                                    })
                                })
                                $(".kaoqin-date-area").on('click',function(){
                                    $(".kaoqin-date-choose").hide()
                                })
                                
                            })
                            $(".attendance_ctn").on('click',".back_attendance",function(){
                                var html = templates.render("attendance_management");
                                $(".attendance_ctn").html(html)
                            })
                        }else{
                        //普通成员请求
                        }
                }
            })
            
        })
      
          
    });  
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
