var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        function confirm(){
            //点击确定
            $(".choose-right-list").on('click','.button-confirm',function(e){
                var arrlist =[]
                var peopleList = []
                $('#create_log_de .generate_log_member_box').children().not($(".add_log_people")).each(function(){
                    var index = Number($(this).attr('data_id'))
                    peopleList.push(index)
                })
                var idlist = []
                var namelist =[]
                $(".box-right-list").children().each(function () { 
                    var id = Number($(this).attr("key-data"));
                 //    var avatar = $(this).attr("avatarurl")
                    var name = $(this).children().find('.name-list').text()
                    var peppleList = {
                        id:id,
                     //    avatar:avatar,
                        name:name,
                     //    namel:name.slice(0,4)+"...."
                    }
                    if(peopleList.indexOf(peppleList.id)===-1){
                        arrlist.push(peppleList)
                        idlist.push(peppleList.id)
                        namelist.push(peppleList.name)
                    }
                })
                namelist=namelist.join(",")
                $(".button-common-people").html(namelist)
                $(".button-common-people").attr("data_id",idlist)
             //    var li = $(templates.render('send_people',{
             //       peoplelist:arrlist
             //   }));
               
               $('.box-right-list').remove()
               $(".modal-log").hide()
               //清除里面所有的元素，模态框消失。
               $(".modal-log-content").empty()
        
            })
        }
        function xy(content){
                var idlist = []
                var namelist =[]
                  _.each(content,function(value,index){
                    idlist.push(index)
                    namelist.push(value.fullname)
                  })
                namelist=namelist.join(",")
                $(".button-common-people").html(namelist)
                $(".button-common-people").attr("data_obj",JSON.stringify(content))
                $(".button-common-people").attr("data_id",idlist)
        }
      
        exports.attendance = function(){
            //查看考勤日历
            function checkCalendar(user_id,select_year){  
                var user_id;
                var select_year = select_year;
                $.ajax({
                    type:"GET",
                    url:"json/zg/attendance/month/solo/web?user_id="+user_id+"&select_year="+select_year+"",
                    contentType:"application/json",
                    data:{page:1},
                    success:function(res){
                        $(".attendance_ctn").children().remove()
                        var month_attendance_list = res.month_attendance_list;
                        var month_week;
                        var attendances_id;
                        for(var i =0;i<month_attendance_list.length;i++){
                            month_week = month_attendance_list[0].month_week
                            attendances_id = month_attendance_list[0].user_atendance
                        }
                        var calendar_box = templates.render("calendar_box",{attendances_id:attendances_id});
                        var calendar_list = templates.render("calendar_list",{month_attendance_list:month_attendance_list})
                        $(".attendance_ctn").append(calendar_box);
                        if(select_year != undefined){
                            $(".calendar_screen_select").val(select_year)
                        }
                        $(".attendance_ctn").append(calendar_list);
                        var height = window.screen.height
                        $(".attendance_box").css("height",height)
                        //筛选时间
                        $(".calendar_screen_select").datetimepicker({
                            startView: 'decade',
                            minView: 'decade',
                            format: 'yyyy',
                            maxViewMode: 2,
                            minViewMode:2,
                            autoclose: true
                            }).on("changeDate",function(){
                                console.log("--------------------")
                                var select_year = $(this).val();
                                checkCalendar(user_id,select_year);
                                
                        }); 
                        //获取个人单天考勤信息
                        $.ajax({
                            type:"GET",
                            url:"json/zg/attendance/day/solo",
                            contentType:"application/json",
                            success:function(res){
                                // console.log(res)
                                var attendance_name = res.attendance_name;
                                var jobs_time = res.jobs_time;
                                var location = res.location;
                                var rest_time = res.rest_time;
                                var sign_in_explain = res.sign_in_explain;
                                var sign_in_time = res.sign_in_time;
                                var sign_off_explain = res.sign_off_explain;
                                var sign_off_time = res.sign_off_time;
                                if(sign_in_time){
                                    var m = Number(sign_in_time.substring(8,10));
                                }
                                var n = m + month_week - 2;
                                console.log(res)
                                var calendar_detail = templates.render("calendar_detail",{
                                    attendance_name:attendance_name,
                                    jobs_time:jobs_time,location:location,rest_time:rest_time,sign_in_explain:sign_in_explain,
                                    sign_in_time:sign_in_time,sign_off_explain:sign_off_explain,sign_off_time:sign_off_time
                                });
                                console.log("--------------")
                                console.log(calendar_detail)
                                $(".calendar_list_box").first().after(calendar_detail);
                                $(".calendar_list_box").first().children().children().children().eq(n).children().first().addClass("gray_date")
                            }
                         })
                        //点击具体日期显示详情
                        $(".calendar_list").on("click",".calendar_list_num",function(){
                            $(this).addClass("gray_date").parent().siblings().children().removeClass("gray_date");
                        })
                        //点击日期事件
                        $(".calendar_list").on("click",".calendar_list_num",function(){
                            var user_date = $(this).text();
                            var year = $(this).attr("year");
                            var month = $(this).attr("month");
                            user_id = user_id
                            var _this = $(this);
                            checkOne(user_date,user_id,year,month,_this)
                        })

                    }
                })
            }
          
            //查看自己考勤日历
            function checkCalendarMy(user_id,select_year){  
                var user_id;
                var select_year = select_year;
                $.ajax({
                    type:"GET",
                    url:"json/zg/attendance/month/solo/web?select_year="+select_year+"",
                    contentType:"application/json",
                    data:{page:1},
                    success:function(res){
                        if(res.errno == 233){
                            var personal_space = templates.render("personal_space");
                            $(".attendance_ctn").append(personal_space)
                            return;
                        }
                        var month_attendance_list = res.month_attendance_list;
                        var month_week;
                        for(var i =0;i<month_attendance_list.length;i++){
                            month_week = month_attendance_list[0].month_week
                        }
                        var calendar_box = templates.render("calendar_box");
                        var calendar_list = templates.render("calendar_list",{month_attendance_list:month_attendance_list})
                        $(".attendance_ctn").append(calendar_box);
                        $(".attendance_ctn").append(calendar_list)
                        $(".calendar_return").hide();
                        $(".calendar_screen").css("float","right");
                        //筛选时间
                        $(".calendar_screen_select").datetimepicker({
                            startView: 'decade',
                            minView: 'decade',
                            format: 'yyyy',
                            maxViewMode: 2,
                            minViewMode:2,
                            autoclose: true
                            }).on("changeDate",function(){
                                console.log("0000")
                                var select_year = $(this).val();
                                checkCalendar(user_id,select_year);
                                
                        }); 
                        //获取个人单天考勤信息
                        $.ajax({
                            type:"GET",
                            url:"json/zg/attendance/day/solo",
                            contentType:"application/json",
                            success:function(res){
                                var attendance_name = res.attendance_name;
                                var jobs_time = res.jobs_time;
                                var location = res.location;
                                var rest_time = res.rest_time;
                                var sign_in_explain = res.sign_in_explain;
                                var sign_in_time = res.sign_in_time;
                                var sign_off_explain = res.sign_off_explain;
                                var sign_off_time = res.sign_off_time;
                                if(sign_in_time){
                                    var m = Number(sign_in_time.substring(8,10));
                                }
                                var n = m + month_week - 2;
                                var calendar_detail = templates.render("calendar_detail",{
                                    attendance_name:attendance_name,
                                    jobs_time:jobs_time,location:location,rest_time:rest_time,sign_in_explain:sign_in_explain,
                                    sign_in_time:sign_in_time,sign_off_explain:sign_off_explain,sign_off_time:sign_off_time
                                });
                                $(".calendar_list_box").first().after(calendar_detail);
                                $(".calendar_list_box").first().children().children().children().eq(n).children().first().addClass("gray_date")
                            }
                         })
                        //点击具体日期显示详情
                        $(".calendar_list").on("click",".calendar_list_num",function(){
                            $(this).addClass("gray_date").parent().siblings().children().removeClass("gray_date");
                        })
                        //点击日期事件
                        $(".calendar_list").on("click",".calendar_list_num",function(){
                            var user_date = $(this).text();
                            var year = $(this).attr("year");
                            var month = $(this).attr("month");
                            user_id = "";
                            var _this = $(this);
                            checkOne(user_date,user_id,year,month,_this)
                        })
                    }
                })
            }
            //点击切换考勤组
            function checkOut(attendances_id){
                 $.ajax({
                     type:"GET",
                     url:"json/zg/attendances/day?attendances_id="+attendances_id+"",
                     contentType:"application/json",
                     success:function(res){
                         $(".attendance_middle").remove();
                         $(".attendance_bottom").remove();
                         var attendances_member_list = res.attendances_member_list;
                         var attendance_member = templates.render("attendance_member",{attendances_member_list:attendances_member_list})
                         $(".attendance_ctn").append(attendance_member);
                         //搜索全部成员
                         var p = $(".attendance_bottom_ctn").children();
                         $(".attendance_bottom_search_person").bind('input propertychange',function(){
                             var searchText = $(this).val();
                             var $searchLi = "";
                             var peopleArr = []
                             for(var i =0;i<p.length;i++){
                                peopleArr.push(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML)
                             }
                             for(var key in peopleArr){
                                    for(var i =0;i<p.length;i++){
                                        if(peopleArr[key] == searchText){
                                            if(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML == searchText){
                                                $(".attendance_bottom_ctn").html(p[i]).clone()
                                            }
                                         }
                                    }
                             }
                             if(searchText != ""){
                                 $searchLi = $(".attendance_bottom_ctn").find('p:contains('+ searchText +')').parent();
                                 $(".attendance_bottom_ctn").html("");
                             }
                             $(".attendance_bottom_ctn").html($searchLi).clone();
                             if ($searchLi.length <= 0) {
                                 $(".attendance_bottom_ctn").html("<li>没有找到该成员</li>")
                             }
                             if (searchText == "") {
                                 $(".attendance_bottom_ctn").children().remove();
                                 $(".attendance_bottom_ctn").append(p)
                             }
                         })
                         //搜索全部成员
                         //查看考勤日历
                         $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                             $(".attendance_ctn").children().remove();
                             var user_id = $(this).attr("user_id")
                             checkCalendar(user_id);
                             //补卡弹窗
                             // var calendar_card = templates.render("calendar_card")
                             // $(".attendance_ctn").append(calendar_card)
                         })
                     }
                 })
            }
            //查找具体某一天考勤信息
            function checkOne(user_date,user_id,year,month,_this){
                var user_date = user_date;
                var user_id = user_id;
                var year = year;
                var month = month;
                var _this = _this;
                if(month<10){
                    month = '0'+month
                }
                user_date = ''+year+'-'+month+'-'+user_date
                $.ajax({
                    type:"GET",
                    url:"json/zg/attendance/day/solo?user_date="+user_date+"&user_id="+user_id+"",
                    contentType:"application/json",
                    success:function(res){
                        $(".calendar_place_box").remove();
                        $(".calendar_time_box").remove();
                        var attendance_name = res.attendance_name;
                        var jobs_time = res.jobs_time;
                        var location = res.location;
                        var rest_time = res.rest_time;
                        var sign_in_explain = res.sign_in_explain;
                        var sign_in_time = res.sign_in_time;
                        var sign_off_explain = res.sign_off_explain;
                        var sign_off_time = res.sign_off_time;
                        var calendar_detail = templates.render("calendar_detail",{
                            attendance_name:attendance_name,
                            jobs_time:jobs_time,location:location,rest_time:rest_time,sign_in_explain:sign_in_explain,
                            sign_in_time:sign_in_time,sign_off_explain:sign_off_explain,sign_off_time:sign_off_time
                        });
                        _this.parent().parent().parent().parent().after(calendar_detail)
                    }
                })
            }
            //默认加载内容
            $.ajax({
                    type:"GET",
                    url:"json/zg/attendances/day",
                    contentType:"application/json",
                    success:function(res){
                        $(".attendance_md").remove();
                        if(res.super_user==true){
                            if(res.errno == 11){
                                var html = templates.render("attendance_box");
                                $(".move_ctn").append(html);   
                                $(".attendance_statistics").remove();
                                $(".attendance_mangement").addClass("high_light").removeClass("attendance_mangement");
                                    $(".attendance_ctn").empty();
                                    var html = templates.render("attendance_team");
                                    $(".attendance_ctn").html(html);
                                    $(".back_attendance").remove();
                                    $(".attendance_ctn .button-common").datetimepicker({
                                        language:"zh-CN",  
                                        weekStart: 1,
                                        todayBtn:  0,
                                        autoclose: 1,
                                        todayHighlight: 1,
                                        startView: 1,
                                        minView: 0,
                                        showHours : true,
                                        // minuteStep:1,z
                                        maxView: 1,
                                        forceParse: 0,
                                        format:'hh:ii:00',
                                        time:"09:00:00"
                                        })
                                    commonf()
                                    commit()
                                    //关闭考勤
                                    $(".attendance_close").on("click",function(){
                                        $(".attendance_md").hide();
                                    })
                                    return;
                            }
                            //确认管理员身份继续请求日统计数据
                            var html = templates.render("attendance_box");
                            $(".move_ctn").append(html);                       
                            var attendances_list = res.attendances_list;
                            var attendances_member_list = res.attendances_member_list;
                            var attendance_all = templates.render("attendance_all",{attendances_list:attendances_list})
                            var attendance_member = templates.render("attendance_member",{attendances_member_list:attendances_member_list})
                            $(".attendance_ctn").append(attendance_all)
                            $(".attendance_ctn").append(attendance_member)
                            $("body").ready(function(){
                                $(".attendance_groups").children().first().addClass("gray_bg");
                            })
                            //搜索全部成员
                            var p = $(".attendance_bottom_ctn").children();
                            $(".attendance_bottom_search_person").bind('input propertychange',function(){
                                var searchText = $(this).val();
                                var $searchLi = "";
                                var peopleArr = []
                                for(var i =0;i<p.length;i++){
                                   peopleArr.push(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML)
                                }
                                for(var key in peopleArr){
                                       for(var i =0;i<p.length;i++){
                                           if(peopleArr[key] == searchText){
                                               if(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML == searchText){
                                                   $(".attendance_bottom_ctn").html(p[i]).clone()
                                               }
                                            }
                                       }
                                }
                                if(searchText != ""){
                                    $searchLi = $(".attendance_bottom_ctn").find('p:contains('+ searchText +')').parent();
                                    $(".attendance_bottom_ctn").html("");
                                }
                                $(".attendance_bottom_ctn").html($searchLi).clone();
                                if ($searchLi.length <= 0) {
                                    $(".attendance_bottom_ctn").html("<li>没有找到该成员</li>")
                                }
                                if (searchText == "") {
                                    $(".attendance_bottom_ctn").children().remove();
                                    $(".attendance_bottom_ctn").append(p)
                                }
                            })
                            //搜索全部成员
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
                            //点击切换考勤组
                            $(".attendance_groups").on("click",".attendance_groups_list",function(){
                                var attendances_id = $(this).attr("attendances_id");
                                //考勤组样式切换
                                $(this).addClass("gray_bg").siblings().removeClass("gray_bg");
                                checkOut(attendances_id);
                            })
                            //查看考勤日历
                            $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                                $(".attendance_ctn").children().remove();
                                var user_id = $(this).attr("user_id")
                                checkCalendar(user_id);
                            })
                            //返回到管理界面
                            $(".attendance_box").on("click",".calendar_return",function(){
                                var attendances_id = $(this).attr("attendances_id");
                                $.ajax({
                                    type:"GET",
                                    url:"json/zg/attendances/day?attendances_id="+attendances_id+"",
                                    // url:"json/zg/attendances/day",
                                    contentType:"application/json",
                                    success:function(res){
                                        if(res.super_user==true){
                                            $(".attendance_ctn").children().remove();
                                            var attendances_list = res.attendances_list;
                                            var attendances_member_list = res.attendances_member_list;
                                            var attendance_all = templates.render("attendance_all",{attendances_list:attendances_list})
                                            var attendance_member = templates.render("attendance_member",{attendances_member_list:attendances_member_list})
                                            $(".attendance_ctn").append(attendance_all)
                                            $(".attendance_ctn").append(attendance_member)
                                            $(".attendance_groups_list[name="+attendances_id+"]").addClass("gray_bg")
                                            //搜索全部成员
                                            var p = $(".attendance_bottom_ctn").children();
                                            $(".attendance_bottom_search_person").bind('input propertychange',function(){
                                                var searchText = $(this).val();
                                                var $searchLi = "";
                                                var peopleArr = []
                                                for(var i =0;i<p.length;i++){
                                                   peopleArr.push(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML)
                                                }
                                                for(var key in peopleArr){
                                                       for(var i =0;i<p.length;i++){
                                                           if(peopleArr[key] == searchText){
                                                               if(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML == searchText){
                                                                   $(".attendance_bottom_ctn").html(p[i]).clone()
                                                               }
                                                            }
                                                       }
                                                }
                                                if(searchText != ""){
                                                    $searchLi = $(".attendance_bottom_ctn").find('p:contains('+ searchText +')').parent();
                                                    $(".attendance_bottom_ctn").html("");
                                                }
                                                $(".attendance_bottom_ctn").html($searchLi).clone();
                                                if ($searchLi.length <= 0) {
                                                    $(".attendance_bottom_ctn").html("<li>没有找到该成员</li>")
                                                }
                                                if (searchText == "") {
                                                    $(".attendance_bottom_ctn").children().remove();
                                                    $(".attendance_bottom_ctn").append(p)
                                                }
                                            })
                                            //搜索全部成员
                                            //点击切换考勤组
                                            $(".attendance_groups").on("click",".attendance_groups_list",function(){
                                                var attendances_id = $(this).attr("attendances_id");
                                                //考勤组样式切换
                                                $(this).addClass("gray_bg").siblings().removeClass("gray_bg");
                                                checkOut(attendances_id);
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
                                                var user_id = $(this).attr("user_id")
                                                checkCalendar(user_id);
                                            })
                                        }else{
                                            var html = templates.render("attendance_box");
                                            $(".move_ctn").append(html);
                                            checkCalendar();
                                        }
                                    }
                                })
                                
                                
                                
                            })      
                            // 点击考勤组的样式
                            $(".attendance_box").on('click',".attendance_mangement",function(){
                                var original = $(".attendance_ctn").children();
                                $(this).addClass("high_light").siblings().removeClass("high_light")
                                 channel.get({
                                    url:"json/zg/attendances/management",
                                    success:function(data){
                                       var data_list = data.attendances_list
                                       var html = $(templates.render('attendance_management',{
                                        data_list:data_list
                                        }));
                                       $(".attendance_ctn").html(html)
                                       $(".attendance_ctn").on('click',".back_attendance",function(){
                                        $(".attendance_ctn").empty()
                                           $(".attendance_ctn").html(html)
                                      })
                                       $(".attendance_ctn").on("click",".button-delete",function(){
                                        var attendances_id= $(this).attr("data_id")
                                        var that = $(this)
                                           channel.del({
                                                 url:"json/zg/attendances/del/",
                                                 data:JSON.stringify({attendances_id:attendances_id}),
                                                 success:function(data){
                                                    if(data.errno == 0){
                                                        alert(data.message,'rgba(0,107,169,0.30)')
                                                        that.parent().parent().remove()
                                                    }
                                                 }
                                           })
                                       })
                                       $(".attendance_ctn").on("click",".button-fix",function(){
                                            var index =$(this).attr("data_id")
                                            $("#button-time").datetimepicker({
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
                                                format:'hh:ii:00',
                                                })
                                            var datalist =[]
                                            $.ajax({
                                                type:"GET",
                                                url:"json/zg/attendances",
                                                contentType:"application/json",
                                                data:{attendances_id:index},
                                                success:function(data){
                                                    datalist[0]=data
                                                    console.log(data)
                                                    var html = $(templates.render('attendance_update',{
                                                          datalist:datalist
                                                        }));
                                                         $(".attendance_ctn").html(html)
                                                         var idIndex = []
                                                          data.member_list.forEach(function(val){
                                                               idIndex.push(val.id)
                                                          })
                                                        //   $(".attendance_ctn .button-time").val("09:00")
                                                          $(".attendance_ctn .button-time").datetimepicker({
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
                                                            format:'hh:ii:00',
                                                            })
                                                         $(".button-job").val(data.jobs_time)
                                                         $(".button-rest").val(data.rest_time)
                                                         $(".kaoqin-era").attr("location",data.longitude+","+data.latitude)
                                                         $(".button-common-people").attr("data_id",idIndex)
                                                         commonf()
                                                          //接入地点
                                                         update(index)
                                                }
                                            })
                                       })
                                      
                                    }
                                 })

                                //-------------切换回考勤统计-----------------
                                 $(".attendance_statistics").on("click",function(){
                                    $(this).addClass("high_light").siblings().removeClass("high_light")
                                    //  $(".attendance_ctn").children().remove();
                                    //  $(".attendance_ctn").append(original)
                                    $(".move_ctn").children().remove();
                                    attendance.attendance()
                                     //搜索全部成员
                                     var p = $(".attendance_bottom_ctn").children();
                                     $(".attendance_bottom_search_person").bind('input propertychange',function(){
                                         var searchText = $(this).val();
                                         var $searchLi = "";
                                         var peopleArr = []
                                         for(var i =0;i<p.length;i++){
                                            peopleArr.push(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML)
                                         }
                                         for(var key in peopleArr){
                                                for(var i =0;i<p.length;i++){
                                                    if(peopleArr[key] == searchText){
                                                        if(p[i].getElementsByClassName("attendance_bottom_name")[0].innerHTML == searchText){
                                                            $(".attendance_bottom_ctn").html(p[i]).clone()
                                                        }
                                                     }
                                                }
                                         }
                                         if(searchText != ""){
                                             $searchLi = $(".attendance_bottom_ctn").find('p:contains('+ searchText +')').parent();
                                             $(".attendance_bottom_ctn").html("");
                                         }
                                         $(".attendance_bottom_ctn").html($searchLi).clone();
                                         if ($searchLi.length <= 0) {
                                             $(".attendance_bottom_ctn").html("<li>没有找到该成员</li>")
                                         }
                                         if (searchText == "") {
                                             $(".attendance_bottom_ctn").children().remove();
                                             $(".attendance_bottom_ctn").append(p)
                                         }
                                     })
                                     //搜索全部成员
                                     //点击切换考勤组
                                     $(".attendance_groups").on("click",".attendance_groups_list",function(){
                                         var attendances_id = $(this).attr("attendances_id");
                                         //考勤组样式切换
                                         $(this).addClass("gray_bg").siblings().removeClass("gray_bg");
                                         checkOut(attendances_id);
                                     })
                                     //查看考勤日历
                                    $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                                        $(".attendance_ctn").children().remove();
                                        var user_id = $(this).attr("user_id")
                                        checkCalendar(user_id);
                                    })
                                    //初始化按事件筛选
                                    $(".calendar_screen_select_y").datetimepicker({
                                        language:"zh-CN",  
                                        todayHighlight: true,  
                                        minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                                        weekStart:1,
                                        format:"yyyy-mm-dd"
                                    })
                                 })
                                 //-------------切换回考勤统计-----------------
                            })
                            $(".attendance_ctn").on('click',".new_attendance",function(){
                                // var lis  =  $(".attendance_ctn").children()
                                $(".attendance_ctn").empty()
                                var html = templates.render("attendance_team");
                                $(".attendance_ctn").html(html)
                                // $(".attendance_ctn .button-common").val("17:00")
                                $(".attendance_ctn .button-common").datetimepicker({
                                    language:"zh-CN",  
                                    weekStart: 1,
                                    todayBtn:  0,
                                    autoclose: 1,
                                    todayHighlight: 1,
                                    startView: 1,
                                    minView: 0,
                                    showHours : true,
                                    // minuteStep:1,z
                                    maxView: 1,
                                    forceParse: 0,
                                    format:'hh:ii:00',
                                    })
                                commonf()
                                commit()
                            })
                        }else{
                        //普通成员请求
                            var html = templates.render("attendance_box");
                            $(".move_ctn").append(html);
                            $(".attendance_mangement").hide();
                            $(".attendance_ctn").children().remove();
                            
                            console.log("hello world")
                            checkCalendarMy();
                            //关闭考勤
                            $(".attendance_close").on("click",function(){
                                $(".attendance_md").hide();
                            })
                        }
                }
            })     
             
           function commonf(){
                $(".attendance_ctn").off(".kaoqin-era").on('click',".kaoqin-era",function(){
                    $('#map-area').show()
                    $("#map-area").on('click','.place-sure',function(){
                        if($('.place-area').text()==""){
                          $("#tipinput").css("border-color",'red')
                          $("#tipinput").attr("placeholder","请输入区域")
                        }else{
                            var text=$('.place-area').text()
                            var location = $('.place-area').attr("data_loaction")
                            // $(".attendance-new-detail .kaoqin-era").empty("")
                            $(".attendance-new-detail .kaoqin-era").val(text)
                            $(".kaoqin-era").attr("location",location)
                            $('#map-area').hide()
                            $('#tipinput').val("")
                        }
                        // $('.place-area').html("") 
                    })
                    $("#map-area").on('click',".attendance-map-close",function(){
                        $('#map-area').hide()
                    })
                })
                $(".attendance_ctn").on('click',".button-common-date",function(){
                    $(".kaoqin-date-choose").show()
                    $(".attendance_close_week").on('click',function(){
                        $(".kaoqin-date-choose").hide()
                    })
                })
                $(".kaoqin-date-area").on('click',function(){
                    $(".kaoqin-date-choose").hide()
                })
                //接入人员
                $(".button-common-people").on("click",function(e){
                    var objecty
                    if($(".button-common-people").text()=="设置参加人员"){
                        objecty ={}
                    }else{
                        objecty = $(".button-common-people").attr("data_obj")
                        objecty= JSON.parse(objecty)
                    }
                    chooseFile.choosePeople(xy,objecty)
                })
                //接入时间
                $(".button-common-date").on('click',function(){
                    $(".kaoqin-date-choose").show()
                   
                    $(".kaoqin-date-area").on('click',function(){
                        var id_array=new Array();  
                        $('.date-checkbox[type="checkbox"]:checked').each(function(){ 
                            id_array.push($(this).next().text())  
                        }); 
                        id_array =  id_array.join(",")
                        $(".button-common-date").html(id_array)
                        // console.log(id_array)
                        $(".kaoqin-date-choose").hide()
                    })
                    $(".attendance_close_week").on('click',function(){
                        $(".kaoqin-date-choose").hide()
                    })
                })
                $(".kaoqin-date-area").on('click',function(){
                    $(".kaoqin-date-choose").hide()
                })
                //点击提交
           }
           // 公共参数
           function commonContent(){
            // settime()
            var name = $(".title-input").val()
            console.log(name)
            if(name==""){
                alert('请填写考勤组的名字','rgba(169,12,0,0.30)')
                return 
            }
            var member_list = $(".button-common-people").attr("data_id")
            console.log(member_list)
            if(member_list == undefined){
                alert('请选择考勤人员','rgba(169,12,0,0.30)')
                return 
            }else{
                member_list=member_list.split(",")
                console.log(member_list)
            }
            var jobs_time = $(".button-job").val()
            if(jobs_time==""){
               jobs_time = "09:00:00"
            }
            var rest_time = $(".button-rest").val()
            if(rest_time==""){
                rest_time = "17:00:00"
            }
            var date =$(".button-common-date").html()
            console.log(date)
            if(date=="设置考勤日期"){
                alert('请填写日期','rgba(169,12,0,0.30)')
                return
            }
            var location = $(".kaoqin-era").val()
            if(location=="设置考勤地点"){
                alert('设置考勤地点','rgba(169,12,0,0.30)')
                return
            }
            var longitude = $(".kaoqin-era").attr("location").split(",")[0]
            var latitude = $(".kaoqin-era").attr("location").split(",")[1]
            var range_content =  $(".button-common-area").val()
            var range = range_content.slice(0,range_content.length-1);
            if(range=="设置考勤范围"){
                alert('设置考勤范围','rgba(169,12,0,0.30)')
                return
            }
            date = date.split(",")
            var datelist =[]
            date.forEach(function(val,i ){
                   var item = val[val.length-1]
                   if(item==="一"){
                    datelist.push(1)
                   }else if(item==="二"){
                    datelist.push(2)
                   }else if(item==="三"){
                    datelist.push(3)
                   }else if(item==="四"){
                    datelist.push(4)
                   }else if(item==="五"){
                    datelist.push(5)
                   }else if(item==="六"){
                    datelist.push(6)
                   }else if(item==="日"){
                    datelist.push(7)
                   } 
            })
            console.log(date,datelist)
            data_list  ={
                 name:name,
                 member_list:member_list,
                 jobs_time:jobs_time,
                 rest_time:rest_time,
                 date: datelist.join(""),
                 longitude:longitude,
                 latitude:latitude,
                 location:location,
                 range:range,
            }
            console.log(data_list)
            return  data_list
           }
           //点击提交的公共函数
           function commit(){
                $(".button-submit-common").on("click",function(){
                        var data_list = commonContent()
                        console.log(data_list)
                        if(data_list){
                        $(".button-submit").attr("disabled", true);
                        $(".button-submit").css("background-color","#ccc")
                        channel.post({
                            url:'/json/zg/attendances/add/',
                            data:JSON.stringify(data_list),
                            contentType:"application/json",
                            success:function(data){
                                console.log(data)
                                if(data.errno==0){
                                    $(".button-submit").css("background-color","#14A4FA")
                                    $(".button-submit").attr("disabled", false);
                                    $(".attendance_mangement").addClass("high_light").siblings().removeClass("high_light")
                                    channel.get({
                                        url:"json/zg/attendances/management",
                                        success:function(data){
                                           var data_list = data.attendances_list
                                           var html = $(templates.render('attendance_management',{
                                            data_list:data_list
                                            }));
                                           $(".attendance_ctn").html(html)
                                           $(".attendance_ctn").on('click',".back_attendance",function(){
                                            $(".attendance_ctn").empty()
                                               $(".attendance_ctn").html(html)
                                          })
                                        }
                                    })
                                }
                            }
                        })
                    }
                        
                })
           }
           function update(id){
            $(".button-submit-update").on("click",function(){
                var data_list = commonContent()
                if(data_list){
                    $(".button-submit-update").attr("disabled", true);
                    $(".button-submit-update").css("background-color","#ccc")
                    data_list.attendances_id = id
                    channel.put({
                        url:'json/zg/attendances/update/',
                        data:JSON.stringify(data_list),
                        contentType:"application/json",
                        success:function(data){
                            console.log(data)
                            if(data.errno==0){
                                $(".button-submit-update").css("background-color","#14A4FA")
                                $(".button-submit-update").attr("disabled", false);
                                $(".attendance_md").hide();
                            }
                        }
                    })
                }
            })
           }
           //新增加项目
         
   
       
     
       function alert(text,color){
        $('.toast-alert-button').fadeIn({
            duration: 1
        }).delay (1000).fadeOut ({duration: 1000});
        $('.toast-alert-button').html(text)
        $('.toast-alert-button').css('background-color',color)
        }
     

    // var countdown = 10;
    // function settime() {
    //     if(countdown == 0) {
    //         $(".button-submit").attr("disabled", false);
    //         // $("#btn").attr("value", "免费获取验证码");
    //         countdown = 10;
    //     } else {
    //         $(".button-submit").attr("disabled", true);
    //         // $("#btn").attr("value", "重新发送(" + countdown + ")");
    //         countdown--;
    //         setTimeout(settime, 1000)
    //     }
    // }
          
        }
    });  
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
