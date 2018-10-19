var message_body = (function(){
    var exports = {};
    $("body").ready(function(){
        arr = JSON.parse(localStorage.getItem("arr"))
        if(arr == null ){
                arr = []
            var arr1 = []
            var arr2= []
            var pms = page_params.unread_msgs.pms
            var key = unread.get_counts().stream_count.keys()
            // console.log(unread.get_counts().pm_count.keys(),unread.get_counts().pm_count)
      
            pms.forEach(function(v,i){
                var person = people.get_person_from_user_id(v.sender_id);
                var send_id= v.sender_id
                person.avatar_url = people.small_avatar_url_for_person(person)
                var name = person.full_name
                var avatar = person.avatar_url
                var index = person.email.indexOf("@")
                var short_name = person.email.slice(0,index)
                var _href = "#narrow/pm-with/"+send_id+"-"+short_name
                var id = v.unread_message_ids.pop()
                channel.get({
                    url: '/json/messages/' +  id,
                    idempotent: true,
                    success:function(data){
                        var time =  server_events.tf(data.pud_date)
                        var mes = data.raw_content
                        var time_stamp = new Date().getTime()
                        arr.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,'',short_name,time_stamp))
                        var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                        $(".persistent_data").prepend(notice_box)
                        unread_ui.update_unread_counts()
                        server_events.sortBytime()
                        if(key.length==0){
                            localStorage.setItem("arr",JSON.stringify(arr))
                        }
                    }
                })
            });
            
            var key = unread.get_counts().stream_count.keys()
            key.forEach(function(y){
                      var sub = stream_data.get_sub_by_id(y)
                      var avatar = sub.color
                      var name = sub.name
                      var stream_id = y 
                      var stream = "stream"
                      var short_name = name
                      // arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream,short_name,time_stamp))
                      var url = '/json/users/me/' + y + '/topics';
                      channel.get({
                          url:url,
                          data:{},
                          success:function(data){
                              console.log(data)
                              var message_id = Math.max.apply(Math, data.topics.map(function(o) {return o.max_id}))
                              var value  = data.topics[0].name
                              var _href= narrow.by_stream_subject_uris(name,value)
                              channel.get({
                                  url: '/json/messages/' + message_id,
                                  idempotent: true,
                                  success:function(data){
                                     var time =  server_events.tf(data.pud_date)
                                     var mes = data.raw_content
                                     var time_stamp = data.pud_date
                                     var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,stream_id:y,time:time,_href:_href,stream:stream})
                                     $(".persistent_data").prepend(notice_box)
                                      var count = unread.num_unread_for_stream(y);
                                      var lis = $(".only_tip[stream_id="+y+"]").parent()
                                      stream_list.update_count_in_dom(lis, count);
                                      arr.push(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream,short_name,time_stamp))
                                      localStorage.setItem("arr",JSON.stringify(arr))
                                  }
                              })
                          }
                      })
                 
               })
            
         }
        setTimeout(function(){
            
        },1000)
    })
    return exports;
}())
if (typeof module !== 'undefined') {
    module.exports =  message_body;
}