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
            var key = unread.get_counts().stream_count.keys()
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
                        if(key.length==0){
                            localStorage.setItem("arr",JSON.stringify(arr))
                        }
                        unread_ui.update_unread_counts()
                        server_events.sortBytime()
                        if(key.length==0){
                            localStorage.setItem("arr",JSON.stringify(arr))
                        }
                    }
                })
            });
            
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
         function phrase_match(phrase, q) {
            // match "tes" to "test" and "stream test" but not "hostess"
            var i;
            q = q.toLowerCase();
        
            phrase = phrase.toLowerCase();
            if (phrase.indexOf(q) === 0) {
                return true;
            }
        
            var parts = phrase.split(' ');
            for (i = 0; i < parts.length; i += 1) {
                if (parts[i].indexOf(q) === 0) {
                    return true;
                }
            }
            return false;
        }
         function stream_matches_query(stream_name, q) {
            return phrase_match(stream_name, q);
        }
         $("#global_search").on("change",function(data){
            var data = $(this).val()
            if(data.length>0){
                $(".search-top-icon").show()
                var arr = []
                var arrlis = []
                var arrs = []
                var person_list = []
                var group_list = []
                var all_persons = people.get_all_persons();
                var persons = _.filter(all_persons, function (person) {
                    return people.person_matches_query(person, data);
                });
                var streams = stream_data.subscribed_streams();
                streams = _.filter(streams, function (stream) {
                    return stream_matches_query(stream, data);
                });
                if(persons.length>0){
                    $(".show-person").show()
                    persons.forEach(function(value,index){
                          var avatar = people.stream_url_for_eamil(value.email)
                          var indexs = value.email.indexOf("@")
                          var short_name = value.email.slice(0,indexs)
                          var send_id = value.user_id
                          var name = value.full_name
                          var _href = "#narrow/pm-with/"+send_id+"-"+short_name
                          person_list.push({avatar:avatar,name:name,href:_href,private:send_id,short_name:short_name})
                    })
                    var lis = templates.render("choose_search_people",{arr:person_list})
                    $(".all-choose-person").html(lis)
                    var time_stamp = new Date().getTime()
                    var time = server_events.tf(time_stamp)
                    $(".all-choose-person").off("click","a").on("click","a",function(e){
                        var arrlist = JSON.parse(localStorage.getItem("arr"))
                        var id  = $(this).attr("data_id")
                        var data_index = person_list.filter(function(item){
                             if(item.private ==id){
                                 return item
                             }
                        })
                        var name = data_index[0].name
                        var _href = data_index[0].href
                        var short_name = data_index[0].short_name
                        var avatar = data_index[0].avatar
                        var send_id = id 
                        if(arrlist == null){
                            var arrlist = []
                            arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,"",_href,"",short_name,time_stamp))
                            var notice_box = templates.render("notice_box",{name:name,mes:"",avatar:avatar,send_id:id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                            $(".persistent_data").prepend(notice_box)
                            var arr = arrlist
                            localStorage.setItem("arr",JSON.stringify(arr))
                          }else{
                            var data_index = arrlist.filter(function(item){
                                return  item.send_id == send_id
                             })
                            
                             if(data_index.length==0){
                                arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,"",_href,"",short_name,time_stamp))
                             }
                            
                             var notice_box = templates.render("notice_box",{name:name,mes:"",avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                             $(".persistent_data").prepend(notice_box)
                           
                             var arr = arrlist
                             localStorage.setItem("arr",JSON.stringify(arr))
                       } 
                    })
                }else{
                    $(".show-person").hide()
                }

                if(streams.length>0){
                    $(".show-group").show()
                    streams.forEach(function(value,index){
                         var sub  = stream_data.get_sub_by_name(value)
                         var stream_id = sub.stream_id
                         var color = sub.color
                         var url = '/json/users/me/' + stream_id + '/topics';
                         channel.get({
                             url:url,
                             data:{},
                             success:function(data){
                                 var topic =  data.topics[0].name
                                 var _href= narrow.by_stream_subject_uris(value,topic)
                                 group_list.push({avatar:color,name:value,href:_href,stream:stream_id,short_name:value})
                                 var li = templates.render("choose_search_people",{arr:group_list})
                                 $(".all-choose-group").html(li)
                                 var time_stamp = new Date().getTime()
                                 var time = server_events.tf(time_stamp)
                                 $(".all-choose-group").off("click","a").on("click","a",function(e){
                                     var arrlist = JSON.parse(localStorage.getItem("arr"))
                                     var id  = $(this).attr("data_id")
                                     var data_index = group_list.filter(function(item){
                                          if(item.stream ==id){
                                              return item
                                          }
                                     })
                                     var name = data_index[0].name
                                     var _href = data_index[0].href
                                     var short_name = data_index[0].short_name
                                     var avatar = data_index[0].avatar
                                     var stream_id = id 
                                     if(arrlist == null){
                                         var arrlist = []
                                         arrlist.unshift(server_events.set_local_news("",stream_id,name,avatar,time,"",_href,"stream",short_name,time_stamp))
                                         var notice_box = templates.render("notice_box",{name:name,mes:"",avatar:avatar,stream_id:id,time:time,stream:"stream",short_name:short_name,_href:_href,time_stamp:time_stamp})
                                         $(".persistent_data").prepend(notice_box)
                                         var arr = arrlist
                                         console.log(1)
                                         localStorage.setItem("arr",JSON.stringify(arr))
                                       }else{
                                         var data_index = arrlist.filter(function(item){
                                             return  item.stream_id == stream_id
                                          })
                                          console.log(2)
                                          if(data_index.length==0){
                                             arrlist.unshift(server_events.set_local_news("",stream_id,name,avatar,time,"",_href,"stream",short_name,time_stamp))
                                          }
                                         
                                          var notice_box = templates.render("notice_box",{name:name,mes:"",avatar:avatar,stream_id:stream_id,time:time,stream:"stream",short_name:short_name,_href:_href,time_stamp:time_stamp})
                                          $(".persistent_data").prepend(notice_box)
                                        
                                          var arr = arrlist
                                          localStorage.setItem("arr",JSON.stringify(arr))
                                     } 
                                 })
                             }
                         })
                    })
                }else{
                    $(".show-group").hide()
                }
                channel.get({
                    url:  '/json/messages',
                    data: {
                        anchor: 2256,
                        num_before: 50,
                        num_after: 50,
                        narrow:JSON.stringify([{operator: 'search', operand: data, negated: false}])
                    },
                    idempotent: true,
                    success:function(data){
                        console.log(data)
                    if(data.messages.length>0){
                        data.messages.forEach(function(value,index){
                                if(value.type==="stream"){
                                    
                                    $(".group-chat").show()
                                    var name = value.display_recipient
                                    var subject = value.match_subject
                                    var data = {
                                        match_content:value.match_content,
                                        subject:value.match_subject,
                                        name:value.display_recipient,
                                        avatar:value.avatar_url,
                                        href:narrow.by_stream_subject_uris(name,subject),
                                        stream_id:value.stream_id,
                                        content:value.content,
                                        short_name:value.display_recipient
                                    }
                                    arrs.push(data)
                                   
                                }else if(value.type="private"){
                                    var pm_with_url = people.pm_with_url(value)
                                    var person = value.display_recipient[0]
                                    var avatar = people.stream_url_for_eamil(person.email)
                                    var name = person.full_name
                                    var data = {
                                        name:name,
                                        avatar:avatar,
                                        match_content:value.match_content,
                                        href:pm_with_url,
                                        recipient_id:value.recipient_id,
                                        content:value.content,
                                        short_name:person.short_name
                                    }
                                    $(".person-chat").show()
                                    arrlis.push(data)
                                }
                            })
                            var lis = templates.render("choose_search",{arr:arrs})
                            $(".all-messge-shows").html(lis)
                            $(".all-messge-shows").on("click","a",function(e){
                                var arrlist = JSON.parse(localStorage.getItem("arr"))
                                var id  = $(this).attr("data_id")
                                var data_index = arrs.filter(function(item){
                                     if(item.stream_id ==id){
                                         return item
                                     }
                                })
                                var name = data_index[0].name
                                var _href = data_index[0].href
                                var short_name = data_index[0].short_name
                                var avatar = data_index[0].avatar
                                var send_id = id 
                                var mes = data_index[0].content
                                var time_stamp = new Date().getTime()
                                var time = server_events.tf(time_stamp)
                                if(arrlist == null){
                                    var arrlist = []
                                    arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,"",short_name,time_stamp))
                                    var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                    $(".persistent_data").prepend(notice_box)
                                    var arr = arrlist
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                  }else{
                                    var data_index = arrlist.filter(function(item){
                                        return  item.send_id == send_id
                                     })
                                    
                                     if(data_index.length==0){
                                        arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,"",short_name,time_stamp))
                                     }
                                     var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                     $(".persistent_data").prepend(notice_box)
                                     var arr = arrlist
                                     localStorage.setItem("arr",JSON.stringify(arr))
                               } 
                            })
                            var li = templates.render("choose_search",{arr:arrlis})
                            $(".all-messge-show").html(li)
                            $(".all-messge-show").on("click","a",function(e){
                                var arrlist = JSON.parse(localStorage.getItem("arr"))
                                var id  = $(this).attr("data_id")
                                var data_index = arrlis.filter(function(item){
                                     if(item.recipient_id ==id){
                                         return item
                                     }
                                })
                                var name = data_index[0].name
                                var _href = data_index[0].href
                                var short_name = data_index[0].short_name
                                var avatar = data_index[0].avatar
                                var send_id = id 
                                var mes = data_index[0].content
                                var time_stamp = new Date().getTime()
                                var time = server_events.tf(time_stamp)
                                if(arrlist == null){
                                    var arrlist = []
                                    arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,"",short_name,time_stamp))
                                    var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                    $(".persistent_data").prepend(notice_box)
                                    var arr = arrlist
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                  }else{
                                    var data_index = arrlist.filter(function(item){
                                        return  item.send_id == send_id
                                     })
                                    
                                     if(data_index.length==0){
                                        arrlist.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,"",short_name,time_stamp))
                                     }
                                     var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                     $(".persistent_data").prepend(notice_box)
                                     var arr = arrlist
                                     localStorage.setItem("arr",JSON.stringify(arr))
                               } 
                            })
                       }else{
                          $(".group-chat").hide()
                          $(".person-chat").hide()
                       }
                    }
                })
                $(".search-top-icon").on("click",function(data){
                    $(this).hide()
                })
                $('body').click(function(e) {
                    if(e.target.id != 'global_search')
                       if ( $('.search-top-icon').is(':visible') ) {
                          $(".search-top-icon").hide();
                       }
                 })
            }
         })
    
    })
    return exports;
}())
if (typeof module !== 'undefined') {
    module.exports =  message_body;
}