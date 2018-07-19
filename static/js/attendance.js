var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            // var da = {
            //     name:"陈二狗",
            //     member_list:[34,35,36,37,38,39,40],
            //     jobs_time:"09:30:00",
            //     rest_time:"20:00:00",
            //     date:"1234567",
            //     longitude:"123.12",
            //     latitude:"123.11",
            //     location:"门头沟",
            //     range:"100000"
            // }
            // $.ajax({
            //     type:"POST",
            //     url:"json/zg/attendances/add/",
            //     contentType:"application/json",
            //     data:JSON.stringify(da),
            //     success:function(res){

            //     }})
            $.ajax({
                    type:"GET",
                    url:"json/zg/attendances/day",
                    contentType:"application/json",
                    success:function(res){
                        if(res.super_user==true){
                            //确认管理员身份继续请求日统计数据
                            var html = templates.render("attendance_box");
                            $(".app").after(html);
                            var attendances_list = res.attendances_list;
                            var attendances_member_list = res.attendances_member_list;
                            var attendance_all = templates.render("attendance_all",{attendances_list:attendances_list,attendances_member_list:attendances_member_list})
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
                                $.ajax({
                                    type:"GET",
                                    url:"json/zg/attendances/day",
                                    contentType:"application/json",
                                    success:function(res){
                                        if(res.super_user==true){
                                            $(".attendance_ctn").children().remove();
                                            var attendances_list = res.attendances_list;
                                            var attendances_member_list = res.attendances_member_list;
                                            var attendance_all = templates.render("attendance_all",{attendances_list:attendances_list,attendances_member_list:attendances_member_list})
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
                                        }else{
                                            
                                        }
                                    }
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
           //点击考勤组的样式
           $(".attendance_mangement").on('click',function(){
               $(this).addClass("high_light").siblings().removeClass("high_light")
               var html = templates.render("attendance_management");
               $(".attendance_ctn").html(html)
           })
           //新增加项目
           function button(){
            //点击清空
            $(".button-right-clear").on('click',function(e){
               // 清空右边列表
                 $(".box-right-list").empty()
               // 选中的数数值为0
               $('.already-choose').text("选中(0)")
               //左边的选中状态都是false
               $(".choose-check").prop("checked", false);
               $(".checkbox-input").prop("checked",false);
               $(".checkbox-inputs").prop("checked",false);
               $('.choose-list-box:checkbox').prop("checked", false)
           })
           //点击取消
           $(".button-cancel").on("click",function(e){
               $(".modal-log").hide()
               //清除里面所有的元素，模态框消失。
               $(".modal-log-content").empty()
            })
       }
   
   function simpleArr(datakeylist){
        var arr = [];
        for(var i in datakeylist){ 
           arr=arr.concat(datakeylist[i]);
        }
        var hash = {};
        var ress=[];
        var result = [];
        arr.forEach(function(item){
             ress.push({name:item.nid,id:item.id})
        })
        // var hash = {};item
        for(var i = 0, len = arr.length; i < len; i++){
            // hashlist[arr[i].id]=[]
            if (!hash[arr[i].id]) //如果hash表中没有当前项
                {
                    hash[arr[i].id] = true; //存入hash表
                    result.push(arr[i]);    
                  //把当前数组的当前项push到临时数组里面
                }
        }
       
        return {result:result,ress:ress}
   }
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
       function deletes(data){
           var childrenlength=$(".box-right-list").children().length
           // console.log(childrenlength)
           $('.already-choose').text("选中("+childrenlength+")")
           // console.log(childrenlength,"判断")
             //点击删除,选取的人删除,判断左边频道的状态
           $(".button-right-delete").on('click',function(e){
               // console.log($(this))
                   var attr= $(this).parent().attr('data_id')
                   var keyAttr= $(this).parent().attr('key-data')
                   $(".checkbox-input").prop("checked",false);
                   $("[data-key='"+keyAttr+"']:checkbox").prop("checked", false);
                   $(this).parent().remove()
                   var childrenlengths=$(".box-right-list").children().length
                   var ress =simpleArr(data).ress
                       ress.forEach(function(val,i){
                           if(val.id==keyAttr){
                               $("[inputid='"+val.name+"']:checkbox").prop("checked", false);
                           }
                       })
                   // })
                   var $subs = $('.choose-list-box:checkbox')
                   $(".checkbox-inputs").prop("checked",$subs.length==$subs.filter(":checked").length ? true : false);
                   if(childrenlengths>0){
                       $('.already-choose').text("选中("+childrenlengths+")")
                   }else{
                       $('.already-choose').text("选中(0)")
                       $(".choose-check").prop("checked", false);
                       $(".checkbox-input").prop("checked",false);
                       $(".checkbox-inputs").prop("checked",false);
                       $('.choose-list-box:checkbox').prop("checked", false)
                   }
                   var length= $("[data_id='"+attr+"']").length
                   //频道里面的人长度为0，左边的选中状态取消
                   if(length===0){
                       $("[inputid='"+attr+"']:checkbox").prop("checked", false);
                   }
           })
       }
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
                    $("#map-area").on('click','.place-sure',function(){
                        $('#tipinput').val("")
                        $('#map-area').hide()
                        var text=$('.place-area').text()
                        var location = $('.place-area').attr("data_loaction")
                        $(".attendance-new-detail .kaoqin-era").empty("")
                        $(".attendance-new-detail .kaoqin-era").append(text)
                        $(".kaoqin-era").attr("location",location)
                        $('.place-area').html("") 
                    })
                    $("#map-area").on('click',".attendance-map-close",function(){
                        $('#map-area').hide()
                    })
                })
                //接入设置参加人员
                $('.button-common-people').on("click",function(e){ 
                    //显示模态框
                    $(".modal-log").show()
                   //获取数据
                   channel.get({
                       url:"json/zg/stream/recipient/data",
                       success:function(data){
                         var rendered = $(templates.render('choose',{
                             data:data.streams_dict
                         }));
                          // 渲染频道
                          console.log(data.streams_dict)
                         $(".modal-log-content").append(rendered)
                         // 搜索
                         $(".choose-nav-left .search-icon").keyup(function(){
                             if($(".search-icon").val().length!==0){
                                 $(".modal-ul-choose").show()
                                 var listarr = simpleArr(data.streams_dict).result
                                 var indexlist = []
                                 var value = $(this).val()
                                 listarr.forEach(function(val,i){
                                        var index = val.fullname.indexOf(value)
                                        if(index!==-1){
                                           indexlist.push(listarr[i])
                                         //   console.log(indexlist,i)
                                        }
                                     //    console.log(indexlist)
                                 })
                             }
                             
                         })
                         $(".search-icon").blur(function(){
                             $(".modal-ul-choose").hide()
                             $(".search-icon").val("")
                         })
                          // 频道点击全选 
                         $(".choose-nav-left").on('click','.checkbox-input',function(e){
                             if($(this).is(":checked")){
                                 $('.choose-check:checkbox').prop("checked", true)
                                 var datakeylist= data.streams_dict
                                 for(var i in datakeylist){
                                     var indexkey = i
                                     datakeylist[i].forEach(function(index,v){
                                          index.nid=indexkey 
                                     })
                                     // chooselist=datakeylist[i].push[i]
                                 }
                                 var result = simpleArr(datakeylist).result
                                 
                                 result.forEach(function(val,i){
                                     val.did=1
                                })
                                 var li = $(templates.render('choose_person',{
                                     datalist:result
                                 }));
                                 $(".box-right-list").html(li)
                                
                             }else{
                                 $('.choose-check:checkbox').prop("checked", false)
                                 $(".box-right-list").empty()
                             }
                             deletes(data.streams_dict)
                         })
                         
                          //点击频道频道
                         var lid = $(".choose-nav-left").children()
                         $(".choose-nav-left").on('click','.choose-check',function(e){
                             var inputid= $(this).attr("inputid")
                             if($(this).is(":checked")){
                                 data_list= data.streams_dict[inputid]
                                 data_list.forEach(function(val,i){
                                      val.did=inputid
                                 })
                                 var li = $(templates.render('choose_person',{
                                     datalist:data_list
                                 }));
                                 $(".box-right-list").append(li)
                                 
                                  var $subs = $('.choose-check:checkbox')
                                 $(".checkbox-input").prop("checked",$subs.length==$subs.filter(":checked").length ? true : false);
                             }else{
                                 //没有咋勾选状态，就移除元素
                                 $("[data_id='"+inputid+"']").remove()
                                 $(".checkbox-input").prop("checked",false);
                                 data_list= data.streams_dict[inputid]
                                 data_list.forEach(function(val,i){
                                     $("[key-data='"+val.id+"']").remove()
                                })
                             }
                             deletes(data.streams_dict)
                         }) 
                         confirm()
                         //点击取消，模态框取消，里面所有的元素都没有了
                         button()
                         //点击选择联系人
                         $('.choose-nav-left').on('click',".back-choose",function(e){
                             // var li = $(templates.render('choose_channel',{
                             //     data:data.streams_dict
                             // }));
                             var checkinput = $(".choose-nav-left .checkbox-inputs:checkbox").is(":checked")
                             // console.log(checkinput,$(".choose-nav-left .checkbox-inputs:checkbox"))
                             $(".choose-nav-left").children().remove()
                             $(".choose-nav-left").html(lid)
                             var text = $(this).next().children().text()
                             if(checkinput){
                                 $("[inputid='"+text+"']").prop("checked", true);
                             }else{
                                 $("[inputid='"+text+"']").prop("checked", false);
                             }
                             var childrenlength=$(".box-right-list").children().length
                             // 给选中赋值
                             if(childrenlength===0){
                                 $(".choose-check").prop("checked", false);
                                 $(".checkbox-input").prop("checked",false);
                                 $(".checkbox-inputs").prop("checked",false);
                                 $('.choose-list-box:checkbox').prop("checked", false)
                             }
                         })
                         
                         //点击下级
                         $('.choose-nav-left').on('click',".next-right",function(e){
                             var id = $(this).attr('button-key')
                             var li = $(templates.render('choose_people',{
                                 datalists:data.streams_dict[id],
                                 channels:id
                             }));
                             
                             $(".choose-nav-left").html(li)
                             if($(this).siblings().children().eq(0).is(":checked")){
                                 $(".checkbox-inputs").prop("checked",true)
                             }
                             //右边对像的children
                             var rightlength = $(".box-right-list").children()
                              rightlength.each(function(){
                                 var id = Number($(this).attr("key-data"));
                                 $("[data-key='"+id+"']:checkbox").prop("checked", true)
                                 // data.streams_dict[id].forEach(function)
                             })
                             $(".checkbox-inputs").on("click",function(e){
                                 if($(this).is(":checked")){
                                     $('.choose-list-box:checkbox').prop("checked", true)
                                     var data_list_number=data.streams_dict[id]
                                     data_list_number.forEach(function(val,i){
                                         $('.box_list_right[key-data='+val.id+']').remove()
                                         val.did=id
                                    })
                                     var li = $(templates.render('choose_person',{
                                         datalist:data_list_number
                                     }));
                                     $(".box-right-list").append(li)
                                     
                                 }else{
                                     $('.choose-list-box:checkbox').prop("checked", false)
                                     var dataId =$.trim($(this).parent().prev().children().eq(1).text())
                                     $("[data_id='"+dataId+"']").remove()  
                                 }
                                 deletes(data.streams_dict )
                               })
                             $(".box-choose-lefts").on("click",".choose-list-box",function(e){
                                 var inputid= $(this).attr("data-key")
                                 // 获得人的名字
                                 var silcontent = $.trim($(this).parent().text())
                                 // 获得头像
                                 var avatarurl =$(this).parent().parent().attr("avatar")
                                 if($(this).is(":checked")){
                                    var li = "<li class='input-box-list box_list_right' key-data="+inputid+" avatarurl="+avatarurl+">\
                                             <div class='box-list-left'>\
                                                 <span class='name-list'>"+silcontent+"</span>\
                                             </div>\
                                             <button class='button-right-delete' data-id="+inputid+">删除</button>\
                                         </li>"
                                 // $(".modal-log-content").empty()
                                 $('.box-right-list').append(li)
                                 var $subs = $('.choose-list-box:checkbox')
                                 $(".checkbox-inputs").prop("checked",$subs.length==$subs.filter(":checked").length ? true : false);
                                 $('.button-right').on('click',function(e){
                                     var keydata = $(this).attr('data-id')
                                     $(this).parent().remove()
                                     $("[data-key='"+keydata+"']:checkbox").prop("checked", false);
                                 })
                                
                                 }else{
                                     $("[key-data='"+inputid+"']").remove()
                                     $(".checkbox-inputs").prop("checked",false)
                                 }
                                 deletes(data.streams_dict)
                             })
                                // 点击下级全选
                          
                             // 点击选取联系人,返回频道选人
                             button()
                             // confirm()
                         })
                       }
                   })
                })
                //考情日期
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
                
           })
           $(".attendance_ctn").on('click',".back_attendance",function(){
                var html = templates.render("attendance_management");
                $(".attendance_ctn").html(html)
           })
        })
      
          
    });  
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
