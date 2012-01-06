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

/**
 * show and hide loading overlay
 */
function loading() {
    $("#loading").show();
}

function loadingDone() {
    $("#loading").hide();
}

/**
 * Convenience wrappers for GET and POST requests, showing the loading overlay.
 */
function yaySON(url,callback) {
    loading();
    $.getJSON(url,function(data) {
        if(callback(data)) {
            loadingDone();
        }
    });
}

function yayPOST(url,post,callback) {
    loading();
    $.post(url,post,function(data) {
        if(callback(data)) {
            loadingDone();
        }
    });
}

/**
 * Helper function to pad number with 0's
 */
function padNum(i,len) {
    var s = i.toString();
    
    while(s.length<len) {
        s='0'+s;
    }
    
    return s;
}

/**
 * Populate and show audio edit dialog
 */
function editAudio(id) {
    $("#edit .audioid").text(id);
    $("#edit .waveform").attr('src','images/loading_waveform.png');
    $("#edit .waveform").attr('src','upload/waveform.php?id='+id);
    
    $("#edit").show();
    
    $("#edit .properties").empty();
    
    loading();
    $.getJSON('upload/load.php?c=audio&id='+id,function(data) {
        $("#edit").data('subject',data);
        data.collection='audio';
        fillForm('#edit form',data);
       
        if(!data.has_flac || data.has_flac!=1) {
            transcode(id,'flac');
            return;
        }

        for(var key in data) {
       
            $("#edit .properties").append('<div>'+key+" => "+data[key]+"</div>");
        
        }
        
        $("#edit .player").attr('src','upload/uploads/'+id+'.'+$("#edit .playerfmt").val());
        loadingDone();

    });
    
}

/**
 * Populate and show show edit dialog.
 * 
 * @param String id the id of the show to edit
 */
function editShow(id) {
    $("#editshow").show();
    if(id!='*')
        $.getJSON('upload/load.php?c=show&id='+id,function(data) {
            data.collection='show';
            fillForm("#editshow form",data);
        })
    else {
        data={
            _id:'*',
            collection:'show'
        };
        fillForm("#editshow form",data);
    }
}

/**
 * Fills a form with data from the provided data object.
 * 
 * @var String selector jquery selector for the form element
 * @var Object data object, field names correspond to the name attribute of the input to copy the field value to
 */
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

/**
 * Reload the show list.
 */
function updateShowList() {
    $("#showlist").dataTable().fnClearTable();
    $('#showlist').dataTable( {
        'bDestroy': true,
        "sAjaxSource": 'upload/load.php?c=show&aa=1&f=_id,title,artist,teaser'
    } );    
}

/**
 * Reload the episode list
 */
function updateEpisodeList() {
    $("#episodelist").dataTable().fnClearTable();
    $('#episodelist').dataTable( {
        'bDestroy': true,
        "sAjaxSource": 'upload/load.php?c=episode&aa=1&f=_id,data,title'
    } );    
}

/**
 * Populate and show episode edit dialog
 * 
 * @param String id the id of the episode to be editted
 */
function editEpisode(id) {
    $("#editepisode").show();
    if(id!='*')
        $.getJSON('upload/load.php?c=episode&id='+id,function(data) {
            data.collection='episode';
            fillForm("#editepisode form",data);
        })
    else {
        data={
            _id:'*',
            collection:'episode'
        };
        fillForm("#editepisode form",data);
    }
}

/**
 * Recurring transcoding progress updater. Schedules itself to repeat until
 * transcoding is complete.
 * 
 * @param String fmt one of 'ogg', 'mp3', 'flac'
 */
function showTranscodeProgress(fmt) {
    $.getJSON('upload/transcode.php?p=1',function(data) {
        if(data.progress && data.progress.length)
            $("#transcodeprogress").text(fmt+': '+data.progress)
        if(data.running==1) {
            setTimeout("showTranscodeProgress('"+fmt+"');",100);
        } else {
            loadingDone();
            $("#transcode").hide();
            $("#transcodeprogress").text('');
            var id=$("#edit form input[name='_id']").val();
            editAudio(id);
            $("#edit .player").attr('src','upload/uploads/'+id+'.'+fmt);
        }
    });
    
}

/**
 * Request transcode process on the server.
 * 
 * Kicks off the showTranscodeProgress(..) updater.
 * 
 * @param String id the id of the audio file to transcode
 * @param String fmt one of 'ogg', 'mp3', 'flac'
 */
function transcode(id,fmt) {
    console.log('transcode '+id+' '+fmt)
    loading();
       
    $.getJSON('upload/transcode.php?id='+id+'&f='+fmt,function(data) {                      
        if(data.error) {
            loadingDone();
            alert('Error: '+data.error);
        } else {
            $("#transcode").show();
            showTranscodeProgress(fmt);
        }
    });
}

/**
 * Reload the option's in the schedule chooser select element (in the 'schedules' applet).
 */
function updateScheduleChooser() {
    $.getJSON('upload/load.php?c=schedule',function(data) {
        console.log(data);
        $("#schedules .schedulechooser").empty();
        for(var i=0;i<data.length;i++) {
            var opt='<option value="'+data[i]._id+'"';
            if($.Storage.get("schedule")==data[i]._id) opt=opt+' selected="selected"';
            opt=opt+'>'+data[i].name+'</option>';
            $("#schedules .schedulechooser").append(opt);
        }
        var opt='<option value="*" ';
        if(data.length==0) opt=opt+'selected="selected"';
        opt=opt+'>New..</option>';
        $("#schedules .schedulechooser").append(opt);
        if(data.length==0) {
            $("#newschedulename").fadeIn('slow');
            $("#createschedule").fadeIn('slow');
        } else {
            $("#newschedulename").fadeOut('slow');
            $("#createschedule").fadeOut('slow');
        }
    });
}

/**
 * Update schedule chooser and fullcalendar view, reloading events.
 * 
 * Looks up the current schedule from persistent storage key 'schedule', which
 * contains the _id of a schedule.
 */
function updateSchedules() {                
    updateScheduleChooser();

    if($.Storage.get("schedule")!=null) {
        $("#calendar").empty();
        yaySON('upload/load.php?c=showevent',function(data) {
            $('#calendar').fullCalendar({
                // put your options and callbacks here
                dayClick: function (date, allDay, jsEvent, view) {
                    console.log(date);
                    console.log(allDay);
                    console.log(jsEvent);
                    console.log(view);
                    if(!allDay) {
                        loading();
                        yaySON('upload/load.php?c=show',function(data) {
                            $("#showchooser").empty();
                            for(var i=0;i<data.length;i++) {
                                var opt='<option value="'+data[i]._id+'" data-title="'+data[i].title+'">'+data[i].title+'</option>';
                                $("#showchooser").append(opt);
                            }
                      
                            $("#scheduleshow").fadeIn();
                            $("#showscheduleform input[name='start']").val(
                            date.getFullYear()+'/'+padNum(date.getMonth()+1,2)+'/'+padNum(date.getDate(),2)+' '+
                                padNum(date.getHours(),2)+':'+padNum(date.getMinutes(),2)
                        );
                            date.setTime(date.getTime()+3600000);
                            $("#showscheduleform input[name='end']").val(
                            date.getFullYear()+'/'+padNum(date.getMonth()+1,2)+'/'+padNum(date.getDate(),2)+' '+
                                padNum(date.getHours(),2)+':'+padNum(date.getMinutes(),2)
                        );
                            return true;
                        });
                    }
                }
            });
                
            $("#calendar").fullCalendar('changeView','agendaWeek');
            for(var i=0;i<data.length;i++) {
                data[i].allDay=data[i].allDay=='true';
            }
            $("#calendar").fullCalendar('addEventSource',data);
            return true;
        });
    } else {
        $("#calendar").empty();
    }
}

/**
 * $(document).ready
 */
$(document).ready(function() {

    // main menu / tabs click event
    $("#mainmenu span").click(function() {
        console.log($(this).data('applet'));
        if($(this).hasClass('inactive')) {
            $(".applet").fadeOut('slow');
            $("#"+$(this).data('applet')).fadeIn('slow');
            $("#mainmenu span").removeClass('active');
            $("#mainmenu span").addClass('inactive');
            $(this).removeClass('inactive');
            $(this).addClass('active');
            if($(this).data('applet')=='schedules') {
                updateSchedules();
            }
        }
        
    });
                
    /**
     * Schedule applet
     */
    
    // change event handler for the schedule chooser
    $("#schedules .schedulechooser").change(function() {
        if($("#schedules .schedulechooser").val()=='*') {
            $("#newschedulename").fadeIn('slow');
            $("#createschedule").fadeIn('slow');
        } else {
            $("#newschedulename").fadeOut('slow');
            $("#createschedule").fadeOut('slow');
            $.Storage.set('schedule',$("#schedules .schedulechooser").val());
            updateSchedules();
        }
    });
    
    // create schedule control click handler
    $("#createschedule").click(function() {
        loading();
        $.post('upload/save.php','collection=schedule&name='+$("#newschedulename").val()+'&_id=*',function(data) {
            loadingDone();            
            updateScheduleChooser();
        });    
    });
    
    //
    // scheduleshow dialog
    //
    
    $("#scheduleshow .cancel").click(function() {
        $("#scheduleshow").fadeOut();
    });
    
    
    $("#scheduleshow .save").click(function() {
        // create event object
        var startt = new Date($("#showscheduleform input[name='start']").val()).getTime()/1000;
        var endt = new Date($("#showscheduleform input[name='end']").val()).getTime()/1000;
        var e = [ {
                title: $("#showscheduleform select option[value='"+$("#showchooser").val()+"']").text(),
                show: $("#showchooser").val(),
                start: startt,
                end: endt,
                allDay: false
            } ];
        console.log(e);
        // save object to server, reload calendar on success
        yayPOST('upload/save.php',
        'collection=showevent'+
            '&sc='+$.Storage.get('schedule')+
            '&sh='+e[0].show+
            '&title='+e[0].title+
            '&start='+e[0].start+
            '&end='+e[0].end+
            '&allDay='+e[0].allDay,
            function(data) {
                console.log(data);
                $("#scheduleshow").fadeOut('slow');
                e[0]._id=data._id;
                e[0].id=data._id;
        
                $("#calendar").fullCalendar('addEventSource',e);
                $("#calendar").fullCalendar('render');
                
                return true;
        }
    );
    });
    
    //
    // lists
    //
    
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

    //
    // date/time picker elements
    //
    $("#editepisode form input[name='start']").datetimepicker({
        dateFormat:'yy/mm/dd'
    });
    $("#editepisode form input[name='end']").datetimepicker({
        dateFormat:'yy/mm/dd'
    });
    $("#showscheduleform input[name='start']").datetimepicker({
        dateFormat:'yy/mm/dd'
    });
    $("#showscheduleform input[name='end']").datetimepicker({
        dateFormat:'yy/mm/dd'
    });

    //
    // audio edit dialog
    //
    
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
    
    // transcode audio
    $("#edit .transcode").click(function() {
        var id=$("#edit form input[name='_id']").val();
        transcode(id,$(this).attr('data-fmt'));
    });

    // set preview player (<audio> tag) file format, transcode if needed
    $("#edit .playerfmt").change(function(event) {
        console.log(event);
        var fmt=$("#edit .playerfmt").val();
       
        var meta=$("#edit").data('subject');
       
        if(fmt!='flac' && !(meta['has_'+fmt] && meta['has_'+fmt]==1)) {
            transcode(meta._id,fmt);
        } else {
            $("#edit .player").attr('src','upload/uploads/'+meta._id+'.'+fmt);
        }
       
    });

    //
    // edit show dialog
    //
    
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

    //
    // edit episode dialog
    //
    
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
    
    $("#newepisode").click(function() {
        editEpisode('*');
    });
    
    
    //
    // schedule applet
    //
    
    $("#newschedulename").click(function() {
        if($("#newschedulename").val()=='New schedule name..')
            $("#newschedulename").val('');
    });
    $("#newschedulename").focusout(function() {
        if($("#newschedulename").val()=='')
            $("#newschedulename").val('New schedule name..');        
    });
    
    //
    // handle fle uploads
    //
    $('#fileupload').fileupload({
        dataType: 'json',
        url: 'upload/upload.php',
        autoUpload: false,
        done: function (e, data) {
            for(var i=0;i<data.result.length;i++) {

                if(data.result[i].error==0) {
                    editAudio(data.result[i]._id);
                } else {
                    alert('Error uploading file: ('+data.result[i].error+') '+data.result[i].msg);
                }


            }
        },
        progress: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            Console.log(progress);
        },
        send: function(e,data) {
            loading();
        }
    });
    
    //
    // select initial applet
    //
    $("#mainmenu span[data-applet='schedules']").click();
    
}); // end of $(document).ready
