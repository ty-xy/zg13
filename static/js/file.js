var fileType= (function () {
    var exports = {};
     exports.type_indicator = function (type) {
        switch (type) {
            case 'jpg':
                return  "<img src='../../static/icons/type_icon/jpg.png' alt='' />";
            // case 'jpeg':
            //     return   <img src='../../static/icons/type_icon/png.png' alt=''/>;
            case 'avi':
                return   "<img src='../../static/icons/type_icon/avi.png' alt='' />";
            case 'moren':
                return   "<img src='../../static/icons/type_icon/moren.png' alt=''/>";
            case 'pdf':
                 return   "<img src='../../static/icons/type_icon/pdf.png' alt='' />";
            case 'png':
                 return   "<img src='../../static/icons/type_icon/png.png' alt='' />";
            case 'xls':
                return   "<img src='../../static/icons/type_icon/xls.png' alt='' />";
            case 'ppt':
                return   "<img src='../../static/icons/type_icon/ppt.png' alt='' />";
            case 'zip':
                return   "<img src='../../static/icons/type_icon/zip.png' alt='' />";
            case 'gif':
                return   "<img src='../../static/icons/type_icon/gif.png' alt='' />";
            case 'rar':
                return   "<img src='../../static/icons/type_icon/rar.png' alt='' />";
            case 'mp3':
                return   "<img src='../../static/icons/type_icon/mp3.png' alt='' />";
            case 'word':
                return   "<img src='../../static/icons/type_icon/word.png' alt=''/>";
            case 'exe':
                return   "<img src='../../static/icons/type_icon/ext.png' alt='' />";
            case 'txt':
                return   "<img src='../../static/icons/type_icon/txt.png' alt='' />";
            case 'svg':
                return   "<img src='../../static/icons/type_icon/svg.png' alt='' />";
            default:
                return   "<img src='../../static/icons/type_icon/png.png' alt='' />";
            }
      }
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = fileType;
}