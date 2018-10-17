$(function () {
    // NB: this file is included on multiple pages.  In each context,
    // some of the jQuery selectors below will return empty lists.
    $.extend($.validator.messages,{
        email: "请输入正确格式的邮箱格式",
        required: "必选字段",
    })
    var password_field = $('#id_password, #id_new_password1');
    $.validator.addMethod('password_strength', function (value) {
        return common.password_quality(value, undefined, password_field);
    }, function () {
        return common.password_warning(password_field.val(), password_field);
    });

    function highlight(class_to_add) {
        // Set a class on the enclosing control group.
        return function (element) {
            $(element).closest('.control-group')
                .removeClass('success error')
                .addClass(class_to_add);
        };
    }
    $.validator.addMethod("mobile", function(value, element) {
        var length = value.length;
        var mobile = /^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/
        return this.optional(element) || (length == 11 && mobile.test(value));
    }, "手机号码格式错误");
    $.validator.addMethod("zipCode", function(value, element) {
        var tel = /^[0-9]{4}$/;
        return this.optional(element) || (tel.test(value));
    }, "验证码格式错误(四位有效数字)");

    $('#registration, #password_reset,#send_confirm,#reset_password').validate({
        // rules: {
        //     password:      'password_strength',
        //     new_password1: 'password_strength',
        // },
        errorElement: "p",
        errorPlacement: function (error, element) {
            // NB: this is called at most once, when the error element
            // is created.
            element.next('.help-inline.alert.alert-error').remove();
            if (element.next().is('label[for="' + element.attr('id') + '"]')) {
                // console.log(element.next())
                error.insertAfter(element.next()).addClass('help-inline alert alert-error');
            } else {
                error.insertAfter(element).addClass('help-inline alert alert-error');
                // console.log(element)
            }
        },
        highlight:   highlight('error'),
        unhighlight: highlight('success'),
    });

    password_field.on('change keyup', function () {
        // Update the password strength bar even if we aren't validating
        // the field yet.
        common.password_quality($(this).val(), $('#pw_strength .bar'), $(this));
    });

    $("#send_confirm").validate({
        errorElement: "div",
        rules:{
            fullname:{
                required: true,
                regUserName: true,
                minlength: 4,
                maxlength: 10
            }
        },
        errorPlacement: function (error) {
            // console.log(error,1)
            $('.email-frontend-error').empty();
            $("#send_confirm .alert.email-backend-error").remove();
            error.appendTo(".email-frontend-error").addClass("text-error");
        },
        success: function () {
            $('#errors').empty();
        },
    });
    $("#full_name").validate({
        rules:{
            name:"required",
            fullname:{
                required:true,
            }
        }
    })
    $(".register-page #email, .login-page-container #id_username").on('focusout keydown', function (e) {
        // check if it is the "focusout" or if it is a keydown, then check if
        // the keycode was the one for "enter" (13).
        if (e.type === "focusout" || e.which === 13) {
            $(this).val($.trim($(this).val()));
        }
    });

    var show_subdomain_section = function (bool) {
        var action = bool ? "hide" : "show";
        $("#subdomain_section")[action]();
    };

    $("#realm_in_root_domain").change(function () {
        show_subdomain_section($(this).is(":checked"));
    });

    $("#login_form").validate({
        errorClass: "text-error",
        wrapper: "div",
        submitHandler: function (form) {
            $("#login_form").find('.loader').css('display', 'inline-block');
            $("#login_form").find("button .text").hide();
            var x = $("#id_username").val()
            y = x + '@zulip.com'
            $("#id_username").val(y)
            form.submit();
        },
        invalidHandler: function () {
            // this removes all previous errors that were put on screen
            // by the server.
            $("#login_form .alert.alert-error").remove();
        },
    });

    function check_subdomain_avilable(subdomain) {
        var url = "/json/realm/subdomain/" + subdomain;
        $.get(url, function (response) {
            if (response.msg !== "available") {
                $("#id_team_subdomain_error_client").html(response.msg);
                $("#id_team_subdomain_error_client").show();
            }
        });
    }

    var timer;
    $('#id_team_subdomain').on("keydown", function () {
        $('.team_subdomain_error_server').text('').css('display', 'none');
        $("#id_team_subdomain_error_client").css('display', 'none');
        clearTimeout(timer);
    });
    $('#id_team_subdomain').on("keyup", function () {
        clearTimeout(timer);
        timer = setTimeout(check_subdomain_avilable, 250, $('#id_team_subdomain').val());
    });
    //检测是否已注册
    $(".phone_number").on("blur",function(){
        var phone = $(this).val()
        var obj = {
            phone:phone
        }
        if(phone){
            $.ajax({
                type:"GET",
                url:"/api/v1/zg/verification/user",
                contentType:"application/json",
                data:obj,
                success:function(res){
                    if(res.errno == 1){
                        $("#phone_repeat").show()
                    }else{
                        $("#phone_repeat").hide()
                    }
                }
            })
        }
    })
    //获取验证码
    $("#send_confirm").on("click",".get_verification",function(){
        var countdown=60;
        function sendmsg(){
            if(countdown==0){
                $(".get_verification").attr("disabled",false);
                $(".get_verification").val("获取验证码");
                countdown=60;
                return false;
            }
            else{
                $(".get_verification").attr("disabled",true);
                $(".get_verification").val(countdown+"s");
                countdown--;
            }
            setTimeout(function(){
                sendmsg();
            },1000);
        }
        if($(".phone_number").attr("aria-invalid")=='false'){
            sendmsg()
        }else{
            console.log("获取失败")
            return
        }
        var sms = $(".phone_number").val()
        var type = "register"
        var obj = {
            sms:sms,
            type:type
        }
        $.ajax({
            type:"GET",
            contentType:"application/json",
            url:"/api/v1/zg/register/sms",
            data:obj,
            success:function(){
                console.log("-------------______---success")
            }  
        })
    })

    //获取验证码
    $("#reset_password").on("click",".get_verification",function(){
        console.log("000000")
        var countdown=60;
        function sendmsg(){
            if(countdown==0){
                $(".get_verification").attr("disabled",false);
                $(".get_verification").val("获取验证码");
                countdown=60;
                return false;
            }
            else{
                $(".get_verification").attr("disabled",true);
                $(".get_verification").val(countdown+"s");
                countdown--;
            }
            setTimeout(function(){
                sendmsg();
            },1000);
        }
        console.log($(".phone_number").attr("aria-invalid"))
        if($(".phone_number").attr("aria-invalid")=='false'){
            sendmsg()
        }else{
            return
        }
        var sms = $(".phone_number").val()
        var type = "new_password"
        var obj = {
            sms:sms,
            type:type
        }
        $.ajax({
            type:"GET",
            contentType:"application/json",
            url:"/api/v1/zg/register/sms",
            data:obj,
            success:function(){
                console.log("123")
            }  
        })
    })
    // $(document).ready(function() {
//     // alert("-___--___")
//     console.log($("#reset_password"))
//     $("#reset_password").ajaxForm(function(data){
//           alert("返回的值是" + data);
//           console.log(data)
//     });		    
// });
// $(document).ready(function() {
//     console.log($('#send_confirm'))
//     $('#send_confirm').ajaxForm({
//         target: '#output'
//     });
// });
    //登陆页小眼睛
    $("#login_form").on("click",".eyeclose",function(){
        if($(this).prev().attr("type")){
            $(this).prev().attr("type","");
            $(this).removeClass("icon-yanjingguan").addClass("icon-yanjingkai")
        }else{
            $(this).prev().attr("type","password");
            $(this).removeClass("icon-yanjingkai").addClass("icon-yanjingguan")
        }
    })
    //注册页小眼睛
    $("#send_confirm").on("click",".eyeclose",function(){
        if($(this).prev().attr("type")){
            $(this).prev().attr("type","");
            $(this).removeClass("icon-yanjingguan").addClass("icon-yanjingkai")
        }else{
            $(this).prev().attr("type","password");
            $(this).removeClass("icon-yanjingkai").addClass("icon-yanjingguan")
        }
    })
});
