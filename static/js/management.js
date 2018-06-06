    var management = (function () {
    var exports = {};
    $(function () {
        $(".generate_log").on("click",function(e){
            e.preventDefault();
            e.stopPropagation();
            $(".create_generate_log").show();
        })
        // $("#management_ctn").on("click",function(e){
        //     // console.log("修改成功")
        //     // e.preventDefault();
        //     e.stopPropagation();
        //     $(".create_generate_log").hide();
        // })
        $(".create_daily").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".create_weekly").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".create_monthly").on("click",function(e){
            $(this).addClass("default_border").parent().siblings().children().removeClass("default_border");
        })
        $(".new_task_title").on("click",function(e){
            $("#search_query").val("");
        })
        $(".new_task_save").on("click",function(e){
            let inttitle = $(".new_task_title").val();
            let inttime = $(".new_task_date").val();
            $.ajax({
                type:"GET",
                url:"",
                data:{
                    "inttitle":inttitle,
                    "inttime":inttime
                },
                success:function(res){

                },
                error:function(rej){

                }
            })
        })
        $(".new_task_cancel").on("click",function(e){
            $(".new_task_title").val("");
            $(".new_task_date").val("")
        })

        $(".add_ctn").on("click",function(e){
            console.log("任务执行了")
            $(".taskdetail_md").show();
        })
        $(".taskdetail_md").on("click",function(e){
            e.stopPropagation();
            e.preventDefault();
            $(".taskdetail_md").hide();
        })
        $(".taskdetail_box").on("click",function(e){
            e.stopPropagation();
            // e.preventDefault();
            console.log(":1231")
        })
        $(".taskdetail_close").on("click",function(e){
            $(".taskdetail_md").hide();
        })
        //点击打开周报
        // $("#weekly").on("click",function(e){
        //     var zjson={
        //         d1:"这是一个秋天",
        //         d2:"风儿那么缠绵"
        //     }
        //     $(".management_siber").html("<div>"+zjson.d1+zjson.d2+"</div>")
        //     $.ajax({
        //         type:"",
        //         url:"",
        //         success:function(data){

        //         }
        //     })
        //     $(".management_set").show();
        // })
        // //点击关闭
        // $(".close_management_set").on("click",function(){
        //     $(".management_set").fadeOut();
        // })
        //拖拽效果
        // $(".management_set").on("mousedown",function(e){
        //     var x =parseInt(e.pageX - $(".management_set").offset().left);
        //     var y =parseInt(e.pageY - $(".management_set").offset().top); 
        //     $(".management_set").bind("mousemove",function(ev){
        //         var ox = ev.pageX - x;
        //         var oy = ev.pageY-y;
        //         $(".management_set").css({
        //             left:ox+"px",
        //             top:oy+"px"
        //         })
        //     })
        //     $(".management_set").on("mouseup",function(e){
        //         $(this).unbind("mousemove");
        //     })
        // })
    //初始化日历
	var mySchedule = new Schedule({
		el: '#schedule-box',
		//date: '2018-9-20',
		clickCb: function (y,m,d) {
			document.querySelector('#h3Ele').innerHTML = '日期：'+y+'-'+m+'-'+d	
		},
		nextMonthCb: function (y,m,d) {
			document.querySelector('#h3Ele').innerHTML = '日期：'+y+'-'+m+'-'+d	
		},
		nextYeayCb: function (y,m,d) {
			document.querySelector('#h3Ele').innerHTML = '日期：'+y+'-'+m+'-'+d	
		},
		prevMonthCb: function (y,m,d) {
			document.querySelector('#h3Ele').innerHTML = '日期：'+y+'-'+m+'-'+d	
		},
		prevYearCb: function (y,m,d) {
			document.querySelector('#h3Ele').innerHTML = '日期：'+y+'-'+m+'-'+d	
		}
	});
    //初始化日历
    $(".new_task_date").on("click",function(e){
        // console.log("hello2")
            // $("#prevYear").before("<i class='iconfont icon-guanbiUI close_calendar'></i>")
            $("#schedule-box").show();
        })
    });

    // $(".close_calendar").on("click",function(e){
    //     $("#schedule-box").hide();
    // })

    //label图标切换
    // $("label").on("click",function(e){
    //     var taskdetail_s = $("#taskdetail_check");
    //     console.log("hello")
    //     console.log(taskdetail_s)
    // })
    
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
