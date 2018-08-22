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
        var  data = {
            approval_type:type,
            approver_list:send_list,
            content:content,
            start_time:start_time,
            end_time:end_time,
            count:count,
            cause:cause
        }
        return data
    }
    $("body").ready(function(){
       $(".notice_box").on("click",".common_check",function(e){
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
        $(".move_ctn").on("click",".ask_for_leave",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave")
            $(".move_ctn").html(li)
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
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = check;
}