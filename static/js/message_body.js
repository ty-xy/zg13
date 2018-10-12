var message_body = (function(){
    var exports = {};
    $("body").ready(function(){
        arr = JSON.parse(localStorage.getItem("arr"))
        if(arr == null ){
            arr = []
            function f(x,y){
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
                                // var count = unread.num_unread_for_stream(y);
                                // var lis = $(".only_tip[stream_id="+y+"]").parent()
                                // stream_list.update_count_in_dom(lis, count);
                                arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream,short_name,time_stamp))
                                console.log(arr)
                                localStorage.setItem("arr",JSON.stringify(arr))
                            }
                        })
                    }
                })
                 
             //    console.log(opts.msg_list.get_row(y))
             }
             unread.get_counts().stream_count.each(f)
             
        }
       
    })
    return exports;
}())
if (typeof module !== 'undefined') {
    module.exports =  message_body;
}