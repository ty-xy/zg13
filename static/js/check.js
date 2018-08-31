var check = (function () {
    var exports = {};
    function  moveContent (){
        $(".move_ctn").children().remove();
        var li = templates.render("tab")
        $(".move_ctn").html(li)
    }
    function backIcon(){
        $(".first-icon").on("click",function(e){
            moveContent()
        })
    }
    function backIcons1 (){
        $(".first-icon").unbind("click").on("click",function(e){
            moveContent()
            console.log("我已经审批")
            $(".already_checked").addClass("active").siblings().removeClass("active")
            $("#already_check").addClass("in active").siblings().removeClass("in active")
            channel.get({
                url:"/json/zg/approval/list/completed",
                success:function(dataF){
                    var  data = dataF.completed_list
                    var html = templates.render("table",{data:data,showClass:"completed"})
                    $("#already_check").html(html)
                    $(".check-shenpi-content").height($(window).height()-244)
                }
            })
        })
    }
    function backIcons2(){
        $(".first-icon").unbind("click").on("click",function(e){
            moveContent()
            console.log("返回待我审批")
             $(".expect-check").addClass("active").siblings().removeClass("active")
             $("#ios").addClass("in active").siblings().removeClass("in active")
             channel.get({
                url:"/json/zg/approval/list/expectation",
                success:function(dataF){
                    var  data = dataF.iaitiate_list
                   
                    var  html = templates.render("table",{data:data, showClass:"expectation"})
                    $("#ios").html(html)
                    $(".check-shenpi-content").height($(window).height()-244)
                }
            })
        })
    }
    function backIcons3(){
        $(".first-icon").unbind("click").on("click",function(e){
            moveContent()
            console.log("我发送的")
             $(".send_apply").addClass("active").siblings().removeClass("active")
             $("#originator").addClass("in active").siblings().removeClass("in active")
             channel.get({
                url:"/json/zg/approval/initiate/me",
                success:function(dataF){
                    var  data = dataF.initiate_list
                    
                    var  html = templates.render("table",{data:data,showClass:"initiate"})
                    $("#originator").html(html)
                    $(".check-shenpi-content").height($(window).height()-244)
                }
            })
        })
    }
    function backIcons4(){
        $(".first-icon").unbind("click").on("click",function(e){
            moveContent()
            console.log("抄送我的")
             $(".copy_myown").addClass("active").siblings().removeClass("active")
             $("#make_copy").addClass("in active").siblings().removeClass("in active")
             channel.get({
                url:"/json/zg/approval/inform",
                success:function(dataF){
                    var  data = dataF.inform_list
                    var html = templates.render("table",{data:data,showClass:"inform"})
                    $("#make_copy").html(html)
                    $(".check-shenpi-content").height($(window).height()-244)
                }
            })
        })
    }
    function get_data(datalis,func){
        // var lis = $(".move_ctn").children()
         var datas= {
                types:datalis.types,
                id:datalis.id
            }
        channel.get({
            url:"/json/zg/approval",
            data:datas,
                success:function(datalist){
                    var data =datalist.data
                    if(data.feedback_list.length===0){
                        data.shown=false
                    }else{
                        data.shown=true
                    }
                    $(".move_ctn").children().remove();
                    var li = templates.render("check_detail",data)
                    $(".move_ctn").html(li)
                    func()
                    $(".check-detail-flex").height($(window).height()-244)
                    if(data.button_status!==5){
                        feedBack(datas.types,datas.id,func)
                    }
                }
            })
    }
     function feedBack (types,id,func) {
        $("body").on("click",".feedBack",function(e){
            var rendered = templates.render("feed_back_content")
            $(".modal-logs").html(rendered)
            $(".modal-logs").show()
            $(".feadback-send").on("click",function(e){
                var content = $(".textarea-type").val()
                var data = {
                    types:types,
                    id:id,
                    content:content
                }
                channel.post({
                    url:"json/zg/approval/table/feedback/",
                    data:JSON.stringify(data),
                    contentType:"application/json",
                    success:function(dataList){
                        console.log("gafdgagfa",dataList)
                       if(dataList.errno===0){
                            $(".modal-logs").hide()
                            var data = {
                                types:types,
                                id:id,
                            }
                            get_data(data,func)
                       }
                    }
                })
            })    
        })
    }
    //我发送的请求的一个函数
    function send_check(content){
        channel.get({
            url:content,
            success:function(data){
                console.log(data)
               if(data.errno===0){
                var  data = data.initiate_list
                
                if(data.length===0){
                    var html = templates.render("empty")
                    $("#originator").html(html)
                    $(".tabs-contents").height($(window).height()-120)
                }else{
                    var html = templates.render("table",{data:data,showClass:"initiate"})
                    $("#originator").html(html)
                    $(".check-shenpi-content").height($(window).height()-244)
                    $(".move_ctn").on("click",".check-shenpi-detail-initiate",function(e){
                        var types = $(this).children().eq(1).attr("data_type")
                        var id = $(this).attr("data_id")
                        var datater = {
                            types:types,
                            id:id
                        }
                        channel.get({
                            url:"/json/zg/approval",
                            data:datater,
                            success:function(datalist){
                                console.log(datalist)
                                var data =datalist.data
                                if(data.feedback_list.length===0){
                                    data.shown=false
                                }else{
                                    data.shown=true
                                }
                                var li = templates.render("check_detail",data)
                                $(".move_ctn").html(li)
                                backIcons3()
                                $(".revoke").on("click",function(e){
                                    var rendered = templates.render("feed_back_content",{revolke_tip:true})
                                    $(".modal-logs").html(rendered)
                                    $(".modal-logs").show()
                                    $(".feadback-revoke").on("click",function(){
                                        datalist = {
                                            types:types,
                                            id:id,
                                            state:"撤销"
                                        }
                                        channel.put({
                                        url:'/json/zg/approval/table/state_update/',
                                        data:JSON.stringify(datalist),
                                        contentType:"application/json",
                                        success:function(datas){
                                                 $(".modal-logs").hide()
                                                get_data(datater,backIcons3)
                                            }
                                        })
                                    })
                                })
                            }
                        })
                    })
                }
            }
        }
    })
}
    function height(){
        $(".container-control").height($(window).height()-90)
    }
    function alert () {
        var rendered = templates.render("feed_back_content",{tooTip:true})
        $(".modal-logs").html(rendered)
        $(".modal-logs").show()
        $(".feadback-send-sure").on("click",function(e){
            $(".modal-logs").hide()
        })
    }
    function commonContent(type) {
        // var content = $.trim($("#username").val())
        // 开始时间
          var start_time =$(".start_times").val()
          if(start_time===""){
              alert()
              return
          }
          var end_time = $(".end_times").val()
          if(end_time===""){
             alert()
              return 
          }
          var count = Number($("#email").val())
          if(count===""){
              alert()
              return 
          }
          var cause = $("#text").val()
          if(cause===""){
             alert()
              return 
          }
          var send_list =[]
          $(".shenpi-persons").children().not($(".add_log_people")).each(function(){
            var ids= Number($(this).attr('data_id'))
            send_list.push(ids)
          })
          if(send_list.length===0){
              alert()
              return
          }
          var resend_list =[]
          $(".send-check-people").children().not($(".add_log_peoples")).each(function(){
            var ids= Number($(this).attr('data_id'))
              resend_list.push(ids)
          })
          
          var img_url = $(".img-none-border").attr("data-url")
          
        var  data = {
            approval_type:type,
            approver_list:send_list,
            start_time:start_time,
            end_time:end_time,
            count:count,
            cause:cause,
            observer_list:resend_list,
            img_url:img_url
        }
        return data
    }
    upload.feature_check($("#img-border #attach_file"));
    $("#img-border").on("click", "#attach_file", function (e) {
       // e.preventDefault();
       $("#img-border #file_inputs").trigger("click");
   });
    function make_upload_absolute(uri) {
    if (uri.indexOf(compose.uploads_path) === 0) {
        // Rewrite the URI to a usable link
        return compose.uploads_domain + uri;
    }
    return uri;
 }
    $("body").ready(function(){
       $("body").on("click",".common_check",function(e){
            $(this).addClass("backgr").siblings().removeClass("backgr")
            moveContent()
        })
      
        function common_choose(){
            var arrlist =[]
            var peopleList = []
            $('.generate_log_member_box').children().not($(".add_log_people")).each(function(){
                var index = Number($(this).attr('data_id'))
                peopleList.push(index)
            })
            $(".box-right-list").children().each(function () { 
                var id = Number($(this).attr("key-data"));
                var avatar = $(this).attr("avatarurl")
                var name = $(this).children().find('.name-list').text()
                var peppleList = {
                    id:id,
                    avatar:avatar,
                    name:name,
                    namel:name.slice(0,4)+"....",
                    small:true
                }
                console.log(peppleList)
                if(peopleList.indexOf(peppleList.id)===-1){
                    arrlist.push(peppleList)
                    console.log(arrlist)
                }
            })
           
            // console.log($(".add_log_people").siblings().length)
            var li = $(templates.render('send_people',{
               peoplelist:arrlist
           }));
           return li 
        }
        //请假
        function confirm(){
            //点击确定
            $(".choose-right-list").on('click','.button-confirm',function(e){
               var li = common_choose()
               $(".add_log_people").before(li)
               $('.generate_log_member').mouseenter(function(){
                  $(this).children().eq(2).show()
                  $(this).on('click',".dust-delete",function(e){
                      $(this).parent().parent().remove()
                  })
               })
               $('.generate_log_member').mouseleave(function(){
                 $('.avatar-overs').hide()
              })
               
               $('.box-right-list').remove()
               $(".modal-log").hide()
               //清除里面所有的元素，模态框消失。
               $(".modal-log-content").empty()
        
            })
        }  
        function confirms(){
            $(".choose-right-list").on('click','.button-confirm',function(e){
                var li = common_choose()
                $(".add_log_peoples").before(li)
                $('.generate_log_member').mouseenter(function(){
                   $(this).children().eq(2).show()
                   $(this).on('click',".dust-delete",function(e){
                       $(this).parent().parent().remove()
                   })
                })
                $('.generate_log_member').mouseleave(function(){
                  $('.avatar-overs').hide()
               })
                
                $('.box-right-list').remove()
                $(".modal-log").hide()
                //清除里面所有的元素，模态框消失。
                $(".modal-log-content").empty()
             })
        }
        var uploadFinished =function(i, file, response){
        if (response.uri === undefined) {
            return;
            }
            var split_uri = response.uri.split("/");
            var filename = split_uri[split_uri.length - 1];
            var type = file.type.split("/")
                typeName= type[type.length-1]
            var uri = make_upload_absolute(response.uri);
            console.log(i,uri)
            if(i!==-1){
                var div  = '<div class ="img-border img-none-border" data-url= '+uri+'>\
                              <img src='+uri+'  />\
                            </div>'
                $(".add-imgs-control").after(div)
            }
         }
         function uploadFile (){
            $("#img-border").filedrop({
                url: "/json/user_uploads",
                fallback_id: 'file_inputs',  // Target for standard file dialog
                paramname: "file",
                maxfilesize: page_params.maxfilesize,
                data: {
                    csrfmiddlewaretoken: csrf_token,
                },
                uploadFinished: uploadFinished,
                afterAll:function(contents){
                    console.log(contents,321312)
                }
            })
         }
        //请假
        $(".move_ctn").on("click",".ask_for_leave",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave")
            $(".move_ctn").html(li)
            height()
            $('#newplan_datetimepicker2').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            }); 
            $('#newplan_datetimepicker1').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });
            $(".add_log_people").on("click",function(e){
                attendance.peopleChoose(confirm)
            })
            $(".add_log_peoples").on("click",function(e){
                attendance.peopleChoose(confirms)
            })
            uploadFile()
            $("#btn-test").on("click",function(e){
                 e.preventDefault()
                 var data = commonContent('leave')
                 channel.post({
                     url:"/json/zg/approval/leave/",
                     data:JSON.stringify(data),
                     contentType:"application/json",
                     success:function(data){
                         if(data.errno===0){
                            moveContent()
                         }
                     }
                 })
            })
            backIcon()
        })
        //出差
        $(".move_ctn").on("click",".on_business_trip",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave",{show:true})
            $(".move_ctn").html(li)
            height()
            backIcon($("#img-border"))
            uploadFile()
            $('#newplan_datetimepicker2').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            }); 
            $('#newplan_datetimepicker1').datetimepicker({  
                language:"zh-CN",  
                todayHighlight: true,  
                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                weekStart:1  
            });
            $(".add_log_people").on("click",function(e){
                attendance.peopleChoose(confirm)
            })
            $(".add_log_peoples").on("click",function(e){
                attendance.peopleChoose(confirms)
            })
            $("#btn-test").on("click",function(e){
                 e.preventDefault()
                 var data = commonContent("evection")
                 channel.post({
                     url:"/json/zg/approval/leave/",
                     data:JSON.stringify(data),
                     contentType:"application/json",
                     success:function(data){
                         if(data.errno===0){
                            moveContent()
                         }
                     }
                 }) 
            })
        })
        //差旅费
        $(".move_ctn").on("click",".reimburse-moneny",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave",{showdate:true})
            $(".move_ctn").html(li)
            $(".add_log_people").on("click",function(e){
                attendance.peopleChoose(confirm)
            })
            $(".add_log_peoples").on("click",function(e){
                attendance.peopleChoose(confirms)
            })
            height()
            backIcon()
            uploadFile()
            $("#btn-test").on("click",function(e){
                e.preventDefault()
                var amount = $("#username").val()
                if(amount===""){
                    alert()
                    return
                }
                var category = $("#email").val()
                if(category===""){
                    alert()
                    return
                }
                var send_list =[]
                $(".shenpi-persons").children().not($(".add_log_people")).each(function(){
                    var ids= Number($(this).attr('data_id'))
                    send_list.push(ids)
                })
                if(send_list.length===0){
                    alert()
                    return
                }
                var resend_list =[]
                $(".send-check-people").children().not($(".add_log_peoples")).each(function(){
                    var ids= Number($(this).attr('data_id'))
                    resend_list.push(ids)
                })
                var img_url = $(".img-none-border").attr("data-url")
                var data ={
                    amount:amount,
                    category:category,
                    approver_list:send_list,
                    observer_list:resend_list,
                    img_url:img_url
                }
                channel.post({
                    url:'/json/zg/approval/reimburse/',
                    data:JSON.stringify(data),
                    contentType:"application/json",
                     success:function(data){
                         if(data.errno===0){
                            moveContent()
                         }
                     }
                })
            })
        })
        $('.move_ctn').on("click",".progress-percent",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("project_progress")
            $(".move_ctn").html(li)
            height()
            backIcon()
        })
        // 待我审批
        $("body").on("click",".expect-check",function(e){
            channel.get({
                url:"/json/zg/approval/list/expectation",
                success:function(data){
                   if(data.errno===0){
                        var data = data.iaitiate_list
                        //    data.showClass = "expectation"
                        if(data.length===0){
                            var html = templates.render("empty")
                            $("#ios").html(html)
                            $(".tabs-contents").height($(window).height()-120)
                        }else{
                            console.log(data)
                           var html = templates.render("table",{data:data,showClass:"expectation"})
                            $("#ios").html(html)
                            $(".check-shenpi-content").height($(window).height()-244)
                            $(".move_ctn ").on("click",".check-shenpi-detail-expectation",function(e){
                                var types = $(this).children().eq(1).attr("data_type")
                                var id = $(this).attr("data_id")
                                var data = {
                                    types:types,
                                    id:id
                                }
                                channel.get({
                                    url:"/json/zg/approval",
                                    data:data,
                                    success:function(datalist){
                                        var data =datalist.data

                                        console.log("返回待我审批1")
                                        $(".move_ctn").children().remove();
                                        var li = templates.render("check_detail",data)
                                        $(".move_ctn").html(li)
                                      
                                        backIcons2()
                                        $(".no_agree").on("click",function(e){
                                            datalist = {
                                                types:types,
                                                id:id,
                                                state:"审批未通过"
                                            }
                                            channel.put({
                                                url:'/json/zg/approval/table/state_update/',
                                                data:JSON.stringify(datalist),
                                                contentType:"application/json",
                                                success:function(datas){
                                                    var html ='<button class="button-detail-common feedBack">反馈</button>'
                                                    $(".button-show").html(html)
                                                    var data = {
                                                        types:types,
                                                        id:id,
                                                    }
                                                    get_data(data,backIcons2)
                                                }
                                            })
                                        })
                                        $(".agree").on("click",function(e){
                                            var datalist = {
                                                types:types,
                                                id:id,
                                                state:"同意"
                                            }
                                            channel.put({
                                                url:'/json/zg/approval/table/state_update/',
                                                data:JSON.stringify(datalist),
                                                contentType:"application/json",
                                                success:function(){
                                                    var html ='<button class="button-detail-common feedBack">反馈</button>'
                                                    $(".button-show").html(html)
                                                    var data = {
                                                        types:types,
                                                        id:id,
                                                    }
                                                    get_data(data,backIcons2)
                                                }
                                            })
                                        })
                                    }
                                })
                            })
                        }
                    }
                }
            })
        })
        // 我发起的审批
        $("body").on("click",".send_apply",function(e){
            var lis = "/json/zg/approval/initiate/me"
            send_check(lis)
        })
        // 抄送我的
        $("body").on("click",".copy_myown",function(e){
            //    var that = $(this).attr("class")
            //    var index = that.indexOf("active")
            channel.get({
                url:"/json/zg/approval/inform",
                success:function(data){
                    if(data.errno===0){
                    var  data = data.inform_list
                    
                    if (data.length===0){
                        var html = templates.render("empty")
                        $("#make_copy").html(html)
                        $(".tabs-contents").height($(window).height()-120)
                     } else {                   
                        var html = templates.render("table",{data:data,showClass :"inform"})
                        $("#make_copy").html(html)
                        $(".check-shenpi-content").height($(window).height()-244)
                        $(".move_ctn").on("click",".check-shenpi-detail-inform",function(e){
                            var types = $(this).children().eq(1).attr("data_type")
                            var id = $(this).attr("data_id")
                            var datas = {
                                types:types,
                                id:id,
                                // dataClass:that
                            }
                            channel.get({
                                url:"/json/zg/approval",
                                data:datas,
                                    success:function(datalist){
                                        var data =datalist.data
                                       console.log("抄送我的1")
                                        if(data.feedback_list.length===0){
                                            data.shown=false
                                        }else{
                                            data.shown=true
                                        }
                                        $(".move_ctn").children().remove();
                                        var li = templates.render("check_detail",data)
                                        $(".move_ctn").html(li)
                                        // backIcons(lis)
                                        backIcons4()
                                       
                                        $(".check-detail-flex").height($(window).height()-244)
                                        if(data.button_status!==5){
                                            feedBack(datas.types,datas.id,backIcons4)
                                        }
                                    }
                                })
                          
                        })
                      }
                   }
                }
            })
        })
        //点击模态框消失
        $(".modal-logs").on("click",function(e){
            $(".modal-logs").hide()
        })
       
      
        //点击模态框内部的内容，模态框不消失
        $(".modal-logs").on("click","#feed-back-content",function(e){
            e.stopPropagation()
            e.preventDefault()
            // $(".modal-logs").show()
        })
        //点击关闭按钮，关闭
        $(".modal-logs").on("click",".icon-close-guanbi",function(e){
            $(".modal-logs").hide()
            // $(".modal-logs").show()
        })
        $(".modal-logs").on("click",".feadback-cancel",function(e){
            $(".modal-logs").hide()
            // $(".modal-logs").show()
        })
        // 我已经审批
        $("body").on("click",".already_checked",function(e){
            channel.get({
                url:"/json/zg/approval/list/completed",
                success:function(data){
                    if(data.errno===0){
                     var data = data.completed_list
                     if (data.length===0){
                        var html = templates.render("empty")
                        $("#already_check").html(html)
                        $(".tabs-contents").height($(window).height()-120)
                     } else {
                        var html = templates.render("table",{data:data,showClass:"completed"})
                        $("#already_check").html(html)
                        $(".check-shenpi-content").height($(window).height()-244)
                        $(".move_ctn").on("click",".check-shenpi-detail-completed",function(e){
                            var types = $(this).children().eq(1).attr("data_type")
                            var id = $(this).attr("data_id")
                            var datas= {
                                types:types,
                                id:id
                            }
                            channel.get({
                                url:"/json/zg/approval",
                                data:datas,
                                    success:function(datalist){
                                        console.log(datalist)
                                        var data =datalist.data
                                        if(data.feedback_list.length===0){
                                            data.shown=false
                                        }else{
                                            data.shown=true
                                        }
                                        $(".move_ctn").children().remove();
                                        var li = templates.render("check_detail",data)
                                        $(".move_ctn").html(li)
                                        backIcons1()
                                        // backIcons(lis)
                                        $(".check-detail-flex").height($(window).height()-244)
                                        if(data.button_status!==5){
                                            feedBack(datas.types,datas.id,backIcons1)
                                        }
                                    }
                                })
                               
                           })
                        }
                    }
                }
            })
        })
        
        // $("").click(function(){
        //     console.log(2121212121)
        // })
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = check;
}