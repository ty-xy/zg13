var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            var html = templates.render("attendance_box");
            $(".app").after(html);
            $(".attendance_md").on("click",".attendance_close",function(){
                $(".attendance_md").remove()
           })
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
           //点击考勤组的样式
           $(".attendance_mangement").on('click',function(){
               $(this).addClass("high_light").siblings().removeClass("high_light")
               var html = templates.render("attendance_management");
               $(".attendance_ctn").html(html)
           })
           //新增加项目
           $(".attendance_ctn").on('click',".new_attendance",function(){
                var html = templates.render("attendance_team");
                $(".attendance_ctn").html(html)
                //选择日期
                $(".button-common").datetimepicker({
                    language:"zh-CN",  
                    weekStart: 1,
                    todayBtn:  0,
                    autoclose: 1,
                    todayHighlight: 1,
                    startView: 1,
                    minView: 0,
                    showHours : true,
                    // minuteStep:1,
                    maxView: 1,
                    forceParse: 0,
                    format:'hh:ii',
                   })
                //接入地点
                $(".kaoqin-era").on('click',function(){
                    $('#map-area').show()
                    $("#map-area").on('click',".attendance-map-close",function(){
                        $('#map-area').hide()
                    })
                })
                $(".button-common-date").on('click',function(){
                    $(".kaoqin-date-choose").show()
                    $(".attendance_close_week").on('click',function(){
                        $(".kaoqin-date-choose").hide()
                    })
                })
                $(".kaoqin-date-area").on('click',function(){
                    $(".kaoqin-date-choose").hide()
                })
                
           })
           $(".attendance_ctn").on('click',".back_attendance",function(){
                var html = templates.render("attendance_management");
                $(".attendance_ctn").html(html)
           })
        })
      
          
    });  
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
