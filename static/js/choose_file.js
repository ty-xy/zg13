var chooseFile = (function () {
    var exports = {};
    var people_dict;
    var person_dict;
    $("body").ready(function (){
       //选择群组
        function commonTotal (data){
            var rendered = $(templates.render('choose',{data:data.streams_dict}));
            $(".modal-log-content").html(rendered)
        }
        function all_check(id){
            var lengths = $(".input-box-list").find("input[type=checkbox]:checked").length
            var num_times = people_dict.get(id).length
            if(lengths===num_times){
                $(".checkbox-inputs").prop("checked",true)
            }
        }
        function cancel (){
            $(".button-cancel").on("click",function(e){
                $(".modal-log").hide()
                $(".modal-log-content").empty()
             })
        }
        function length () {
            var length = $(".box-right-list").children().length
            var text = "选中"+"("+length+")"
            $(".already-choose").html(text)
        }
        function common_content(value,obj,name){
            var o1 = {}
            value.forEach(function(val,index,arr){
                val.did=name
                o1[val.id] = val 
            })
            obj = $.extend(obj,o1)
            o1={}
            var html =$(templates.render("choose_person",{datalist:obj}))
            $(".box-right-list").html(html)
            length()
        }
        function next_common(choose_list,name,obj,lid) {
            choose_list.forEach(function(val,i){
                if(obj[val.id] !== undefined){
                    val.checked = true
                }else{
                    val.checked = false
                }
            })
            var li = $(templates.render('choose_people',{
                datalists:choose_list,
                channels:name
            }));
            $(".choose-nav-left").html(li)
            //点击下级全选
            $(".checkbox-inputs").on("click",function(e){
                    var datalists= choose_list.reduce(function(prev, cur){prev[cur.id] = cur; return prev;}, {});
                    if($(this).is(":checked")){
                      $(".box-choose-lefts").find("input").prop("checked",true)
                      obj = $.extend(obj,datalists)
                      var html = templates.render("choose_person",{datalist:obj})
                       $(".box-right-list").html(html)
                    }else{
                      $(".box-choose-lefts").find("input").prop("checked",false)
                      choose_list.forEach(function(val,i){
                          if(obj[val.id] !== undefined){
                             delete(obj[val.id])
                          }
                          var html = templates.render("choose_person",{datalist:obj})
                          $(".box-right-list").html(html)
                      })
                  }
            })
                    //点击选择人员
            $(".choose-nav-left").on("click",".back-choose",function(e){
                $(".choose-nav-left").children().remove()
                $(".choose-nav-left").html(lid)
            }) 
        }
        //选择发送人
        exports.choosePeople = function(func){
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
                //   var value = people_dict.get("345")
                //   var has = people_dict.has("345")
                //   var keys = people_dict.keys()
                //   var values = people_dict.values()
                //   var items = people_dict.items() 
                //   var num_items = people_dict.num_items()
                //   var is_empty=people_dict.is_empty()
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
                            o1={}
                            var html = templates.render("choose_person",{datalist:obj})
                            $(".box-right-list").html(html)
                            var length = $(".box-right-list").children().length
                            var text = "选中"+"("+length+")"
                            $(".already-choose").html(text)
                       }
                  })
                  //点击右边删除
                  $(".box-right-list").on("click",".box_list_right",function(e){
                        var data_id = $(this).attr("data_id")
                        var key_data = $(this).attr("key-data")
                        $(this).remove()
                        console.log(1111)
                        var length = $(".box-right-list").children().length
                        var text = "选中"+"("+length+")"
                        $(".already-choose").html(text)
                        var checkbox;
                        
                        if($(".box-start-list").length>0&&$(".box-start-list[input-key="+data_id+"]").length!==0){
                            checkbox = $(".box-start-list[input-key="+data_id+"]").find("input")
                            console.log(obj)
                            delete(obj[key_data])
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
                                objs[next.id] ? +"" : objs[next.id] = next && item.push(next);
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
                            obj={}
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
                         //点击选择人员
                        $(".choose-nav-left").on("click",".back-choose",function(e){
                            $(".choose-nav-left").children().remove()
                            $(".choose-nav-left").html(lid)
                        }) 
                       // 点击下级全选
                       $(".checkbox-inputs").on("click",function(e){
                              var datalists= choose_list.reduce(function(prev, cur) {prev[cur.id] = cur; return prev;}, {});
                              if($(this).is(":checked")){
                                $(".box-choose-lefts").find("input").prop("checked",true)
                                obj = $.extend(obj,datalists)
                                var html = templates.render("choose_person",{datalist:obj})
                                 $(".box-right-list").html(html)
                              }else{
                                $(".box-choose-lefts").find("input").prop("checked",false)
                                choose_list.forEach(function(val,i){
                                    if(obj[val.id] !== undefined){
                                       delete(obj[val.id])
                                    }
                                    var html = templates.render("choose_person",{datalist:obj})
                                    $(".box-right-list").html(html)
                                })
                            }
                       })
                  })
                 
                  cancel()
                  $(".button-sure").on("click",function(e){
                      func(obj)
                      $(".modal-log").hide()
                      $(".modal-log-content").empty()
                  })
                }
            })
        }
        //选择部门
        exports.chooseTeam = function(func){
           $(".modal-log").show()
           channel.get({
               url:"json/zg/department/list",
              success:function(data){
                  var obj = {}
                  var data= data.department_lists
                  var  datalist= data.reduce(function(prev, cur){prev[cur.id] = cur; return prev;}, {});
                  var li = $(templates.render("choose_channel",{data:datalist}));
                  $(".modal-log-content").html(li)
                  //点击左边右边显示
                  $(".choose-nav-left").on("click",".choose-check",function(e){
                    var id = $(this).attr("inputid")
                    if($(this).is(":checked")){
                        var data_channel = datalist[id]
                        obj[id]= data_channel
                        var render = $(templates.render("choose_personal",{data:obj}))
                        $(".box-right-list").html(render)
                        length()
                     }else{
                        delete(obj[id])
                        var render = $(templates.render("choose_personal",{data:obj}))
                        $(".box-right-list").html(render)
                        length()
                    }
                  })
                  //删除左边的数据
                  $(".box-right-list").on("click",".box_list_right",function(e){
                        var data_id = $(this).attr("key-data")
                        $(this).remove()
                        length()
                        delete(obj[data_id])
                        $("input[inputid="+data_id+"]").prop("checked",false)
                   })
                  //点击清空 
                  $(".choose-right-list").on("click",".button-right-clear",function(e){
                    $(".box-right-list").empty()
                    $(".input-box-list").find("input").prop("checked",false)
                    var text = "选中(0)"
                    $(".already-choose").html(text)
                    $(".checkbox-input").prop("checked",false)
                    obj={}
                 })
                 //点击全选 
                 $(".choose-nav-left").on("click",".checkbox-input",function(e){
                     if($(this).is(":checked")){
                        $(".choose-check").prop("checked",true)
                        obj=$.extend(obj,datalist)
                        var render = $(templates.render("choose_personal",{data:obj}))
                        $(".box-right-list").html(render)
                        length()
                     }else{
                        $(".choose-check").prop("checked",false)
                        $(".box-right-list").empty()
                        length()
                     }
                 })
                 cancel()
                 $(".button-sure").on("click",function(e){
                    func(obj)
                    $(".modal-log").hide()
                    $(".modal-log-content").empty()
                })
              }
           })
        }
        //选择成员
        exports.chooseTeamMember = function(func){
            // var obj = {}
            $(".modal-log").show()
            channel.get({
                url:"json/zg/department/list",
                success:function(data){
                  var obj = {}
                  var dataer= data.department_lists
                  var  datalist= dataer.reduce(function(prev, cur) {prev[cur.name] = cur; return prev;}, {});
                  datalist["未分组"]={id:"none",name:"未分组",num:data.not_department_count}
                  var li = $(templates.render("choose",{data:datalist}));
                  $(".modal-log-content").html(li)
                  var lid = $(".choose-nav-left").children()
                  person_dict = new Dict({fold_case: true});
                  //点击左边右边出现人
                  $(".choose-nav-left").on("click",".choose-check",function(e){
                      var name = $(this).attr("inputid")
                      var id = datalist[name].id
                      var has = person_dict.has(name)
                      if(!has&&id!=="none"){
                        channel.get({
                            url:"/json/zg/department/user/list",
                            data:{department_id:id},
                            success:function(data){
                                if(data.errno==0){
                                    person_dict.set(name,data.not_department_list)
                                    var value = data.user_list
                                    common_content(value,obj,name)
                                }
                            }
                        })
                      }else if (!has&&id=="none"){
                        channel.get({
                            url:"/json/zg/not/department/user",
                            success:function(data){
                                if(data.errno==0){
                                    person_dict.set("未分组",data.not_department_list)
                                    var value = data.not_department_list
                                    common_content(value,obj,name)
                                    console.log(1)
                                }
                            } 
                        })
                      }else{
                        value = person_dict.get(name)
                        common_content(value,obj,name)
                        console.log(2)
                      }
                  })
                  // 点击清空
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
                       var name = $(this).attr('button-key')
                       var has  = person_dict.has(name)
                       var id = datalist[name].id
                       if(has){
                            var choose_list  = person_dict.get(name)
                            next_common(choose_list,name,obj,lid)
                       }else if(!has&&name=="未分组"){
                            channel.get({
                                url:"/json/zg/not/department/user",
                                success:function(data){
                                    if(data.errno==0){
                                        person_dict.set("未分组",data.not_department_list)
                                        var choose_list = data.not_department_list
                                        next_common(choose_list,name,obj,lid)
                                    }
                                } 
                            })
                        }else {
                            channel.get({
                                url:"/json/zg/department/user/list",
                                data:{department_id:id},
                                success:function(data){
                                    var choose_list = data.user_list
                                    next_common(choose_list,name,obj,lid)
                                }
                            })
                      }
                  })
                 //点击右边删除
                 $(".box-right-list").on("click",".box_list_right",function(e){
                    var data_id = $(this).attr("data_id")
                    var key_data = $(this).attr("key-data")
                    $(this).remove()
                    var length = $(".box-right-list").children().length
                    var text = "选中"+"("+length+")"
                    $(".already-choose").html(text)
                    $(".checkbox-input").prop("checked",false)
                    var checkbox;
                    if($(".box-start-list").length>0&&$(".box-start-list[input-key="+data_id+"]").length!==0){
                        checkbox = $(".box-start-list[input-key="+data_id+"]").find("input")
                        delete(obj[key_data])
                    }else{
                        checkbox = $(".choose-list-box[data-key="+key_data+"]")
                        delete(obj[key_data])
                    }
                    if(checkbox.is(":checked")){
                        checkbox.prop("checked",false)
                        $(".checkbox-inputs").prop("checked",false)
                    }
                  })
                 //点击全选
                 $(".choose-nav-left").on("click",".checkbox-input",function(e){
                    var that = $(this)
                    channel.get({
                        url:"json/zg/stream/recipient/data",
                        success:function(data){
                            var datakeylist = data.streams_dict
                            if(that.is(":checked")){
                                $(".input-box-list").find("input").prop("checked",true)
                                var arr = [];
                                for(var i in datakeylist){ 
                                   arr=arr.concat(datakeylist[i]);
                                }
                                var objs= {};
                                // console.log(arr)
                                arr = arr.reduce(function(item,next){
                                    objs[next.id] ? +"" : objs[next.id] = next && item.push(next);
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
                                obj={}
                                var text = "选中(0)"
                                $(".already-choose").html(text)
                            }
                        }
                    })
                })
                  cancel()
                  $(".button-sure").on("click",function(e){
                    func(obj)
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