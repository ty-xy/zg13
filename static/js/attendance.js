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
                var firstDay = 1;
                var lastDay = 30;
                for(var i=1;i<lastDay;i++){
                    arr.push(i)
                }
                var calendar_box = templates.render("calendar_box",{arr:arr});
                $(".attendance_ctn").append(calendar_box);

            })
            //返回到管理界面
            $(".attendance_box").on("click",".calendar_return",function(){
                $(".attendance_ctn").children().remove();
                var attendance_all = templates.render("attendance_all")
                $(".attendance_ctn").append(attendance_all);
                console.log("iqwehqowbej123123123123123123")
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
