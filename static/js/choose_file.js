var choose_file = (function () {
    var exports = {};
    // upload_try.feature_check($("#file-choose #attach_file"));
    $("#file-choose").on("click", "#attach_files", function (e) {
        e.preventDefault();
        $("#file-choose #file_inputs").trigger("click");
    });
    function make_upload_absolute(uri) {
        if (uri.indexOf(compose.uploads_path) === 0) {
            // Rewrite the URI to a usable link
            console.log(compose.uploads_path,compose.uploads_domain)
            return compose.uploads_domain + uri;
        }
        return uri;
    }
    var uploadFinished = function (i, file, response) {
        if (response.uri === undefined) {
            return;
        }
        console.log(response,i,file)
        var split_uri = response.uri.split("/");
        var filename = split_uri[split_uri.length - 1];
        console.log(filename)
        // Urgh, yet another hack to make sure we're "composing"
        // when text gets added into the composebox.
        if (!compose_state.composing()) {
            compose_actions.start('stream');
        }

        var uri = make_upload_absolute(response.uri);
         
        // if (i === -1) {
        //     // This is a paste, so there's no filename. Show the image directly
        //     console.log(1)
        //     var pasted_image_uri = "[pasted image](" + uri + ")";
        //     compose_ui.insert_syntax_and_focus(pasted_image_uri, textarea);
        // } else {
        //     // This is a dropped file, so make the filename a link to the image
        //     console.log(2)
        //     var filename_uri = "[" + filename + "](" + uri + ")";
        //     compose_ui.insert_syntax_and_focus(filename_uri, textarea);
        // }
        // compose_ui.autosize_textarea();

        // maybe_hide_upload_status();

        // In order to upload the same file twice in a row, we need to clear out
        // the file input element, so that the next time we use the file dialog,
        // an actual change event is fired. IE doesn't allow .val('') so we
        // need to clone it. (Taken from the jQuery form plugin)
        if (/MSIE/.test(navigator.userAgent)) {
            $('#' + file_inputs).replaceWith($('#' + file_input).clone(true));
        } else {
            $('#' + file_inputs).val('');
        }
    };
    $("#file-choose").filedrop({
        url: "/json/user_uploads",
        fallback_id: 'file_inputs',  // Target for standard file dialog
        paramname: "file",
        maxfilesize: page_params.maxfilesize,
        data: {
            // the token isn't automatically included in filedrop's post
            csrfmiddlewaretoken: csrf_token,
        },
        raw_droppable: ['text/uri-list', 'text/plain'],
        // drop: drop,
        // progressUpdated: progressUpdated,
        // error: uploadError,
        uploadFinished: uploadFinished,
    });
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = choose_file
}