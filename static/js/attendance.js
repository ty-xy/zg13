var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            var html = templates.render("attendance_box");
            $(".app").after(html);
            var attendance_all = templates.render("attendance_all")
            $(".attendance_ctn").append(attendance_all)
            //关闭考勤
            $(".attendance_close").on("click",function(){
                $(".attendance_md").hide();
            })
            //查看考勤日历
            $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                $(".attendance_ctn").children().remove();
                var arr=[]
                var firstDay = 7;
                var lastDay = 30;
                if(firstDay==1){
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==2){
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==3){
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==4){
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==5){
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==6){
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }else if(firstDay==7){
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay;i++){
                        arr.push(i)
                    }
                }
                var calendar_box = templates.render("calendar_box",{arr:arr});
                $(".attendance_ctn").append(calendar_box);

            })
            //返回到管理界面
            $(".attendance_box").on("click",".calendar_return",function(){
                $(".attendance_ctn").children().remove();
                var attendance_all = templates.render("attendance_all")
                $(".attendance_ctn").append(attendance_all);
                //查看考勤日历
                $(".attendance_bottom_ctn").on("click",".attendance_bottom_calendar",function(){
                    $(".attendance_ctn").children().remove();
                    var calendar_box = templates.render("calendar_box");
                    $(".attendance_ctn").append(calendar_box);
                })
            })
        })
        
             
    });  
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = attendance ;
    }
