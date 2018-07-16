var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            var html = templates.render("attendance_box");
            $(".app").after(html);
            $(".attendance_md").on("click",".attendance_close",function(){
                $(".attendance_md").remove()
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
    
