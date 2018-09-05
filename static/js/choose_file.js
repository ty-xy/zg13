var chooseFile = (function () {
    var exports = {};
    var people_dict;
    $("body").ready(function (){
       //选择群组
        function commonTotal (data){
            var rendered = $(templates.render('choose',{ data:data.streams_dict}));
            $(".modal-log-content").html(rendered)
        }
        function all_check(id){
            var lengths = $(".input-box-list").find("input[type=checkbox]:checked").length
            var num_times = people_dict.get(id).length
            if(lengths===num_times){
                $(".checkbox-inputs").prop("checked",true)
            }
        }
        exports.choosePeople = function(){
            $(".modal-log").show()
            channel.get({
                url:"json/zg/stream/recipient/data",
                success:function(data){
                    var obj = {}
                    var o1 = {}
                    var datakeylist = data.streams_dict
                    commonTotal(data)
                    var lid = $(".choose-nav-left").children()
                    people_dict = new Dict({fold_case: true});
                    _.each(data.streams_dict, function (val, key) {
                        people_dict.set(key, val);
                    });
                  var value = people_dict.get("345")
                  var has = people_dict.has("345")
                  var keys = people_dict.keys()
                  var values = people_dict.values()
                  var items = people_dict.items() 
                  var num_items = people_dict.num_items()
                  var is_empty=people_dict.is_empty()
                  $(".choose-nav-left").on("click",".box-start-list",function(e){
                       var checkbox = $(this).find("input")
                       var input_key = $(this).attr("input-key")
                       if(checkbox.is(':checked')){
                            checkbox.prop("checked",false)
                       }else{
                            checkbox.prop("checked",true)
                            var value = data.streams_dict[input_key]
                            value.forEach(function(val,index,arr){
                                     val.did=input_key
                                     o1[val.id] = val 
                            })
                            obj = $.extend(obj,o1)
                            var html = templates.render("choose_person",{datalist:obj})
                            $(".box-right-list").html(html)
                            var length = $(".box-right-list").children().length
                            var text = "选中"+"("+length+")"
                            $(".already-choose").html(text)
                       }
                  })
                  //右边删除
                  $(".box-right-list").on("click",".box_list_right",function(e){
                        var data_id = $(this).attr("data_id")
                        var key_data = $(this).attr("key-data")
                        $(this).remove()
                        var length = $(".box-right-list").children().length
                        var text = "选中"+"("+length+")"
                        $(".already-choose").html(text)
                        var checkbox;
                        if($(".input-box-list[input-key="+data_id+"]").length!==0){
                            checkbox = $(".input-box-list[input-key="+data_id+"]").find("input")
                        }else{
                            checkbox = $(".choose-list-box[data-key="+key_data+"]")
                            delete(obj[key_data])

                        }
                        if(checkbox.is(":checked")){
                            checkbox.prop("checked",false)
                            $(".checkbox-inputs").prop("checked",false)
                        }
                        
                  })
                  //全选
                  $(".choose-nav-left").on("click",".checkbox-input",function(e){
                        if($(this).is(":checked")){
                            $(".input-box-list").find("input").prop("checked",true)
                            var arr = [];
                            for(var i in datakeylist){ 
                               arr=arr.concat(datakeylist[i]);
                            }
                            var objs= {};
                            // console.log(arr)
                            arr = arr.reduce(function(item,next){
                                objs[next.id] ? '' : objs[next.id] = next && item.push(next);
                                return item;
                            },[])
                            _.each(arr,function(val,key){
                                objs[val.id] = val
                                val.did=1
                            })
                            obj = $.extend(obj,objs)
                            var html = templates.render("choose_person",{datalist:obj})
                            $(".box-right-list").html(html)
                            var text = "选中"+"("+arr.length+")"
                            $(".already-choose").html(text)
                        }else{
                            $(".input-box-list").find("input").prop("checked",false)
                            $(".box-right-list").empty()
                            var text = "选中(0)"
                            $(".already-choose").html(text)
                        }
                  })
                  //点击清空
                  $(".choose-right-list").on("click",".button-right-clear",function(e){
                        $(".box-right-list").empty()
                        $(".input-box-list").find("input").prop("checked",false)
                        var text = "选中(0)"
                        $(".already-choose").html(text)
                        $(".checkbox-input").prop("checked",false)
                        $(".checkbox-inputs").prop("checked",false)
                        obj={}
                  })
                  //点击下级
                  $(".choose-nav-left").on("click",".next-right",function(e){
                       e.preventDefault()
                       e.stopPropagation()
                       var id = $(this).attr('button-key')
                       var choose_list  = data.streams_dict[id]
                       choose_list.forEach(function(val,i){
                            if(obj[val.id] !== undefined){
                                val.checked = true
                            }else{
                                val.checked = false
                            }
                       })
                       var li = $(templates.render('choose_people',{
                           datalists:choose_list,
                           channels:id
                       }));
                       $(".choose-nav-left").html(li)
                       all_check(id)
                       //右边和左边对应
                       var value = people_dict.get(id)
                       $(".box-list-left").on("click",function(e){
                           var inputs= $(this).find("input")
                           if(inputs.is(":checked")){
                               inputs.prop("checked",false)
                               $(".checkbox-inputs").prop("checked",false)
                            }else{
                                inputs.prop("checked",true)
                                all_check(id)
                                var datalist = {}
                                var datalists = {}
                                 datalist.avatarurl =  $(this).closest(".input-box-list").attr("avatar")
                                 datalist.id= inputs.attr("data-key")
                                 datalist.fullname=$(this).find("span").text()
                                 datalist.did = $(".select-choose").find("span").text()
                                 datalists[inputs.attr("data-key")] = datalist
                                 obj = $.extend(obj,datalists)
                                var html = templates.render("choose_person",{datalist:obj})
                                 $(".box-right-list").html(html)
                                var length = $(".box-right-list").children().length
                                var text = "选中"+"("+length+")"
                                $(".already-choose").html(text)
                           }
                       })
                         //点击选择热人员
                        $(".choose-nav-left").on("click",".back-choose",function(e){
                            $(".choose-nav-left").children().remove()
                            $(".choose-nav-left").html(lid)
                        }) 
                       // 点击下级的全选
                       $(".checkbox-inputs").on("click",function(e){
                              if($(this).is(":checked")){
                                $(".box-choose-lefts").find("input").prop("checked",true)
                                
                              }else{
                                $(".box-choose-lefts").find("input").prop("checked",false)
                              }
                       })
                  })
                 
                  $(".button-cancel").on("click",function(e){
                     $(".modal-log").hide()
                     $(".modal-log-content").empty()
                  })
                }
              
            })
        }
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = chooseFile
}