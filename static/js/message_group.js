var message_group = (function () {

    var exports = {};
    
    $(function(){
        function common(subscriptions,contents){
            var content=  templates.render('show_group', {subscriptions:subscriptions});
            $("#group_seeting_choose").html(content)
            $(contents).addClass("high_light").siblings().removeClass("high_light");
        }
        function get_email_of_subscribers(subscribers){
            var emails = [];
            var subd=subscribers._items
            for(k in subd)
             {
                var email = people.get_person_from_user_id(subd[k].k).email;
                emails.push(email);
             }
             console.log(emails)
            //  subd.each(function (o, i) {
            //     console.log(o,i)
            //     var email = people.get_person_from_user_id(i).email;
            //     emails.push(email);
            // });
            return emails;
        };
        $(".group_icon").on("click",function(e){
            // people.get_person_from_user_id(26)
            $("#empty_narrow_all_mentioned").hide()
            $("#zhome").hide()
            $("#group_seeting_choose").show()
            $(".home-title").hide()
            $(".home_gruop_title").show()
            var streams = stream_data.subscribed_subs();
            var sub=stream_data.get_subscribers()
            var subscriptions = stream_data.get_streams_for_settings_page();
           
            // console.log(stream_edit,323111)
            var get_sub_by_name =stream_data.get_sub_by_name("Denmark")
             var emial =get_email_of_subscribers(get_sub_by_name.subscribers)
             var avatar = people.stream_url_for_eamil(emial[0])
            console.log(streams,subscriptions,sub,get_sub_by_name,avatar,emial[0])
            var content1 =  templates.render('show_group', {subscriptions:streams});
            $("#group_seeting_choose").html(content1)
              //已订阅的群组
            $(".streams-list").on("click",".stream-row",function(){
                var name =  $(this).attr("data-stream-name")
                var index = $(this).attr("data-stream-id")
                var nfirst= name.slice(0,1)
                var  li = "<li class='group_list_index' data_steam_id="+index+" >\
                             <span class='color-setting avatar_setting'>"+nfirst+"</span>\
                             <div class='list-setting-common'>\
                               <div class='list-right-setting'>\
                                  <span>"+name+"</span>\
                                  <span>12:15</span>\
                               </div>\
                               <p>请假申请发给你啦，通过一下…</p>\
                             </div>\
                           </li>"
                $(".notice_ctn_box").empty()
                $(".group_icon").hide()
                $(window).attr("location","#narrow/is/private")
                $(".home-title").show()
                $(".home-title span").html(name)
                $(".home_gruop_title").hide()
                $("#zfilt").hide()
                $(".notice_ctn_box").append(li)
                $(".group_list_index").on("click",function(){
                    $(window).attr("location","#narrow/stream/"+index+"-"+name+"")
                    $("#zfilt").show()
                    var topic_names = topic_data.get_recent_names(index);
                    var li = templates.render('topic_list', {topiclist:topic_names});
                    $(".topic-list").html(li)
                    $(".topic-item-list").on("click",function(){
                         var topic= $.trim($(this).text())
                         var person=page_params.full_name
                        //  console.log(message_list.last())
                         $(this).css("background","#4584FF").siblings().css("background","#fff")
                        $(window).attr("location","#narrow/stream/"+index+"-"+name+"/topic/"+topic+"")
                    })
                })
            
              })
               
              $(".all_group").on("click",function(){
                common(subscriptions,".all_group")
              })
              //全部群组
              $(".already_sub").on("click",function(){
                common(streams,".already_sub")
            })
        })
        $(".home-title").on("click","button",function(e){
            // e.preventDefault()
            //组织冒泡
            e.stopPropagation();
            var title = $(this).siblings().html()
            var titlef= title.slice(0,1)
            var text= $(".home-title span").html()
            console.log(title, $(this).siblings())
            var html = templates.render("group_setting",{name:title,titlef:titlef})
            $(".group_setting").html(html)
            $(".group_setting").show()

            //点击空白区域这个模态框消失
            if($(".group_setting").show()){
                $('body').bind('click', function (e) {
                    var o = e.target;
                    if($(o).closest('.group_setting').length==0)//不是特定区域
                               $(".group_setting").hide();
                });
            }
        })
    })
    
    
    return exports;
    
    }());
    if (typeof module !== 'undefined') {
        module.exports = message_group;
    }