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
          $(".check-people").children().not($(".add_log_people")).each(function(){
            var ids= Number($(this).attr('data_id'))
            send_list.push(ids)
          })
          console.log($(".check-people").children().not($(".add_log_people")).length)
          if(send_list.length===0){
              console.log(15)
              alert()
              return
          }
          var resend_list =[]
          $(".send-check-people").children().not($(".add_log_peoples")).each(function(){
            var ids= Number($(this).attr('data_id'))
              resend_list.push(ids)
          })
        var  data = {
            approval_type:type,
            approver_list:send_list,
            start_time:start_time,
            end_time:end_time,
            count:count,
            cause:cause,
            observer_list:resend_list
        }
        return data
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
        function get_data(datas){
            channel.get({
                url:"/json/zg/approval",
                data:datas,
                    success:function(datalist){
                        var data =datalist.data
                        console.log(datalist)
                        if(data.feedback_list.length===0){
                            data.shown=false
                        }else{
                            data.shown=true
                        }
                        $(".move_ctn").children().remove();
                        var li = templates.render("check_detail",data)
                        $(".move_ctn").html(li)
                        feedBack(datas.types,datas.id)
                    }
                })
        }
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
        $(".move_ctn").on("click",".on_business_trip",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave",{show:true})
            $(".move_ctn").html(li)
            height()
            backIcon()
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
        $(".move_ctn").on("click",".reimburse-moneny",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave",{showdate:true})
            $(".move_ctn").html(li)
            $(".add_log_people").on("click",function(e){
                attendance.peopleChoose(confirm)
            })
            height()
            backIcon()
            $("#btn-test").on("click",function(e){
                e.preventDefault()
                var amount = $("#username").val()
                var category = $("#email").val()
                var send_list =[]
                $(".check-people").children().not($(".add_log_people")).each(function(){
                    var ids= Number($(this).attr('data_id'))
                    send_list.push(ids)
                })
                var data ={
                    amount:amount,
                    category:category,
                    approver_list:send_list
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
                        var  data = data.iaitiate_list
                        console.log(data)
                        if(data.length===0){
                            var html = templates.render("empty")
                            $("#ios").html(html)
                            $(".tabs-contents").height($(window).height()-120)
                        }else{
                           var html = templates.render("table",{data:data})
                            $("#ios").html(html)
                            $(".check-shenpi-detail").on("click",function(e){
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
                                        console.log(data)
                                        $(".move_ctn").children().remove();
                                        var li = templates.render("check_detail",data)
                                        $(".move_ctn").html(li)
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
                                                    console.log(datas,1111)
                                                }
                                            })
                                        })
                                        $(".agree").on("click",function(e){
                                            var datalist = {
                                                types:types,
                                                id:id,
                                                state:"审批通过"
                                            }
                                            channel.put({
                                                url:'/json/zg/approval/table/state_update/',
                                                data:JSON.stringify(datalist),
                                                contentType:"application/json",
                                                success:function(datas){
                                                    console.log(datas,1111)
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
            channel.get({
                url:"/json/zg/approval/initiate/me",
                success:function(data){
                   if(data.errno===0){
                       var  data = data.initiate_list
                    var html = templates.render("table",{data:data})
                    $("#originator").html(html)
                    $(".check-shenpi-detail").on("click",function(e){
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
                                console.log(data)
                                $(".move_ctn").children().remove();
                                var li = templates.render("check_detail",data)
                                $(".move_ctn").html(li)
                                // $(".revoke").on("click",function(e){
                                //     datalist = {
                                //         types:types,
                                //         id:id,
                                //         state:"已撤销"
                                //     }
                                //     channel.put({
                                //         url:'/json/zg/approval/table/state_update/',
                                //         data:JSON.stringify(datalist),
                                //         contentType:"application/json",
                                //         success:function(datas){
                                //             console.log(datas,1111)
                                //         }
                                //     })
                                // })
                            }
                        })
                    })
                   }
                }
            })
        })
        // 抄送我的
        $("body").on("click",".copy_myown",function(e){
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
                        var html = templates.render("table",{data:data})
                        $("#make_copy").html(html)
                        $(".check-shenpi-detail").on("click",function(e){
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
                                    console.log(data)
                                    $(".move_ctn").children().remove();
                                    var li = templates.render("check_detail",data)
                                    $(".move_ctn").html(li)
                                    // $(".revoke").on("click",function(e){
                                    //     datalist = {
                                    //         types:types,
                                    //         id:id,
                                    //         state:"已撤销"
                                    //     }
                                    //     channel.put({
                                    //         url:'/json/zg/approval/table/state_update/',
                                    //         data:JSON.stringify(datalist),
                                    //         contentType:"application/json",
                                    //         success:function(datas){
                                    //             console.log(datas,1111)
                                    //         }
                                    //     })
                                    // })
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
        //反馈
        function feedBack (types,id) {
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
                                get_data(data)
                           }
                        }
                    })
                })    
            })
        }
      
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
                        var html = templates.render("table",{data:data})
                        $("#already_check").html(html)
                        $(".check-shenpi-detail").on("click",function(e){
                            var types = $(this).children().eq(1).attr("data_type")
                            var id = $(this).attr("data_id")
                            var data = {
                                types:types,
                                id:id
                            }
                            get_data(data)
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