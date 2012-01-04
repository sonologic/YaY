/**
 * Copyright (c) 2012, "Koen Martens" <gmc@sonologic.nl>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of Sonologic nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL SONOLOGIC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *  
 */

function loading() {
    $("#loading").show();
}

function loadingDone() {
    $("#loading").hide();
}

function editAudio(id) {    
    $("#edit .audioid").text(id);
    $("#edit .waveform").attr('src','images/loading_waveform.png');
    $("#edit .waveform").attr('src','upload/waveform.php?id='+id);
    
    $("#edit").show();
    
    $("#edit .properties").empty();
    
    loading();
    $.getJSON('upload/load.php?c=audio&id='+id,function(data) {
        
        /*
        $("#edit input[name='title']").val('');
        $("#edit input[name='production']").val('aa');
        $("#edit .teaser").empty();
        $("#edit .shownotes").empty();
        
        $("#edit input[name='title']").val(data.title);
        $("#edit input[name='production']").val(data.artist);
        $("#edit textarea[name='teaser']").text(data.teaser);
        $("#edit textarea[name='shownotes']").text(data.shownotes);
        */
       data.collection='audio';
       fillForm('#edit form',data);
        for(var key in data) {
       
            $("#edit .properties").append('<div>'+key+" => "+data[key]+"</div>");
        
        }
        if(data.transcoded && data.transcoded==1) {
            $("#edit .player").attr('src','upload/uploads/'+id+'.flac');
            loadingDone();
        } else {
            transcode(id);
        }
        
    });
    
}

function editShow(id) {
    $("#editshow").show();
    if(id!='*')
        $.getJSON('upload/load.php?c=show&id='+id,function(data) {
            data.collection='show';
            fillForm("#editshow form",data);
        })
    else {
        data={_id:'*',collection:'show'};
        fillForm("#editshow form",data);
    }
}

function fillForm(selector,data) {
    console.log('fillForm('+selector+','+data+')');
    
    $(selector+" input[type='text']").each(function(index) {
        var name=$(this).attr('name'); 
        if(data[name]) {
            $(this).val(data[name]);
        } else {
            $(this).val('');
        }
    });
    
    $(selector+" input[type='hidden']").each(function(index) {
        var name=$(this).attr('name'); 
        if(data[name]) {
            $(this).val(data[name]);
        } else {
            $(this).val('');
        }
    });
    
    $(selector+" textarea").each(function(index) {
        var name=$(this).attr('name');
        if(data[name]) {
            $(this).text(data[name]);
        } else {
            $(this).empty();
        }
    });
    
    $(selector+" select").each(function(index) {
        var name=$(this).attr('name');
        console.log(name);
        $(selector+" select[name='"+name+"'] option").removeAttr('selected');
        if(data[name]) {
            console.log('select '+data[name]);
            console.log(selector+" selet[name='"+name+"'] option[value='"+data[name]+"']");
            $(selector+" select[name='"+name+"'] option[value='"+data[name]+"']").attr('selected','selected');
        }
    });
}

function updateShowList() {
    $("#showlist").dataTable().fnClearTable();
    $('#showlist').dataTable( {
        'bDestroy': true,
        "sAjaxSource": 'upload/load.php?c=show&aa=1&f=_id,title,artist,teaser'
    } );    
}

function updateEpisodeList() {
    $("#episodelist").dataTable().fnClearTable();
    $('#episodelist').dataTable( {
        'bDestroy': true,
        "sAjaxSource": 'upload/load.php?c=episode&aa=1&f=_id,data,title'
    } );    
}

function editEpisode(id) {
    $("#editepisode").show();
    if(id!='*')
        $.getJSON('upload/load.php?c=episode&id='+id,function(data) {
            data.collection='episode';
            fillForm("#editepisode form",data);
        })
    else {
        data={_id:'*',collection:'episode'};
        fillForm("#editepisode form",data);
    }
}

function showTranscodeProgress() {
                $.getJSON('upload/transcode.php?p=1',function(data) {
                    if(data.progress && data.progress.length)
                        $("#transcodeprogress").text(data.progress)
                    if(data.running==1) {
                        setTimeout("showTranscodeProgress();",100);
                    } else {
                        loadingDone();
                        $("#transcode").hide();
                        $("#transcodeprogress").text('');
                        var id=$("#edit form input[name='_id']").val();
                        $("#edit .player").attr('src','upload/uploads/'+id+'.flac');
                        editAudio(id);
                    }
                });
    
}

function transcode(id) {
       loading();
       
       $.getJSON('upload/transcode.php?id='+id,function(data) {                      
            if(data.error) {
                loadingDone();
                alert('Error: '+data.error);
            } else {
                $("#transcode").show();
                showTranscodeProgress();
            }
       });
}

$(document).ready(function() {


    $("#mainmenu span").click(function() {
        console.log($(this).data('applet'));
        if($(this).hasClass('inactive')) {
            $(".applet").fadeOut('slow');
            $("#"+$(this).data('applet')).fadeIn('slow');
            $("#mainmenu span").removeClass('active');
            $("#mainmenu span").addClass('inactive');
            $(this).removeClass('inactive');
            $(this).addClass('active');
        }
    });
                
    
    
    $('#audiolist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'upload/load.php?c=audio&aa=1&f=_id,name,type,title,artist'
    } );


    $('#audiolist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editAudio($(tds[0]).text());
    });

    $('#showlist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'upload/load.php?c=show&aa=1&f=_id,title,artist,teaser'
    } );
    
    $('#showlist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editShow($(tds[0]).text());
    });


    $('#episodelist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'upload/load.php?c=episode&aa=1&f=_id,data,title'
    } );
    
    $('#episodelist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editEpisode($(tds[0]).text());
    });



    $('#edit .cancel').click(function() {
        $("#edit").fadeOut('slow'); 
    });

    $('#edit .save').click(function() {
        loading();
        $.post('upload/save.php',$("#edit form").serialize(),function(data) {
            loadingDone();
            $("#edit").fadeOut('slow'); 
            updateShowList();
        });                
    });
    
    $("#editshow .cancel").click(function() {
        $("#editshow").fadeOut('slow'); 
    });
    
    $("#editshow .save").click(function() {
        loading();
        $.post('upload/save.php',$("#editshow form").serialize(),function(data) {
            loadingDone();
            $("#editshow").fadeOut('slow'); 
            updateShowList();
        });       
    });
    
    $("#newshow").click(function() {
        editShow('*');
    });

    $("#editepisode .cancel").click(function() {
        $("#editepisode").fadeOut('slow'); 
    });

    $("#editepisode .save").click(function() {
        loading();
        $.post('upload/save.php',$("#editepisode form").serialize(),function(data) {
            loadingDone();
            $("#editepisode").fadeOut('slow'); 
            updateEpisodeList();
        });       
    });
    
    $("#editepisode form input[name='start']").datetimepicker({dateFormat:'yy-mm-dd'});
    $("#editepisode form input[name='end']").datetimepicker({dateFormat:'yy-mm-dd'});
    
    $("#newepisode").click(function() {
        editEpisode('*');
    });
    
    $("#edit .transcode").click(function() {
       var id=$("#edit form input[name='_id']").val();
       transcode(id);
    });
// page is now ready, initialize the calendar...
/*
                $('#calendar').fullCalendar({
                    // put your options and callbacks here
                    dayClick: function (date, allDay, jsEvent, view) {
                        console.log(date);
                        console.log(allDay);
                        console.log(jsEvent);
                        console.log(view);
                        if(!allDay) {
                            $("#yaydate").text(date.toString());
                            $("#fileevent").show();
                            $("#streamevent").hide();
                            $("#event").show();
                        }
                    }
                });
                
                $("#calendar").fullCalendar('changeView','agendaWeek');
               
                $("select[name='type']").change(function() {
                    console.log('changed '+$("select[name='type']")[0].options.selectedIndex);
                    if($("select[name='type']")[0].options.selectedIndex==1) {
                        $("#fileevent").hide();
                        $("#streamevent").show();
                    } else {
                        $("#fileevent").show();
                        $("#streamevent").hide();                        
                    }
                });
*/
});