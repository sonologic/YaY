<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8">
<title>jQuery File Upload Example</title>
</head>
<body>
<input id="fileupload" type="file" name="files[]" multiple>
<div id="progress"></div>
<script src="../js/jquery.js"></script>
<script src="../js/jquery.ui.widget.js"></script>
<script src="../js/jquery.iframe-transport.js"></script>
<script src="../js/jquery.fileupload.js"></script>
<script>
$(function () {
    $('#fileupload').fileupload({
        dataType: 'json',
        url: 'upload.php',
        done: function (e, data) {
            for(var i=0;i<data.result.length;i++) {
                
                console.log('processing');
                console.log(data.result[i]);
                if(data.result[i].error==0) {
                    $("#progress").append(data.result[i].type+': '+data.result[i].name + ' ('+
                                          data.result[i].size+')<br/>');
                } else {
                    $("#progress").append(data.result[i].name + ': '+data.result[i].msg+'<br/>');
                }
                
                
            }
        },
        progress: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            Console.log(progress);
        }
    });
});
</script>
</body> 
</html>