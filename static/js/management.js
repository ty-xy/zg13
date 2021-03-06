var management = (function () {
    var exports = {};
    exports.toTimestamp = function (str){
        str = str.replace(/-/g,'/');
        var date = new Date(str); 
        var time = date.getTime();
        var n = time/1000;
        return n;
    }
    $("body").ready(function () {
        //点击一键生成日志 出现日志弹窗
        // $(".create_generate_log").hide();
        // autoTextarea.js query封装函数
        (function($){
            $.fn.autoTextarea = function(options) {
              var defaults={
                maxHeight:null,
                minHeight:$(this).height()
              };
              var opts = $.extend({},defaults,options);
              return $(this).each(function() {
                $(this).bind("paste cut keydown keyup focus blur",function(){
                  var height,style=this.style;
                  this.style.height = opts.minHeight + 'px';
                  if (this.scrollHeight > opts.minHeight) {
                    if (opts.maxHeight && this.scrollHeight > opts.maxHeight) {
                      height = opts.maxHeight
                      style.overflowY = 'scroll';
                    } else {
                      height = this.scrollHeight
                      style.overflowY = 'hidden';
                    }
                    style.height = height+ 'px';
                  }
                });
              });
            };
          })(jQuery);
        function cancel (){
            $(".new_plan_title").val("");
            $(".create_taskdates").val('');
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
        function alert(text,color){
            // console.log(111)
            $('.toast-alert').fadeIn({
                duration: 1
            }).delay (1000).fadeOut ({duration: 1000});
            $('.toast-alert').html(text)
            $('.toast-alert').css('background-color',color)
        }
        function textheight(option){
            $(option).height($(option)[0].scrollHeight-25);
            $(option).autoTextarea({
                minHeight: 72,
                maxHeight:200
            })
        }
        function del(){
            $('.generate_log_plan_box').on('click',".generate_log_plan_delete",function(e){
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
            var inttime = $(".create_taskdates").val();
            var over_time = timestamp(inttime);
            // console.log(over_time,"over_time",inttime,$(".create_taskdate"))
            var obj = {
                "task":inttitle,
                "over_time":over_time+86399,
            }
            var j = JSON.stringify(obj)
            return {
                j:j,
                inttitle:inttitle,
                inttime:inttime
            }
        }
      
        //一键生成日志

        function logClick (data){
            $('.generate_log_right').empty()
            var rendered = $(templates.render('log',{
                underway_list:data.underway_list,
                accomplish_list:data.accomplish_list,
                overdue_list:data.overdue_list
            }));
            $('.generate_log_right').html(rendered);
            $(".generate_log_submit").css("background-color","#14A4FA")
            //高度随着变化而变化，
              // 1.已经完成
            $(".generate_log_finished_text").height($(".generate_log_finished_text")[0].scrollHeight-25);
            $('.generate_log_finished_text').autoTextarea({
                minHeight: 62,
                maxHeight:200
            })
               //2.未完成
            textheight(".generate_log_unfinished_text")
               // 3.进行中
            textheight(".generate_log_pdfinished_text")
            //  $("#create_log_de").on("click",function(e){
            $(".create_generate_log").on("click",function(e){
            // console.log("修改成功")
                 if(e.target.className==="create_generate_log"){
                     $(".create_generate_log").hide();
            
                    //  $('.create_generate_log').empty() 
                 }else{
                    return 
                 }
             })
            $(".create_generate_log").on("click",function(e){
                // $("#management_ctn .create_generate_log").hide();
                $(".create_generate_log").hide();
              
                // $('.create_generate_log').empty() 
             });
            $('#newplan_datetimepicker').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            }); 
            $(".new_plan").on("click",".new_plan_save",function(e){
                var j = plancommon()
                if(j.inttitle==""){
                    $(".new_plan_title").css("border","1px solid #EF5350");
                    setTimeout(function(){$(".new_plan_title").css("border","1px solid #ccc")},3000)
                    return;
                }
                if(j.inttime==""){
                    $(".new_task_date").css("border","1px solid #EF5350");
                    $(".new_task_date").css("border-right","1px solid #ccc");
                    $(".add-on").css("border","1px solid #EF5350")
                    setTimeout(function(){
                        $(".new_task_date").css("border","1px solid #ccc");
                        $(".add-on").css("border","1px solid #ccc")
                    },
                    3000)
                    return;
                }
                if(j.inttitle!==""&&j.inttime!==""){
                    channel.post({
                        // idempotent: true,
                        url:"json/zg/backlog/",
                        data:j.j,
                        success: function (data) {
                            if(data.errno===0){
                                var li = innhtml(j.inttitle,j.inttime,data)
                                $('.generate_log_plan_box').append(li)
                                del()
                                editor()
                                $('.new_plan').hide()
                                $('.new_add_task_plan').show()
                            }else{  
                                alert(data.message,'rgba(169,12,0,0.30)')
                            }
                        },
                    });
                }
                cancel()
            })
            function editor(){
                $('.generate_log_plan_box').on('click',".generate_log_plan_editor",function(e){
                    e.preventDefault()
                    var that =$(this)
                    var li  = that.parent().parent()
                    var textval = that.parent().prev().prev().text()
                    var textdate = that.parent().prev().children().eq(1).text()
                    $(".new_plan_title").val(textval);
                    $(".create_taskdates").val(textdate);
                    var fix_id = that.next().find(".data_id").prevObject.attr("data_id")
                    $(li).remove()
                    var plan = $(".new_plan").find(".new_plan_save")
                    plan.attr("class","fix_plan_save")
                    plan.attr("revise_id",fix_id)
                    var cancel = $(".new_plan").find(".new_plan_cancel")
                    cancel.attr("class","fix_plan_cancel")
                    cancel.attr("revise_id",fix_id)
                    $('.new_plan').show()
                    $('.new_add_task_plan').hide()
                })
            }
            $(".new_add_task_plan").on('click',function(e){
                 $(this).hide()
                 $(".new_plan").show()
            })
            $(".new_plan ").on("click",'.fix_plan_save',function(e){
                var j = plancommon()
                var over_time = timestamp(j.inttime);
                var obj = {
                    "task":j.inttitle,
                    "over_time":over_time+86399,
                    "backlog_id":$(this).attr("revise_id")
                }
                var data_list ={
                    "backlog_id":obj.backlog_id
                }
                var data = JSON.stringify(obj)
                channel.put({
                    url:"json/zg/backlog/",
                    data:data,
                    success:function(data){
                        if(data.errno===0){
                            var li = innhtml(j.inttitle,j.inttime,data_list)
                            $('.generate_log_plan_box').append(li)
                            var plan = $(".new_plan").find(".fix_plan_save")
                                plan.attr("class","new_plan_save")
                                editor()
                                del()
                                $('.new_plan').hide()
                                $('.new_add_task_plan').show()
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
                cancel()
            })
            //点击提交功能
            $(".generate_log_submit").on("click",function(e){
                var accomplish= $(".generate_log_finished_text").val().trim();
                var underway  =$(".generate_log_unfinished_text").val().trim();
                var overdue = $(".generate_log_pdfinished_text").val().trim();
                var list = []
                updata();
                $(this).attr("disabled",true)
                $(this).css("background-color","#ccc")
                $(".generate_log_plan_delete").each(function(){
                    var ids= Number($(this).attr('data_id'))
                    list.push(ids)
                })
                var that = $(this)
                // var arr = list.toString()
                var send_list =[]
                $(".generate_log_member_box").children().not($(".add_log_people")).each(function(){
                    var ids= Number($(this).attr('data_id'))
                    send_list.push(ids)
                })
                var statement_accessory_list = []
                $(".generate_log_pack").each(function(){
                    var isn = $(this).attr('data-url')
                    var name = $(this).children().eq(1).children().eq(0).text()
                    var size=$(this).children().eq(1).children().eq(1).text()
                    var file ={
                        url:isn,
                        size:size,
                        name:name
                    }
                    statement_accessory_list.push(file)
                })
                 var paramas ={
                    accomplish:accomplish,
                    underway:overdue,
                    overdue:$.trim(underway),
                    backlog_list:list,
                    send_list:send_list,
                    statement_accessory_list:statement_accessory_list,
                    date_type:data.date_type
                 }
                if(accomplish.length>0&&send_list.length>0){
                    channel.post({
                        url:"json/zg/table/", 
                        data:JSON.stringify(paramas),
                        // idempotent: true,
                        contentType:"application/json",
                        success:function(data){
                            if(data.errno===0){
                                that.css("background-color","#14A4FA")
                               alert('日志提交成功','rgba(0,0,0,0.50)')
                               that.attr("disabled",false)
                              $(".create_generate_log").delay(1000).hide(0)
                            } else if(data.errno===1){
                                alert('请完善必填内容','rgba(169,12,0,0.30)')
                                that.attr("disabled",false)
                                that.css("background-color","#14A4FA")
                            } else{
                                alert('网络不稳定,请重新提交','rgba(169,12,0,0.30)')
                                that.attr("disabled",false)
                                that.css("background-color","#14A4FA")
                            }
                        }
                    })
                }else{
                    if(accomplish.length===0){
                        alert('请添加已完成任务','rgba(169,12,0,0.30)')
                        $(this).attr("disabled",false)
                        $(this).css("background-color","#14A4FA")
                    }else if(send_list.length===0){
                        alert('请选择人员','rgba(169,12,0,0.30)')
                        $(this).attr("disabled",false)
                        $(this).css("background-color","#14A4FA")
                    }
                }
            })
            $('.new_plan').on('click',".new_plan_cancel",function(e){
                cancel()
                $('.new_plan').hide()
                $('.new_add_task_plan').show()
            })
            
            // 上传文件
         
            // var should_hide_upload_status = false;
            upload.feature_check($("#up_files #attach_file"));
            // console.log($("#up_files"))
            $("#up_files").on("click", "#attach_file", function (e) {
                e.preventDefault();
            //    e.preventDefault();
            //    e.stopPropagation()
            //    console.log(22222)
               $("#up_files #file_inputs").trigger("click");
           });
           var drop =function(file){
            $('.process-bar-parent').show()
            $('.uploading-img').show()
            // alert(i18n.t("Uploading…"),'rgba(0,107,169,0.30)')
           }
           var progressUpdated = function (i, file, progress) {
            // $('.process-bar-parent').show()
            $("#" + "process-bar").width(progress + "%");
            if (progress === 100) {
                // maybe_hide_upload_status();
                setTimeout(function () {
                    $('.process-bar-parent').hide()
                }, 1000);
            }
           };
           function make_upload_absolute  (uri) {
            if (uri.indexOf(compose.uploads_path) === 0) {
                // Rewrite the URI to a usable link
                return compose.uploads_domain + uri;
            }
            return uri;
         }
        var uploadError = function (error_code, server_response, file) {
            var msg;
            $('.process-bar-parent').hide()
            $('.uploading-img').hide()
            if(error_code=="BrowserNotSupported"&&server_response==undefined){
                return
            }
            switch (error_code) {
            case 'BrowserNotSupported':
                msg = i18n.t("File upload is not yet available for your browser.");
                break;
            case 'TooManyFiles':
                msg = i18n.t("Unable to upload that many files at once.");
                break;
            case 'FileTooLarge':
                // sanitization not needed as the file name is not potentially parsed as HTML, etc.
                var context = {
                    file_name: file.name,
                };
                msg = i18n.t('"__file_name__" was too large; the maximum file size is 25MiB.', context);
                break;
            case 413: // HTTP status "Request Entity Too Large"
                msg = i18n.t("Sorry, the file was too large.");
                break;
            case 400:
                var server_message = server_response && server_response.msg;
                msg = server_message || i18n.t("An unknown error occurred.");
                break;
            default:
                msg = i18n.t("An unknown error occurred.");
                break;
            }
              alert(msg,'rgba(169,12,0,0.30)');
        };
        function formatFileSize(str) { 
            var str = Number(str);
            if (str > 1024) {
            if ((str / 1024) > 100) {
            if ((str / 1024 / 1024) > 100) {
            return (str / 1024 / 1024 / 1024).toFixed(2)+ 'GB';
            }
            return (str / 1024 / 1024).toFixed(2)+'MB';
            }
            return (str / 1024).toFixed(2)+'KB';
            }
            return str +'B';
         }
       var uploadFinished = function (i, file, response) {
            if (response.uri === undefined) {
            return;
            }
            var split_uri = response.uri.split("/");
            var filename = split_uri[split_uri.length - 1];
            var type = file.type.split("/")
                typeName= type[type.length-1]
            var uri =make_upload_absolute(response.uri);
            var size = formatFileSize(file.size)
            if(i != -1){
                $('.uploading-img').hide()
                var img = fileType.type_indicator(typeName.toString())
                var li =  
                "<div class='generate_log_pack' data-url="+uri+">\
                  <div class='generate_log_pack_left'>\
                    "+img+"\
                    <i class='iconfont icon-shanchu1 generate_log_pack_delete'></i>\
                </div>\
                <div class='generate_log_pack_right'>\
                    <p>"+filename+"</p>\
                    <p>"+size+"</p>\
                </div>\
              </div>"
                $(".generate_log_upfile_box").append(li)
                $('#file_inputs').val('');
                alert('上传成功','rgba(0,107,169,0.30)');
            }
        };
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
                drop: drop,
                progressUpdated: progressUpdated,
                error: uploadError,
                uploadFinished: uploadFinished,
                afterAll:function(contents){
                    // console.log(contents,321312)
                }
          })
          $(".generate_log_upfile_box").on("click",".generate_log_pack_delete",function(e){
            $(this).parent().parent().remove()
            alert('删除成功','rgba(0,107,169,0.30)')
          })
          function xy (content){
            var peopleList = []
            $('.generate_log_member_box').children().not($(".add_log_people")).each(function(){
                var index = Number($(this).attr('data_id'))
                peopleList.push(index)
            })
            if(peopleList.length>0){
                peopleList.forEach(function(item,index){
                    if(content[item]!== undefined){
                        delete(content[item])
                    }
                })
            }
            var li = $(templates.render('send_people',{
                peoplelist:content,
            }));
            $(".add_log_people").before(li)
            confirm_hover()
        }
        function confirm_hover(){
            //点击确定
               $('.generate_log_member').mouseenter(function(){
                  $(this).children().eq(2).show()
                  $(this).on('click',".dust-delete",function(e){
                      $(this).parent().parent().remove()
                  })
               })
               $('.generate_log_member').mouseleave(function(){
                 $('.avatar-over').hide()
              })
        
        } 
           // 1.点击添加人员
        $('.add_log_people').on("click",".generate_log_member_addlogo",function(e){ 
               chooseFile.choosePeople(xy,object={})
           })
        }
     
        // $(".generate_log").on("click",function(){
        //     exports.generate_log();
        // })
        exports.generate_log = function(e){
            $(".create_generate_log").show();
            $("#try-log .day-report").addClass("high_light").siblings().removeClass("high_light");
           channel.get({
               url: "json/zg/creator/table?date_type=day",
               idempotent: true,
               success: function (data) {
               if(data){
                    data.date_type="day"
                    // console.log(data)
                    logClick(data)
                   }
               },
           });
           $('.generate_log_left').on("click",".week-report",function(e){
               $(this).addClass("high_light").siblings().removeClass("high_light");
               channel.get({
                   url: "json/zg/creator/table?date_type=week",
                   idempotent: true,
                   success: function (data) {
                   if(data){
                       data.date_type="week"
                        logClick(data)
                       }
                   },
               });
           })
           $('.generate_log_left').on("click",".day-report",function(e){
               $(this).addClass("high_light").siblings().removeClass("high_light");
               channel.get({
                   url: "json/zg/creator/table?date_type=day",
                   idempotent: true,
                   success: function (data) {
                   if(data){
                       data.date_type="day"
                        logClick(data)
                       }
                   },
               });
           })
           $('.generate_log_left').on("click",".month-report",function(e){
               $(this).addClass("high_light").siblings().removeClass("high_light");
               channel.get({
                   url: "json/zg/creator/table?date_type=month",
                   idempotent: true,
                   success: function (data) {
                   if(data){
                       data.date_type="month"
                        logClick(data)
                       }
                   },
               });
           })
        }
        $("#create_log_de").on("click",function(e){
            // console.log("修改成功")
            // e.preventDefault();
            e.stopPropagation();
        })
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
        //新增任务
        $(".new_add_task").on("click",function(){
            $(".new_add_task").hide();
            $(".new_task").show();
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
    
        $(".new_task_save").off().on("click",function(e){
            new_task_save();
        })
        exports.new_task_save = function(){
            var inttitle = $(".create_tasttitle").val().trim();
            var inttime = $("#daibandata").val().trim();
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
            if(inttitle==""){
                $("#taskinput").css("border","1px solid #EF5350");
                return false;
            }
            if(inttitle!=""){
                $("#taskinput").css("border","1px solid #ccc");
            }
            if(inttime==""){
                $(".new_task_date").css("border","1px solid #EF5350");
                $(".new_task_date").css("border-right","1px solid #ccc");
                $("#taskdata").css("border","1px solid #EF5350")
                return false;
            }
            if(inttime!=""){
                $(".new_task_date").css("border","1px solid #ccc");
                $("#taskdata").css("border","1px solid #ccc")
            }
            $.ajax({
                type:"POST",
                url:"json/zg/backlog/",
                contentType:"application/json",
                dataType:"json",
                data:j,
                success:function(res){
                    if(res.errno == 0){
                        $(".error_tip").text("")
                        $.ajax({
                            type:"GET",
                            url:"json/zg/backlog/gets",
                            success:function(response){
                                if(response.errno == 3){
                                    // console.log(response.message)
                                }
                            updata()
                            //测试方案2
                        $(".new_task_title").val("");
                        $(".new_task_date").val("");
                        var backlog_id;
                        $("#file_choose").on("click", "#file_inputs", function (e) {
                            $("#file-choose #file_inputs").trigger("click");
                        });
                        $(".add_ctn").on("click",function(e){
                            $(".move_ctn").children().remove();
                            $(".taskdetail_md").show();
                            $("#management_ctn").hide();
                            $(".tab-content").css("height","100%");
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
                                // console.log(reject)
                            }   
                        })
                    }else if(res.errno == 1){
                        // console.log(res.message)
                    }else if(res.errno == 3){
                        $(".new_task").show()
                        $(".error_tip").text(res.message)
                    }
                },
                error:function(rej){
                    // console.log(rej)
                }
            })
        }
        $(".new_task_cancel").on("click",function(e){
            $(".new_task_title").val("");
            $(".new_task_date").val("")
            $("#taskinput").css("border","1px solid #ccc");
            $(".new_task_date").css("border","1px solid #ccc");
            $("#taskdata").css("border","1px solid #ccc")
            $(".error_tip").text("");
            $(".new_add_task").show();
            $(".new_task").hide();
        })
        exports.new_task_cancel = function(){
            $(".new_task_title").val("");
            $(".new_task_date").val("")
            $("#taskinput").css("border","1px solid #ccc");
            $(".new_task_date").css("border","1px solid #ccc");
            $("#taskdata").css("border","1px solid #ccc")
            $(".error_tip").text("");
            $(".new_add_task").show();
            $(".new_task").hide();
        }
        //点击收拉已完成任务
        $(".right_san").on("click",function(){
                $(".completed_box").toggle();
        })
        
        //点击待办事项文本内容展示详情弹窗
        $(".add_ctn").on("click",function(e){
            $(".move_ctn").children().remove();
            $("#management_ctn").hide();
            $(".taskdetail_md").show();
            $(".tab-content").css("height","100%");
            // $(".app").css("overflow-y","hidden")
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
        $(".generate_log_close").on("click",function(e){
            console.log(1213)
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
                months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],  
                monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],  
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
        
        //只看未读
        $(".log_assistant_read").on("click",function(e){
        })
    });
    
    
    
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
