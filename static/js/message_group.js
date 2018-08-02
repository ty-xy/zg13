var message_group = (function () {

    var exports = {};
    
    $(function(){
        function  changeUrl (){
            var url =window.location.hash
            var i = url.indexOf("/")
            var index = url.indexOf("/",i+1)
            var url_index = url.substr(0,url.indexOf("/",i+1))
            if (url_index=== "#narrow/stream"){
                // var topic_names = topic_data.get_recent_names("15");
                // console.log(topic_names)
                // var li = templates.render('topic_list', {topiclist:topic_names});
                // $(".topic-list").html(li)
                if(url.indexOf("/",index+1) != -1){
                    var j = url.slice(index+4,url.indexOf("/",index+1))
                    $(".home-title span").html(j)
                }else{
                    $(".home-title span").html(url.substr(index+4))             
                }
                $(".home-title").show()
                $(".compose-title").show()
            }else{
                $(".home-title").hide()
                $(".compose-title").hide()
            }
        }
        changeUrl()
        window.addEventListener('hashchange', function () {
                changeUrl()
          })
        // console.log(url.substr(0,url.lastIndexOf("/",1)))
        function common(subscriptions,contents){
            // if(contents===".all_group"){
            //     subscriptions.show_all=true
            // }else{
            //     subscriptions.show_all=false
            // }
            console.log(subscriptions)
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
                var index = people.get_person_from_user_id(subd[k].k).full_name;
                var person = {
                      email:email,
                      index:index
                }
                emails.push(person);
             }
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
            // 渲染群组
           
            console.log(streams,subscriptions,sub)
            var content1 =  templates.render('show_group', {subscriptions:streams});
            $("#group_seeting_choose").html(content1)
            $(".swtich-button").hide()
              //已订阅的群组
            // $("#div1").on("click",function(e){
            //     e.preventDefault()
            //     e.stopPropagation()
            //     console.log(6)
            // 开关按钮暂定状态，稍后优化
                $("#group_seeting_choose").on("click","#div2",function(e){ 
                    if($(this).closest($(this).parent()).length!=0){
                        e.preventDefault()
                        e.stopPropagation()
                    var stream_id = Number($(this).closest(".stream-list-row").attr("data-stream-id"))
                    var sub = stream_data.get_sub_by_id(stream_id)
                    subs.sub_or_unsub(sub);
                    // var x = $(this).parents(".stream-list-row")
                    $(this).parent().attr("class",($(this).parent().attr("class")=="close1")?"open1":"close1")
                    $(this).attr("class",($(this).attr("class")=="close2")?"open2":"close2")
                  }
               })
            // })
            // 点击群组的事件
            $(".streams-list").on("click",".stream-row",function(){
                 e.preventDefault()
                 e.stopPropagation()
                var name =  $(this).attr("data-stream-name")
                var index = $(this).attr("data-stream-id")
                var color = $(this).children().eq(0).css("background-color")
                console.log(color)
                $("#compose").show()
                $("#compose-container").show()
                var nfirst= name.slice(0,1)
                var  li = "<li class='group_list_index' data_steam_id="+index+" >\
                             <span class='color-setting avatar_setting' style='background-color:"+color+"'>"+nfirst+"</span>\
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
                // $(".group_list_index").on("click",function(){
                    $(window).attr("location","#narrow/stream/"+index+"-"+name+"")
                    $("#zfilt").show()
                    var topic_names = topic_data.get_recent_names(index);
                    console.log(index)
                    var li = templates.render('topic_list', {topiclist:topic_names});
                    $(".topic-list").html(li)
                    $(".topic-item-list").on("click",function(){
                         var topic= $.trim($(this).text())
                        //  console.log(message_list.last())
                         $(this).css("background","#4584FF").siblings().css("background","#fff")
                        $(window).attr("location","#narrow/stream/"+index+"-"+name+"/topic/"+topic+"")
                    })
                // })
                      
              })
               
              $("#group_seeting_choose").on("click",".all_group",function(){
                common(subscriptions,".all_group")
                $(".swtich-button").show()
              })
              //全部群组
              $("#group_seeting_choose").on("click",".already_sub",function(){
                var streams = stream_data.subscribed_subs();
                common(streams,".already_sub")
                $(".swtich-button").hide()
            })
        })
        $(".home-title").on("click","button",function(e){
            // e.preventDefault()
            //组织冒泡
            e.stopPropagation();
            var title = $(this).siblings().html()
            var titlef= title.slice(0,1)
            var text= $(".home-title span").html()
            var get_sub_by_name =stream_data.get_sub_by_name(title)
            var emial =get_email_of_subscribers(get_sub_by_name.subscribers)
            // var avatar = people.stream_url_for_eamil(emial[0])
            var avatar = []
             emial.forEach(function(i,v){
                 
                 var avatarUrl= people.stream_url_for_eamil(i.email)
                 var personnal = {
                    avatarUrl:avatarUrl,
                    name:i.index
                 }
                 avatar.push(personnal)
             })
            // console.log(title, $(this).siblings())
            var html = templates.render("group_setting",{name:title,titlef:titlef,avatar:avatar})
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