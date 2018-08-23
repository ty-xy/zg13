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
    function commonContent(type) {
        var content = $.trim($("#username").val())
        // 开始时间
          var start_time =$(".start_times").val()
          var end_time = $(".end_times").val()
          var count = Number($("#email").val())
          var cause = $("#text").val()
          var send_list =[]
          $(".check-people").children().not($(".add_log_people")).each(function(){
            var ids= Number($(this).attr('data_id'))
            send_list.push(ids)
          })
          var resend_list =[]
          $(".send-check-people").children().not($(".add_log_peoples")).each(function(){
            var ids= Number($(this).attr('data_id'))
              resend_list.push(ids)
          })
        var  data = {
            approval_type:type,
            approver_list:send_list,
            content:content,
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
            $('#create_log_de .generate_log_member_box').children().not($(".add_log_people")).each(function(){
                
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
                if(peopleList.indexOf(peppleList.id)===-1){
                    console.log(peopleList)
                    arrlist.push(peppleList)
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
                // amount：报销金额
                // category：报销类别
                // approver_list(审批人id列表)
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
            })
        })
        $(".modal-logs").on("click",function(e){
            $(".modal-logs").hide()
        })
        // 我已经审批
        $("body").on("click",".already_checked",function(e){
            channel.get({
                url:"/json/zg/approval/list/completed",
                success:function(data){
                    if(data.errno===0){
                        var  data = data.completed_list
                     var html = templates.render("table",{data:data})
                     $("#already_check").html(html)
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
                                $(".feedBack").on("click",function(e){
                                    console.log("rerere")
                                    var rendered = templates.render("feed_back_content")
                                    $(".modal-logs").html(rendered)
                                    $(".modal-logs").show()
                                })
                            }
                        })
                      })
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