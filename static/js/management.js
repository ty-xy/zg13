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
       function simpleArr(datakeylist){
            var arr = [];
            for(var i in datakeylist){
            arr=arr.concat(datakeylist[i]);
            }
            var hash = {};
            var result = [];
            for(var i = 0, len = arr.length; i < len; i++){
                if (!hash[arr[i].id]) //如果hash表中没有当前项
                    {
                        hash[arr[i].id] = true; //存入hash表
                        result.push(arr[i]); //把当前数组的当前项push到临时数组里面
                    }
            }
            return result 
       }
        //一键生成日志

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
            //点击提交功能
            $(".generate_log_submit").on("click",function(e){
                var accomplish= $(".generate_log_finished_text").val()
                
                var underway  =$(".generate_log_unfinished_text").val()
                var overdue = $(".generate_log_pdfinished_text").val()
                var list = []
                $(".generate_log_plan_delete").each(function(){
                    var ids= Number($(this).attr('data_id'))
                    list.push(ids)
                })
                // var arr = list.toString()
                var send_list =[]
                $(".generate_log_member_box").children().not($(".add_log_people")).each(function(){
                    var ids= Number($(this).attr('data_id'))
                    console.log(ids)
                    send_list.push(ids)
                })
                var statement_accessory_list = []
                $(".generate_log_pack").each(function(){
                    var isn = $(this).attr('data-url')
                    var name = $(".generate_log_pack_right").children().eq(0).text()
                    var size=$(".generate_log_pack_right").children().eq(1).text()
                    var file ={
                        url:isn,
                        size:size,
                        name:name
                    }
                    statement_accessory_list.push(file)
                })
                console.log(statement_accessory_list,send_list)
                console.log(accomplish,underway,overdue)
                 var paramas ={
                    accomplish:$.trim(accomplish),
                    underway:$.trim(underway),
                    overdue:$.trim(overdue),
                    backlog_list:list,
                    send_list:send_list,
                    statement_accessory_list:statement_accessory_list,
                    date_type:"day"
                 }
                 console.log(paramas)
                 channel.post({
                        url:"json/zg/table/",
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
            function button(){
                 //点击清空
                 $(".button-right-clear").on('click',function(e){
                    // 清空右边列表
                      $(".box-right-list").empty()
                    // 选中的数数值为0
                    $('.already-choose').text("选中(0)")
                    //左边的选中状态都是false
                    $(".choose-check").prop("checked", false);
                    $(".checkbox-input").prop("checked",false)
                })
                //点击取消
                $(".button-cancel").on("click",function(e){
                    $(".modal-log").hide()
                    //清除里面所有的元素，模态框消失。
                    $(".modal-log-content").empty()
                 })
            }
            function confirm(){
                //点击确定
                $('.button-confirm').on('click',function(e){
                    var arrlist =[]
                    $(".box-right-list").children().each(function () { 
                        var id = Number($(this).attr("key-data"));
                        var avatar = $(this).attr("avatarurl")
                        var name = $(this).children().find('.name-list').text()
                        var peppleList = {
                            id:id,
                            avatar:avatar,
                            name:name,
                            namel:name.slice(0,4)+"...."
                        }
                        arrlist.push(peppleList)
                    })
                    var li = $(templates.render('send_people',{
                       peoplelist:arrlist
                   }));
                   $('.generate_log_member').mouseenter(function(){
                      $(this).children().eq(2).show()
                      $(this).on('click',".dust-delete",function(e){
                          $(this).parent().parent().remove()
                      })
                   })
                   $('.generate_log_member').mouseleave(function(){
                     $('.avatar-over').hide()
                  })
                   $(".add_log_people").before(li)
                   $('.box-right-list').remove()
                   $(".modal-log").hide()
                   //清除里面所有的元素，模态框消失。
                   $(".modal-log-content").empty()
                })
            }
            function deletes(){
                var childrenlength=$(".box-right-list").children().length
                // console.log(childrenlength)
                $('.already-choose').text("选中("+childrenlength+")")
                  //点击删除,选取的人删除,判断左边频道的状态
                $(".button-right-delete").on('click',function(e){
                    // console.log($(this))
                    var attr= $(this).parent().attr('data_id')
                    $(this).parent().remove()
                    // 点击删除的时候，选中的人数减一
                    var clength = $('.already-choose').text().slice(3,4)-1
                    console.log(1)
                    if(clength>0){
                        $('.already-choose').text("选中("+clength+")")
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
            // 上传文件
            upload.feature_check($("#up_files #attach_files"));
            $("#up_files").on("click", "#attach_files", function (e) {
               // e.preventDefault();
               $("#up_files #file_inputs").trigger("click");
           });
           function make_upload_absolute(uri) {
            if (uri.indexOf(compose.uploads_path) === 0) {
                // Rewrite the URI to a usable link
                console.log(compose.uploads_path,compose.uploads_domain)
                return compose.uploads_domain + uri;
            }
            return uri;
        }
       var uploadFinished = function (i, file, response) {
            if (response.uri === undefined) {
            return;
            }
            var split_uri = response.uri.split("/");
            var filename = split_uri[split_uri.length - 1];
            var uri = make_upload_absolute(response.uri);
            var size = (file.size/1024/1024).toFixed(2)
            console.log(uri,filename,file,response)
            if(i != -1){
                var li =  
                "<div class='generate_log_pack' data-url="+uri+">\
                  <div class='generate_log_pack_left'>\
                    <img src='../../static/img/pnglogo.png' alt=''>\
                    <i class='iconfont icon-shanchu1 generate_log_pack_delete'></i>\
                </div>\
                <div class='generate_log_pack_right'>\
                    <p>"+filename+"</p>\
                    <p>"+size+"MB</p>\
                </div>\
              </div>"
                $(".generate_log_upfile").after(li)
            }
        };
        $(".generate_log_upfile_box").on("click",".generate_log_pack_delete",function(e){
             $(this).parent().parent().remove()
        })
        $("#up_files").filedrop({
            url: "/json/user_uploads",
            fallback_id: 'file_inputs',  // Target for standard file dialog
            paramname: "file",
            maxfilesize: page_params.maxfilesize,
            data: {
                // the token isn't automatically included in filedrop's post
                csrfmiddlewaretoken: csrf_token,
            },
            // raw_droppable: ['text/uri-list', 'text/plain'],
            // drop: drop,
            // progressUpdated: progressUpdated,
            // error: uploadError,
            uploadFinished: uploadFinished,
         //    afterAll:function(contents){
         //        console.log(contents,321312)
         //    }
        })
           // 1.点击添加人员
           $('.add_log_people').on("click",".generate_log_member_addlogo",function(e){ 
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
                    $(".modal-log-content").append(rendered)
                    // 搜索
                    $(".choose-nav-left .search-icon").keyup(function(){
                        if($(".search-icon").val().length!==0){
                            $(".modal-ul-choose").show()
                            var listarr = simpleArr(data.streams_dict)
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
                             console.log(indexlist)
                        }
                        // var li = $(templates.render('choose_person',{
                        //     datalist:indexlist
                        // }));
                        // $(".modal-ul-choose").append(li)
                        
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
                            var result = simpleArr(datakeylist)
                            var li = $(templates.render('choose_person',{
                                datalist:result
                            }));
                            $(".box-right-list").append(li)
                            deletes()
                        }else{
                            $('.choose-check:checkbox').prop("checked", false)
                            $(".box-right-list").empty()
                        }
                    })
                    
                     //点击频道频道
                    var lid = $(".choose-nav-left").children()
                    $(".choose-nav-left").on('click','.choose-check',function(e){
                        var inputid= $(this).attr("inputid")
                        console.log(6)
                        if($(this).is(":checked")){
                            data_list= data.streams_dict[inputid]
                            console.log(data_list)
                            data_list.forEach(function(val,i){
                                 val.did=inputid
                            })
                            var li = $(templates.render('choose_person',{
                                datalist:data_list
                            }));
                            $(".box-right-list").append(li)
                            // $('.choose-nav-left').applend(li)
                            //查看$(".box-right-list").长度
                            deletes()
                            //点击清空
                        }else{
                            //没有咋勾选状态，就移除元素
                            $("[data_id='"+inputid+"']").remove()
                        }
                    }) 
                    confirm()
                    //点击取消，模态框取消，里面所有的元素都没有了
                    button()
                    //点击选择联系人
                    $('.choose-nav-left').on('click',".back-choose",function(e){
                        // var li = $(templates.render('choose_channel',{
                        //     data:data.streams_dict
                        // }));
                        $(".choose-nav-left").children().remove()
                        $(".choose-nav-left").html(lid)
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
                        // $(".modal-log-content").empty()
                           // 渲染频道下级选发送人
                        // $(".choose-nav-left").children().remove
                        var id = $(this).attr('button-key')
                        var li = $(templates.render('choose_people',{
                            datalists:data.streams_dict[id],
                            channels:id
                        }));
                        $(".choose-nav-left").html(li)
                        $(".checkbox-inputs").on("click",function(e){
                            if($(this).is(":checked")){
                                $('.choose-list-box:checkbox').prop("checked", true)
                                var li = $(templates.render('choose_person',{
                                    datalist:data.streams_dict[id]
                                }));
                                $(".box-right-list").append(li)
                                deletes()
                            }else{
                                $('.choose-list-box:checkbox').prop("checked", false)
                                $(".box-right-list").empty()
                            }
                          })
                        $(".box-choose-lefts").on("click",".choose-list-box",function(e){
                            console.log(423423)
                            var inputid= $(this).attr("data-key")
                            // 获得人的名字
                            var silcontent = $.trim($(this).parent().text())
                            // 获得头像
                            var avatarurl =$(this).parent().parent().attr("avatar")
                            if($(this).is(":checked")){
                                console.log(123)
                               var li = "<li class='input-box-list box_list_right' key-data="+inputid+" avatarurl="+avatarurl+">\
                                        <div class='box-list-left'>\
                                            <span class='name-list'>"+silcontent+"</span>\
                                        </div>\
                                        <button class='button-right' data-id="+inputid+">删除</button>\
                                    </li>"
                            // $(".modal-log-content").empty()
                            $('.box-right-list').append(li)
                              deletes()
                            $('.button-right').on('click',function(e){
                                var keydata = $(this).attr('data-id')
                                $(this).parent().remove()
                                $("[data-key='"+keydata+"']:checkbox").prop("checked", false);
                            })
                           
                            }else{
                                $("[key-data='"+inputid+"']").remove()
                            }
                        })
                           // 点击下级全选
                     
                        // 点击选取联系人,返回频道选人
                        button()
                        confirm()
                    })
                  }
              })
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
            $('.generate_log_left').on("click",".week-report",function(e){
                $(this).addClass("high_light").siblings().removeClass("high_light");
            })
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
                url:"json/zg/backlog/gets",
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
                            url:"json/zg/backlog/gets",
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
                                            url:"json/zg/backlog/gets",
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
                $.ajax({
                    type:"GET",
                    url:"json/zg/my/receive/web",
                    contentType:"application/json",
                    success:function(res){
                        $(".log_assistant_md").remove();
                        var receive_table_list = res.receive_table_list;
                        var html = templates.render("log_assistant_box",{receive_table_list:receive_table_list})
                        $(".app").after(html)
                        console.log(res)
                        
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
                        $(".log_assistant_box").on("click",".log_assistant_received",function(e){
                            $(this).addClass("high_light").siblings().removeClass("high_light");
                            $(".log_assistant_prompt_box").show();
                            $(".log_assistant_ctn").css("margin-top","0px");
                            $(".log_assistant_unread").hide();
                            $(".log_assistant_title").html("我收到的")
                            $.ajax({
                                        type:"GET",
                                        url:"json/ƒ/receive/web",
                                        contentType:"application/json",
                                        success:function(res){
                                            $(".log_assistant_ctn").remove();
                                            var receive_table_list = res.receive_table_list;
                                            var html = templates.render("log_assistant_receive",{receive_table_list:receive_table_list})
                                            $(".log_assistant_ctn_box").append(html)
                                        }
                                    })

                        })
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
                                    // $(".log_assistant_md").remove();
                                    $(".log_assistant_unread").show();
                                    $(".log_assistant_ctn").remove();
                                    var send_table_list = res.send_table_list;
                                    var html = templates.render("log_assistant_send",{send_table_list:send_table_list})
                                    $(".log_assistant_ctn_box").append(html)
                                    }
                                })
                        })


                            }
                        })
                        
                // $(".log_assistant_md").remove();
                //日志助手点击md关闭
                
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
